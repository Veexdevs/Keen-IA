import type { NextConfig } from "next";

/**
 * The download site.
 *
 * It is a separate project on purpose: it has no chat, no session, no
 * database and no auth, so nothing here can leak into the app and nothing in
 * the app can slow it down. One page, a few assets, no client-side routing.
 */
const config: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  /* this folder is its own project inside the repo, not part of the app */
  outputFileTracingRoot: __dirname,
};

export default config;
