import type { Metadata } from "next";

import { Brand } from "@/components/brand";

import { getRelease, versionOf, type Asset, type Platform } from "@/lib/release";

export const metadata: Metadata = {
  alternates: { canonical: "https://keew-get.vercel.app" },
};

export const revalidate = 600;

const APP = "https://keew-ia.vercel.app";

/** "12.4 MB" — the only number on the page, and only when the file exists. */
function size(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

type Row = {
  id: Platform | "web";
  name: string;
  logo: string;
  /** the file extension, shown only once the file exists */
  file?: string;
  preferred?: (a: Asset) => boolean;
};

/**
 * The list. The browser comes first because it is the one that works right
 * now — a person who does not find their system should not have to read
 * further than the first row.
 */
const ROWS: Row[] = [
  { id: "web", name: "Navegador", logo: "/logos/chrome.png" },
  { id: "android", name: "Android", logo: "/logos/android.png", file: "APK" },
  { id: "ios", name: "iPhone e iPad", logo: "/logos/apple.png", file: "IPA" },
  { id: "windows", name: "Windows", logo: "/logos/windows.svg", file: "EXE", preferred: (a) => !/portable/i.test(a.name) },
  { id: "mac", name: "macOS", logo: "/logos/mac.png", file: "DMG" },
  { id: "linux", name: "Linux", logo: "/logos/linux.png", file: "AppImage" },
];

export default async function Page() {
  const release = await getRelease();
  const version = versionOf(release.assets) ?? release.version;

  const forPlatform = (id: Platform) => {
    const all = release.assets.filter((a) => a.platform === id);
    const row = ROWS.find((r) => r.id === id);
    const pick = row?.preferred ? all.find(row.preferred) ?? all[0] : all[0];
    return { pick, count: all.length };
  };

  return (
    <main className="relative min-h-screen">
      <div className="glow" aria-hidden />

      <header className="relative z-10 mx-auto flex max-w-2xl items-center justify-between px-5 pt-6">
        <a href={APP} className="flex items-center gap-2.5">
          {/* a marca, sem placa atrás */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" width={30} height={30} className="block" />
          <Brand className="text-[15px] font-bold tracking-tight text-fg" />
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-14 sm:pt-16">
        <h1 className="rise text-center text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-fg sm:text-[46px]">
          Baixar a Keen
        </h1>
        <p className="rise mx-auto mt-3 max-w-sm text-center text-[13.5px] leading-relaxed text-muted">
          Escolha onde você vai usar.
        </p>

        {version && <p className="mt-2 text-center text-[11.5px] text-dim">{version}</p>}

        <div className="mt-9 space-y-2.5">
          {ROWS.map(({ id, name, logo, file, ...row }, i) => {
            const isWeb = id === "web";
            const { pick } = isWeb ? { pick: undefined } : forPlatform(id as Platform);
            const ready = isWeb || Boolean(pick);

            return (
              <div
                key={id}
                className="rise card flex items-center gap-4 px-4 py-3.5 sm:px-5"
                data-unavailable={!ready}
                style={{ animationDelay: `${60 + i * 45}ms` }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={logo} alt="" width={34} height={34} className="block" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-fg">{name}</span>
                  {ready && pick && file && (
                    <span className="block truncate text-[11.5px] text-dim">
                      {file} · {size(pick.size)}
                    </span>
                  )}
                </span>

                {isWeb ? (
                  <a href={APP} className="btn shrink-0">
                    Acessar
                  </a>
                ) : ready && pick ? (
                  <a href={pick.url} className="btn shrink-0" download>
                    Baixar
                  </a>
                ) : (
                  <span className="shrink-0 rounded-lg border border-line px-3 py-2 text-[12px] text-dim">
                    em breve
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <footer className="relative z-10 mx-auto max-w-2xl px-5 pb-8 text-[11.5px] text-dim">
        <Brand />
      </footer>
    </main>
  );
}
