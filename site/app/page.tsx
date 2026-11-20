import type { Metadata } from "next";

import { Brand } from "@/components/brand";

import { getRelease, versionOf, type Asset, type Platform } from "@/lib/release";

export const metadata: Metadata = {
  alternates: { canonical: "https://keew-get.vercel.app" },
};

export const revalidate = 600;

const APP = "https://keew-ia.vercel.app";
const REPO = "https://github.com/Veexdevs/Keew-IA";

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
          {/* the mark, no plate behind it */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" width={30} height={30} className="block" />
          <Brand className="text-[15px] font-bold tracking-tight text-fg" />
        </a>
        <a
          href={REPO}
          className="text-[12.5px] text-dim transition-colors hover:text-fg"
          rel="noreferrer"
          aria-label="Código no GitHub"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 .5A11.5 11.5 0 0 0 .5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.55v-2c-3.2.7-3.88-1.37-3.88-1.37-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.8 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.12 3.05.74.81 1.18 1.84 1.18 3.1 0 4.43-2.69 5.4-5.26 5.69.41.36.78 1.06.78 2.14v3.17c0 .3.2.66.8.55A11.5 11.5 0 0 0 23.5 12 11.5 11.5 0 0 0 12 .5Z" />
          </svg>
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-2xl px-5 pb-16 pt-14 sm:pt-16">
        <h1 className="rise text-center text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-fg sm:text-[46px]">
          Baixar a Keew
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

      <footer className="relative z-10 mx-auto flex max-w-2xl items-center justify-between px-5 pb-8 text-[11.5px] text-dim">
        <Brand />
        <a href={REPO} className="hover:text-fg" rel="noreferrer">
          Código
        </a>
      </footer>
    </main>
  );
}
