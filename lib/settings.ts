"use client";

/**
 * Preferences: theme, text size, density and motion.
 *
 * Kept in the browser so they apply instantly and survive without an account.
 * With an account, the same values are mirrored to the profiles row, so a
 * second device picks them up on sign-in.
 */
import { create } from "zustand";

import { supabaseBrowser } from "./supabase/client";

export type Theme = "dark" | "light" | "gray";
export type Density = "comfortable" | "compact";

export type Prefs = {
  theme: Theme;
  /** 0.9 smaller · 1 default · 1.2 larger */
  textScale: number;
  density: Density;
  motion: "full" | "reduced";
  showTimes: boolean;
  enterToSend: boolean;
  cacheChats: boolean;
};

const DEFAULTS: Prefs = {
  theme: "dark",
  textScale: 1,
  density: "comfortable",
  motion: "full",
  showTimes: true,
  enterToSend: true,
  cacheChats: true,
};

const LS_KEY = "keew-ia-prefs-v1";

function load(): Prefs {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) };
  } catch {
    return DEFAULTS;
  }
}

function persist(p: Prefs) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked */
  }
}

/** Writes a preference set onto the document, where the CSS reads it. */
export function applyPrefs(p: Prefs) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.dataset.theme = p.theme;
  root.dataset.density = p.density;
  root.dataset.motion = p.motion;
  root.style.fontSize = `${16 * p.textScale}px`;
}

type State = {
  prefs: Prefs;
  ready: boolean;
  hydrate: () => void;
  set: <K extends keyof Prefs>(key: K, value: Prefs[K]) => void;
  reset: () => void;
};

export const usePrefs = create<State>()((set, get) => ({
  prefs: DEFAULTS,
  ready: false,

  hydrate: () => {
    if (get().ready) return;
    const prefs = load();
    applyPrefs(prefs);
    set({ prefs, ready: true });
  },

  set: (key, value) => {
    const prefs = { ...get().prefs, [key]: value };
    set({ prefs });
    applyPrefs(prefs);
    persist(prefs);

    const sb = supabaseBrowser();
    if (!sb) return;
    void sb.auth.getUser().then(({ data }) => {
      if (data.user) void sb.from("profiles").update({ prefs }).eq("id", data.user.id);
    });
  },

  reset: () => {
    set({ prefs: DEFAULTS });
    applyPrefs(DEFAULTS);
    persist(DEFAULTS);
  },
}));
