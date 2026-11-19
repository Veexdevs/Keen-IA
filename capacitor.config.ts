/**
 * Keew IA — the shell that turns the site into a phone app.
 *
 * The app inside is the same Next.js build the browser loads: one codebase,
 * one database, one login. Capacitor only wraps it in the container Android
 * and iOS expect, which is what produces the .apk and the .ipa.
 *
 * `server.url` points at the deployed site so the phone app and the website
 * can never drift apart. For a fully offline bundle, run `npx cap copy` after
 * exporting the site to ./out and drop the server block.
 */
/* The shape is declared here instead of imported: this file has to type-check
   before @capacitor/cli is installed, and the site build must never depend on
   the phone toolchain. */
type CapacitorConfig = {
  appId: string;
  appName: string;
  webDir: string;
  backgroundColor?: string;
  android?: { allowMixedContent?: boolean; backgroundColor?: string };
  ios?: { contentInset?: string; backgroundColor?: string };
  server?: { url: string; cleartext: boolean };
};

const config: CapacitorConfig = {
  appId: "ai.keew.app",
  appName: "Keew IA",
  webDir: "public",
  backgroundColor: "#0a0a0a",
  android: {
    allowMixedContent: false,
    backgroundColor: "#0a0a0a",
  },
  ios: {
    contentInset: "always",
    backgroundColor: "#0a0a0a",
  },
  server: {
    url: "https://keew-ia.vercel.app",
    cleartext: false,
  },
};

export default config;
