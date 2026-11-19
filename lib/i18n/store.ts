"use client";

/**
 * The chosen language.
 *
 * Auto mode follows the device — browser languages first, time zone second.
 * An explicit choice is remembered and wins over auto forever after, until the
 * person switches back to Automatic.
 */
import { create } from "zustand";

import { detectLocale, isLocale, type Locale } from "./index";
import { supabaseBrowser } from "../supabase/client";

type State = {
  /** what is actually in use */
  locale: Locale;
  /** true when following the device */
  auto: boolean;
  ready: boolean;
  hydrate: () => void;
  choose: (value: Locale | "auto") => void;
};

export const useLocale = create<State>()((set, get) => ({
  locale: "en",
  auto: true,
  ready: false,

  hydrate: () => {
    if (get().ready) return;
    let auto = true;
    try {
      auto = localStorage.getItem("keew-ia-locale-auto") !== "0";
    } catch {
      /* storage blocked */
    }
    const locale = auto ? detectLocale() : detectLocale();
    set({ locale, auto, ready: true });
    if (typeof document !== "undefined") document.documentElement.lang = locale;
  },

  choose: (value) => {
    const locale = value === "auto" ? detectLocale() : value;
    const auto = value === "auto";

    set({ locale, auto });
    if (typeof document !== "undefined") document.documentElement.lang = locale;

    try {
      localStorage.setItem("keew-ia-locale", auto ? "" : locale);
      localStorage.setItem("keew-ia-locale-auto", auto ? "1" : "0");
    } catch {
      /* storage blocked */
    }

    const sb = supabaseBrowser();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      if (data.user && isLocale(locale)) {
        void sb.from("profiles").update({ locale }).eq("id", data.user.id);
      }
    });
  },
}));
