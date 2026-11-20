/**
 * What is actually downloadable right now.
 *
 * The page does not hard-code file names. It asks the GitHub Release what is
 * in it and lists exactly those assets. A card with no matching file says the
 * build has not run yet — it never shows a download button that 404s, because
 * a dead download button on a page called "download" is worse than none.
 *
 * The request is cached for ten minutes, so the page stays fast and GitHub is
 * not asked on every visit.
 */

const REPO = "Veexdevs/Keew-IA";
const TAG = "installers";

export type Platform = "android" | "ios" | "windows" | "mac" | "linux";

export type Asset = {
  name: string;
  url: string;
  size: number;
  platform: Platform | null;
};

export type Release = {
  available: boolean;
  tag: string;
  published: string | null;
  version: string | null;
  assets: Asset[];
  /** why there is nothing to show, when there is nothing */
  reason: "ok" | "not-built" | "unreachable";
};

/** Which platform an asset belongs to, from its name. */
function platformOf(name: string): Platform | null {
  const n = name.toLowerCase();
  if (n.endsWith(".apk")) return "android";
  if (n.endsWith(".ipa")) return "ios";
  if (n.endsWith(".dmg") || (n.endsWith(".zip") && n.includes("mac"))) return "mac";
  if (n.endsWith(".exe") || (n.endsWith(".zip") && n.includes("win"))) return "windows";
  if (n.endsWith(".appimage") || n.endsWith(".deb") || n.endsWith(".rpm")) return "linux";
  return null;
}

type GhAsset = { name: string; browser_download_url: string; size: number; state?: string };
type GhRelease = {
  tag_name: string;
  published_at: string | null;
  name: string | null;
  assets: GhAsset[];
};

export async function getRelease(): Promise<Release> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  /* a token is optional; without it GitHub allows 60 requests an hour per IP,
     which is plenty for a page cached for ten minutes */
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/tags/${TAG}`, {
      headers,
      next: { revalidate: 600 },
    });

    if (res.status === 404) {
      return {
        available: false,
        tag: TAG,
        published: null,
        version: null,
        assets: [],
        reason: "not-built",
      };
    }

    if (!res.ok) throw new Error(`GitHub ${res.status}`);

    const data = (await res.json()) as GhRelease;
    const assets: Asset[] = (data.assets ?? [])
      .filter((a) => a.state !== "starter" && platformOf(a.name) !== null)
      .map((a) => ({
        name: a.name,
        url: a.browser_download_url,
        size: a.size,
        platform: platformOf(a.name),
      }));

    /* the version is the newest commit date the release points at, when the
       release body carries it; otherwise the publish date in short form */
    const published = data.published_at;

    return {
      available: assets.length > 0,
      tag: data.tag_name ?? TAG,
      published,
      version: published ? new Date(published).toISOString().slice(0, 10) : null,
      assets,
      reason: assets.length > 0 ? "ok" : "not-built",
    };
  } catch {
    /* the phone app is still listed: it comes from the web, not from here */
    return {
      available: false,
      tag: TAG,
      published: null,
      version: null,
      assets: [],
      reason: "unreachable",
    };
  }
}

/** "Keen IA Setup 1.0.0.exe" → "1.0.0" */
export function versionOf(assets: Asset[]): string | null {
  for (const a of assets) {
    const m = a.name.match(/\b(\d+\.\d+\.\d+)\b/);
    if (m) return m[1];
  }
  return null;
}
