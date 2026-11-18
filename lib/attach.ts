"use client";

/**
 * Reading attachments in the browser.
 *
 * Images and videos get a small preview generated here, on the device, so the
 * message can show what was sent without uploading megabytes to the database.
 * Text files get their content extracted, because that is what actually feeds
 * an answer.
 */

export type AttachmentKind = "image" | "video" | "audio" | "file";

export type Attachment = {
  id: string;
  name: string;
  mime: string;
  size: number;
  kind: AttachmentKind;

  /** Small preview kept with the message (image, or a frame of the video). */
  thumb?: string;

  /** Object URL for this session only — never saved. */
  url?: string;

  /** Extracted text, for formats that have any. */
  text?: string;

  /** True when the file itself is not stored, only its preview. */
  previewOnly?: boolean;
};

const THUMB_MAX = 640;
const TEXT_LIMIT = 400_000;

const TEXTUAL =
  /\.(md|txt|json|csv|tsv|ts|tsx|js|jsx|mjs|cjs|py|c|h|cpp|hpp|cs|java|kt|rs|go|rb|php|swift|html|css|scss|sql|yml|yaml|toml|xml|sh|env|gitignore|log)$/i;

export function kindOf(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type.startsWith("audio/")) return "audio";
  return "file";
}

/** Draws a scaled copy of an image onto a canvas and returns a JPEG data URL. */
async function imageThumb(file: File): Promise<string | undefined> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, THUMB_MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    return canvas.toDataURL("image/jpeg", 0.72);
  } catch {
    return undefined;
  }
}

/** Grabs a frame from a video at ~0.4s, which is usually past the black fade-in. */
function videoThumb(file: File): Promise<string | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    let settled = false;

    const done = (value?: string) => {
      if (settled) return;
      settled = true;
      video.removeAttribute("src");
      video.load();
      URL.revokeObjectURL(url);
      resolve(value);
    };

    const timer = setTimeout(() => done(undefined), 6000);

    video.muted = true;
    video.playsInline = true;
    video.preload = "metadata";
    video.onloadeddata = () => {
      video.currentTime = Math.min(0.4, (video.duration || 1) / 2);
    };
    video.onseeked = () => {
      try {
        const scale = Math.min(1, THUMB_MAX / Math.max(video.videoWidth, video.videoHeight));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
        canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
        const ctx = canvas.getContext("2d");
        if (!ctx) return done(undefined);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        clearTimeout(timer);
        done(canvas.toDataURL("image/jpeg", 0.7));
      } catch {
        clearTimeout(timer);
        done(undefined);
      }
    };
    video.onerror = () => {
      clearTimeout(timer);
      done(undefined);
    };
    video.src = url;
  });
}

export async function readAttachment(file: File): Promise<Attachment> {
  const kind = kindOf(file);
  const base: Attachment = {
    id: crypto.randomUUID(),
    name: file.name,
    mime: file.type || "application/octet-stream",
    size: file.size,
    kind,
  };

  if (kind === "image") {
    return { ...base, thumb: await imageThumb(file), url: URL.createObjectURL(file), previewOnly: true };
  }

  if (kind === "video") {
    return { ...base, thumb: await videoThumb(file), url: URL.createObjectURL(file), previewOnly: true };
  }

  if (kind === "audio") {
    return { ...base, url: URL.createObjectURL(file), previewOnly: true };
  }

  const isText = file.type.startsWith("text/") || file.type === "application/json" || TEXTUAL.test(file.name);
  if (isText && file.size < TEXT_LIMIT) {
    try {
      const text = await file.text();
      return { ...base, text };
    } catch {
      return base;
    }
  }

  // PDFs and other binaries: named, not parsed. Saying so beats pretending.
  return { ...base, previewOnly: true };
}

/** Drops the session-only fields before anything goes to the database. */
export function persistable(a: Attachment): Attachment {
  const { url: _url, ...rest } = a;
  return rest;
}

export const formatSize = (bytes: number) =>
  bytes < 1024
    ? `${bytes} B`
    : bytes < 1_048_576
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / 1_048_576).toFixed(1)} MB`;
