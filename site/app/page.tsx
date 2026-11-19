import type { Metadata } from "next";

import { Badge, Download, Mark, Phone, Spark, WindowsMark, TuxMark } from "@/components/art";
import { getRelease, versionOf } from "@/lib/release";

export const metadata: Metadata = {
  alternates: { canonical: "https://keew-get.vercel.app" },
};

export const revalidate = 600;

const APP = "https://keew-ia.vercel.app";
const REPO = "https://github.com/Veexdevs/Keew-IA";

function kb(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

export default async function Page() {
  const release = await getRelease();
  const version = versionOf(release.assets) ?? release.version;

  const find = (p: string) => release.assets.find((a) => a.platform === p);

  const android = find("android");
  const ios = find("ios");
  const windows = find("windows");
  const linux = find("linux") ?? release.assets.find((a) => a.platform === "linux");

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="glow" aria-hidden />
      <div className="grid-lines" aria-hidden />

      {/* ── head ──────────────────────────────────────────────────────────── */}
      <header className="relative z-10 mx-auto flex max-w-5xl items-center justify-between px-6 pt-7">
        <a href={APP} className="flex items-center gap-2.5 group">
          <Mark size={26} />
          <span className="text-[15px] font-bold tracking-tight text-fg">
            Keew <span className="text-accent-soft">IA</span>
          </span>
          <span className="ml-1 rounded-md border border-line px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-dim">
            get
          </span>
        </a>

        <a
          href={APP}
          className="btn btn-quiet hidden sm:inline-flex"
          aria-label="Abrir o Keew IA no navegador"
        >
          Abrir no navegador
        </a>
      </header>

      {/* ── hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-14 pt-20 text-center sm:pt-24">
        <div className="rise">
          <Badge>
            {release.available && version
              ? `Versão ${version}`
              : release.reason === "not-built"
                ? "Ainda não compilado"
                : "Web disponível agora"}
          </Badge>
        </div>

        <h1
          className="rise mx-auto mt-6 max-w-3xl text-balance text-[40px] font-extrabold leading-[1.05] tracking-[-0.03em] text-fg sm:text-[58px]"
          style={{ animationDelay: "60ms" }}
        >
          Leve a Keew para{" "}
          <span className="bg-gradient-to-r from-accent-soft to-white bg-clip-text text-transparent">
            todos os lugares
          </span>
        </h1>

        <p
          className="rise mx-auto mt-5 max-w-xl text-pretty text-[15px] leading-relaxed text-muted sm:text-[16.5px]"
          style={{ animationDelay: "120ms" }}
        >
          Escolha onde ela vai morar. A mesma conta, as mesmas conversas — a web
          instala em dois toques, sem loja de aplicativos.
        </p>

        <div
          className="rise mt-8 flex flex-wrap items-center justify-center gap-2.5"
          style={{ animationDelay: "180ms" }}
        >
          <a href={APP} className="btn">
            <Spark size={15} />
            Usar agora no navegador
          </a>
          <a href="#plataformas" className="btn btn-quiet">
            Ver os aplicativos
          </a>
        </div>
      </section>

      {/* ── platforms ─────────────────────────────────────────────────────── */}
      <section id="plataformas" className="relative z-10 mx-auto max-w-5xl scroll-mt-10 px-6 pb-20">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-dim">
              Plataformas
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {release.available
                ? "Os arquivos abaixo vêm do último build publicado."
                : "Os aplicativos nativos ainda estão sendo compilados — a web já funciona."}
            </p>
          </div>
          {release.published && (
            <span className="hidden shrink-0 text-[12px] text-dim sm:block">
              Atualizado em{" "}
              {new Date(release.published).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <div className="grid gap-3.5 sm:grid-cols-2">
          <Card
            icon={<Phone />}
            name="Android"
            meta={android ? `.apk · ${kb(android.size)}` : "Google Play · em breve"}
            asset={android}
            note="Instale permitindo apps de fora da loja. A web também instala pelo Chrome."
            primary={
              <a href={`${APP}`} className="btn">
                Instalar pelo navegador
              </a>
            }
            fallback="A web instala em dois toques pelo Chrome, sem loja."
          />

          <Card
            icon={<Phone />}
            name="iPhone e iPad"
            meta={ios ? `.ipa · ${kb(ios.size)} · sem assinatura` : "App Store · em breve"}
            asset={ios}
            note="O arquivo não é assinado: instale com AltStore ou Sideloadly."
            primary={
              <a href={`${APP}`} className="btn">
                Adicionar à Tela de Início
              </a>
            }
            fallback="No Safari: compartilhar → Adicionar à Tela de Início."
          />

          <Card
            icon={<WindowsMark />}
            name="Windows"
            meta={
              windows
                ? `${windows.name.endsWith(".exe") ? "Instalador" : "Portátil"} · ${kb(windows.size)}`
                : "Windows 10 e 11 · 64 bits"
            }
            asset={windows}
            note="Sem certificado de assinatura: o SmartScreen avisa na primeira abertura."
            fallback="A compilação do Windows roda no GitHub Actions e ainda não foi gerada."
          />

          <Card
            icon={<TuxMark />}
            name="Linux"
            meta={linux ? `${linux.name.split(".").pop()?.toUpperCase()} · ${kb(linux.size)}` : "AppImage e .deb"}
            asset={linux}
            note="AppImage: dê permissão de execução e abra. .deb: sudo dpkg -i."
            fallback="A compilação do Linux roda no GitHub Actions e ainda não foi gerada."
          />
        </div>

        {/* the one thing that always works */}
        <div className="mt-3.5 flex flex-col items-start justify-between gap-4 rounded-[18px] border border-accent/25 bg-accent/[0.055] p-5 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-start gap-3.5">
            <div className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent/15 text-accent-soft">
              <Spark size={17} />
            </div>
            <div className="min-w-0">
              <p className="text-[14px] font-semibold text-fg">A versão web não espera por nada</p>
              <p className="mt-1 max-w-sm text-[12.5px] leading-relaxed text-muted">
                Abra no navegador e instale pelo menu. Funciona hoje, em qualquer
                sistema, com a sua conta.
              </p>
            </div>
          </div>
          <a href={APP} className="btn w-full shrink-0 sm:w-auto">
            Abrir o Keew IA
          </a>
        </div>
      </section>

      {/* ── how it works ──────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <h2 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-dim">
          Como instalar
        </h2>
        <ol className="mt-4 grid gap-3.5 sm:grid-cols-3">
          {[
            {
              n: "01",
              t: "Abra no navegador",
              d: "Entre em keew-ia.vercel.app e faça login na sua conta — ou crie uma.",
            },
            {
              n: "02",
              t: "Instale pelo menu",
              d: "Chrome: menu → Instalar app. Safari: compartilhar → Adicionar à Tela de Início.",
            },
            {
              n: "03",
              t: "Ou baixe o nativo",
              d: "Os arquivos de Windows, Linux e Android ficam acima, quando o build está pronto.",
            },
          ].map((s) => (
            <li key={s.n} className="card p-5">
              <span className="text-[11px] font-bold tracking-[0.16em] text-accent-soft">{s.n}</span>
              <p className="mt-2.5 text-[13.5px] font-semibold text-fg">{s.t}</p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── honest note ───────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-[18px] border border-line bg-surface/60 p-5">
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.1em] text-dim">
            Sobre os arquivos
          </h2>
          <p className="mt-2.5 max-w-3xl text-[12.5px] leading-relaxed text-muted">
            Os aplicativos nativos são compilados pelo GitHub Actions, cada um no
            sistema que ele exige — Windows para o .exe, macOS para o .ipa, Linux
            para o AppImage, Android SDK para o .apk. Nenhum deles é assinado com
            certificado pago, então o Windows avisa no SmartScreen, o macOS pede
            &ldquo;abrir mesmo assim&rdquo; uma vez, e o .ipa precisa de instalação
            por sideload. Tudo isso está escrito aqui, não escondido.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={`${REPO}/actions`} className="btn btn-quiet" target="_blank" rel="noreferrer">
              Ver a compilação
            </a>
            <a
              href={`${REPO}/releases/tag/installers`}
              className="btn btn-quiet"
              target="_blank"
              rel="noreferrer"
            >
              Todos os arquivos
            </a>
          </div>
        </div>
      </section>

      {/* ── foot ──────────────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-3 px-6 py-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2">
            <Mark size={18} />
            <span className="text-[12.5px] text-muted">
              Keew IA · feito pela Veexdevs
            </span>
          </div>
          <div className="flex items-center gap-5 text-[12.5px]">
            <a href={APP} className="text-muted transition-colors hover:text-fg">
              Abrir o app
            </a>
            <a href={REPO} className="text-muted transition-colors hover:text-fg" target="_blank" rel="noreferrer">
              Código
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ── one platform ────────────────────────────────────────────────────────── */

function Card({
  icon,
  name,
  meta,
  asset,
  note,
  primary,
  fallback,
}: {
  icon: React.ReactNode;
  name: string;
  meta: string;
  asset?: { name: string; url: string; size: number };
  note: string;
  primary?: React.ReactNode;
  fallback: string;
}) {
  return (
    <article className="card flex flex-col p-5" data-unavailable={!asset}>
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-line bg-white/[0.03] text-fg">
          {icon}
        </div>
        {asset ? (
          <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-300">
            pronto
          </span>
        ) : (
          <span className="rounded-full border border-line px-2 py-0.5 text-[10.5px] font-medium text-dim">
            aguardando build
          </span>
        )}
      </div>

      <h3 className="mt-4 text-[15px] font-semibold text-fg">{name}</h3>
      <p className="mt-0.5 text-[11.5px] tracking-wide text-dim">{meta}</p>

      <p className="mt-3 min-h-[34px] text-[12px] leading-relaxed text-muted">{note}</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {asset ? (
          <>
            <a href={asset.url} className="btn" download>
              <Download size={14} />
              Baixar
            </a>
            {primary}
          </>
        ) : (
          primary
        )}
      </div>

      {!asset && <p className="mt-3 text-[11.5px] leading-relaxed text-dim">{fallback}</p>}
    </article>
  );
}
