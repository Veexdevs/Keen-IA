"use client";

/**
 * Makes the site installable.
 *
 * Two things a browser needs before it offers "Install": a manifest (already
 * linked in the layout) and a service worker controlling the page. The worker
 * lives in /public and only caches the shell, so the app opens instantly and
 * still opens with no connection.
 *
 * Registration is deliberately quiet: no toast, no banner, nothing that asks
 * the person to install anything. If the browser offers it, the offer is there.
 */
import { useEffect } from "react";

export function Pwa() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    const register = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* registration is a bonus, never a requirement */
      });
    };

    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}
