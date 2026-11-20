import type { Metadata } from "next";

import { LogosAndroid, LogosApple, LogosLinux, LogosMac, LogosWindows } from "@/components/logos";
import { getRelease, versionOf, type Asset, type Platform } from "@/lib/release";

export const metadata: Metadata = {
  alternates: { canonical: "https://keew-get.vercel.app" },
};

export const revalidate = 600;

const APP = "https://keew-ia.vercel.app";
const REPO = "https://github.com/Veexdevs/Keew-IA";

function size(bytes: number) {
  if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

type Row = {
  id: Platform;
  name: string;
  file: string;
  Logo: (p: { size?: number; className?: string }) => React.ReactElement;
  /** pick the file to offer when there is more than one */
  preferred?: (a: Asset) => boolean;
};

/**
 * The five builds, in the order a person is most likely to look. Nothing here
 * mentions the web version: this page has one job, and it is handing over a
 * file.
 */
const ROWS: Row[] = [
  { id: "android", name: "Android", file: "APK", Logo: LogosAndroid },
  { id: "ios", name: "iPhone e iPad", file: "IPA", Logo: LogosApple },
  { id: "windows", name: "Windows", file: "EXE", Logo: LogosWindows, preferred: (a) => !/portable/i.test(a.name) },
  { id: "mac", name: "macOS", file: "DMG", Logo: LogosMac },
  { id: "linux", name: "Linux", file: "AppImage / DEB", Logo: LogosLinux },
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

      <header className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 pt-6">
        <a href={APP} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mark.svg" alt="" width={28} height={28} className="block" />
          <span className="text-[15px] font-bold tracking-tight text-fg">
            Keew <span className="text-accent-soft">IA</span>
          </span>
        </a>
        <a
          href={REPO}
          className="text-[12.5px] text-dim transition-colors hover:text-fg"
          rel="noreferrer"
        >
          GitHub
        </a>
      </header>

      <section className="relative z-10 mx-auto max-w-3xl px-5 pb-16 pt-14 sm:pt-16">
        <h1 className="rise text-center text-[34px] font-extrabold leading-[1.08] tracking-[-0.03em] text-fg sm:text-[46px]">
          Baixar a Keew
        </h1>
        <p className="rise mx-auto mt-3 max-w-md text-center text-[13.5px] leading-relaxed text-muted">
          Escolha o seu sistema. A mesma conta, as mesmas conversas.
        </p>

        {version && (
          <p className="mt-2 text-center text-[11.5px] text-dim">versão {version}</p>
        )}

        <div className="mt-9 space-y-2.5">
          {ROWS.map(({ id, name, file, Logo, ...row }, i) => {
            const { pick, count } = forPlatform(id);
            const ready = Boolean(pick);
            return (
              <div
                key={id}
                className="rise card flex items-center gap-4 px-4 py-3.5 sm:px-5"
                data-unavailable={!ready}
                style={{ animationDelay: `${60 + i * 45}ms` }}
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.05]">
                  <Logo size={26} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-semibold text-fg">{name}</span>
                  <span className="block truncate text-[11.5px] text-dim">
                    {ready && pick ? `${file} · ${size(pick.size)}` : "compilando…"}
                  </span>
                </span>

                {ready && pick ? (
                  <a
                    href={pick.url}
                    className="btn shrink-0"
                    download
                  >
                    Baixar
                    <span className="sr-only"> para {name}</span>
                  </a>
                ) : (
                  <span className="shrink-0 rounded-lg border border-line px-3 py-2 text-[12px] text-dim">
                    em breve
                  </span>
                )}

                {count > 1 && ready && (
                  <a
                    href={`${REPO}/releases/tag/${release.tag}`}
                    className="hidden shrink-0 text-[11.5px] text-dim underline-offset-2 hover:text-fg hover:underline sm:block"
                    rel="noreferrer"
                  >
                    +{count - 1}
                  </a>
                )}
              </div>
            );
          })}
        </div>

        <p className="mt-7 text-center text-[11.5px] leading-relaxed text-dim">
          Os arquivos não são assinados — o Windows avisa no SmartScreen e o macOS pede
          para abrir mesmo assim.
        </p>
      </section>

      <footer className="relative z-10 mx-auto flex max-w-3xl items-center justify-between px-5 pb-8 text-[11.5px] text-dim">
        <span>Keew IA · Veexdevs</span>
        <a href={REPO} className="hover:text-fg" rel="noreferrer">
          Código
        </a>
      </footer>
    </main>
  );
}
