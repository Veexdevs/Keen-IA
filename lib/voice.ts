"use client";

/**
 * Ditado: da voz do microfone ao texto no campo.
 *
 * O caminho é curto e vive todo no navegador até o último passo:
 *
 *   MediaRecorder (opus/webm) → decodifica → WAV 16 kHz mono → POST /api/voice
 *
 * Por que converter em vez de mandar o webm: o modelo de transcrição aceita
 * wav, mp3, m4a e afins, mas nem toda versão aceita webm opus, e o Safari grava
 * mp4/aac. Reamostrar para 16 kHz mono num PCM de 16 bits é o formato que todo
 * provedor entende, e 1 minuto fica em ~1,9 MB — cabível no limite da rota.
 *
 * Nada aqui toca em permissões do sistema além do microfone, e nada é guardado:
 * o áudio existe em memória pelo tempo da transcrição e é descartado.
 */

/** Limite da gravação: um minuto é um pedido inteiro, mais que isso é podcast. */
export const MAX_SECONDS = 60;

/** Fronteira do servidor, em bytes. 16 kHz · 16 bits · 1 canal ≈ 32 kB/s. */
const MAX_BYTES = 4_000_000;

export type Recorder = {
  stop: () => Promise<Blob>;
  cancel: () => void;
  /** amplitude 0–1 do microfone agora, para o medidor da interface */
  level: () => number;
  seconds: () => number;
};

/**
 * Pede o microfone e começa a gravar.
 *
 * Devolve um objeto em vez de uma promessa de Blob: a interface precisa mostrar
 * o tempo correndo e responder ao vivo enquanto a pessoa fala.
 */
export async function startRecording(): Promise<Recorder> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("unsupported");
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 },
  });

  /* um formato que o navegador aceite; o Safari só grava mp4 */
  const mime = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"].find(
    (m) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m),
  );

  const chunks: BlobPart[] = [];
  const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
  rec.ondataavailable = (e) => {
    if (e.data.size) chunks.push(e.data);
  };
  rec.start(250);

  const started = Date.now();
  let stopped = false;
  let cancelled = false;

  /* O medidor de nível usa um AnalyserNode no mesmo stream: a barra responde à
     voz de verdade, não a um intervalo fixo do tipo "sempre animado". */
  const AudioCtx =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)
      : undefined;
  const ctx = AudioCtx ? new AudioCtx() : null;
  let analyser: AnalyserNode | null = null;
  if (ctx) {
    const source = ctx.createMediaStreamSource(stream);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
  }
  const data = analyser ? new Uint8Array(analyser.fftSize) : null;

  const teardown = () => {
    stream.getTracks().forEach((t) => t.stop());
    try {
      void ctx?.close();
    } catch {
      /* já fechado */
    }
  };

  const stop = () =>
    new Promise<Blob>((resolve) => {
      if (stopped) return resolve(new Blob(chunks, { type: mime ?? "audio/webm" }));
      stopped = true;
      rec.onstop = () => {
        teardown();
        resolve(new Blob(chunks, { type: mime ?? "audio/webm" }));
      };
      rec.stop();
    });

  return {
    stop,
    cancel: () => {
      cancelled = true;
      void stop();
    },
    level: () => {
      if (!analyser || !data) return 0.25;
      analyser.getByteTimeDomainData(data);
      let peak = 0;
      for (const v of data) peak = Math.max(peak, Math.abs(v - 128) / 128);
      return Math.min(1, peak * 2.4);
    },
    seconds: () => (cancelled ? 0 : Math.round((Date.now() - started) / 1000)),
  };
}

/* ── webm/mp4 → wav 16 kHz mono ──────────────────────────────────────────── */

/**
 * Reamostra para 16 kHz e devolve um WAV PCM de 16 bits.
 *
 * A interpolação é linear. Para voz em 16 kHz isso fica bem acima do necessário
 * (o teto audível útil é ~8 kHz) e evita carregar uma biblioteca de DSP só para
 * um microfone.
 */
export async function toWav(blob: Blob): Promise<Blob> {
  const bytes = await blob.arrayBuffer();
  const AudioCtx =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) throw new Error("unsupported");

  const ctx = new AudioCtx();
  const decoded = await ctx.decodeAudioData(bytes.slice(0));
  void ctx.close();

  const RATE = 16_000;
  const source = decoded.getChannelData(0);
  const ratio = decoded.sampleRate / RATE;
  const length = Math.max(1, Math.floor(source.length / ratio));

  const buffer = new ArrayBuffer(44 + length * 2);
  const view = new DataView(buffer);
  const str = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i));
  };

  str(0, "RIFF");
  view.setUint32(4, 36 + length * 2, true);
  str(8, "WAVE");
  str(12, "fmt ");
  view.setUint32(16, 16, true); // tamanho do bloco fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, RATE, true);
  view.setUint32(28, RATE * 2, true); // bytes por segundo
  view.setUint16(32, 2, true); // alinhamento do bloco
  view.setUint16(34, 16, true); // bits por amostra
  str(36, "data");
  view.setUint32(40, length * 2, true);

  for (let i = 0; i < length; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const frac = pos - i0;
    const a = source[i0] ?? 0;
    const b = source[i0 + 1] ?? a;
    const sample = a + (b - a) * frac;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, sample)) * 0x7fff, true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

/** Transcrição no servidor. O idioma vai como dica, não como camisa de força. */
export async function transcribe(blob: Blob, locale?: string): Promise<string> {
  if (blob.size > MAX_BYTES) throw new Error("too-long");

  const body = new FormData();
  body.append("audio", blob, "ditado.wav");
  if (locale) body.append("locale", locale);

  const res = await fetch("/api/voice", { method: "POST", body });
  if (!res.ok) {
    const code = await res.json().catch(() => ({ error: "unknown" }));
    throw new Error(typeof code?.error === "string" ? code.error : "unknown");
  }
  const data = (await res.json()) as { text?: string };
  return (data.text ?? "").trim();
}
