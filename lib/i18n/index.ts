/**
 * Keew IA — interface language.
 *
 * The app speaks the language of the place it is opened from. The first run
 * decides from two signals the browser already knows: the preferred languages
 * and the time zone. No IP lookup, no request to a geolocation service — the
 * country is inferred from the clock the device is already using.
 *
 * Whatever gets detected is only the starting point: the choice lives in
 * Settings → Language and can be changed at any time.
 */

export const LOCALES = [
  "en", "pt-BR", "es", "fr", "de", "it",
  "nl", "pl", "tr", "ru", "uk",
  "ar", "hi", "id", "ja", "ko", "zh", "vi", "th", "he",
] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * The flag codes come from the flag registry itself, so a language can never
 * point at a flag that does not exist — the type is the guarantee.
 */
export type { FlagCode } from "@/components/flags";
import type { FlagCode } from "@/components/flags";

/**
 * `aliases` exist for the search box only.
 *
 * Someone looking for Japanese types "japão", "japones" or "ja" — not
 * "Japanese". Without these, the list matches what the code calls each
 * language instead of what the person calls it.
 */
export const LOCALE_META: Record<
  Locale,
  {
    name: string;
    native: string;
    region: string;
    flag: FlagCode;
    rtl?: boolean;
    aliases?: string;
  }
> = {
  en: { name: "English", native: "English", region: "International", flag: "us", aliases: "inglês ingles inglaterra eua estados unidos usa uk english" },
  "pt-BR": { name: "Portuguese", native: "Português", region: "Brasil · Portugal", flag: "br", aliases: "português portugues brasil brazil portugal pt br" },
  es: { name: "Spanish", native: "Español", region: "España · América Latina", flag: "es", aliases: "espanhol espanol castelhano espanha méxico mexico argentina colombia chile peru" },
  fr: { name: "French", native: "Français", region: "France · Canada · Afrique", flag: "fr", aliases: "francês frances franca frança quebec" },
  de: { name: "German", native: "Deutsch", region: "Deutschland · Österreich · Schweiz", flag: "de", aliases: "alemão alemao alemanha austria áustria suíça suica" },
  it: { name: "Italian", native: "Italiano", region: "Italia", flag: "it", aliases: "italiano itália italia" },
  nl: { name: "Dutch", native: "Nederlands", region: "Nederland · België", flag: "nl", aliases: "holandês holandes neerlandês neerlandes holanda países baixos belgica bélgica" },
  pl: { name: "Polish", native: "Polski", region: "Polska", flag: "pl", aliases: "polonês polones polonia polônia" },
  tr: { name: "Turkish", native: "Türkçe", region: "Türkiye", flag: "tr", aliases: "turco turquia turkce" },
  ru: { name: "Russian", native: "Русский", region: "Россия", flag: "ru", aliases: "russo russia russo" },
  uk: { name: "Ukrainian", native: "Українська", region: "Україна", flag: "ua", aliases: "ucraniano ucrania ucrânia" },
  ar: { name: "Arabic", native: "العربية", region: "MENA · العربية", flag: "sa", rtl: true, aliases: "árabe arabe arabia saudita egito emirados oriente médio médio oriente" },
  hi: { name: "Hindi", native: "हिन्दी", region: "भारत · India", flag: "in", aliases: "hindi índia india indiano" },
  id: { name: "Indonesian", native: "Bahasa Indonesia", region: "Indonesia", flag: "id", aliases: "indonésio indonesio indonésia indonesia bahasa" },
  ja: { name: "Japanese", native: "日本語", region: "Japão · 日本", flag: "jp", aliases: "japonês japones japão japao jp nihongo" },
  ko: { name: "Korean", native: "한국어", region: "Coreia do Sul · 대한민국", flag: "kr", aliases: "coreano coreia do sul coreia sul korea hangul" },
  zh: { name: "Chinese", native: "中文", region: "China · 中国 · 简体", flag: "cn", aliases: "chinês chines china mandarim mandarin cantones" },
  vi: { name: "Vietnamese", native: "Tiếng Việt", region: "Vietnã · Việt Nam", flag: "vn", aliases: "vietnamita vietnã vietna viet nam" },
  th: { name: "Thai", native: "ไทย", region: "Tailândia · ประเทศไทย", flag: "th", aliases: "tailandês tailandes tailandia thai" },
  he: { name: "Hebrew", native: "עברית", region: "Israel · ישראל", flag: "il", rtl: true, aliases: "hebraico israel israelense hebrew" },
};

export const isLocale = (v: unknown): v is Locale =>
  typeof v === "string" && (LOCALES as readonly string[]).includes(v);

/** "pt-br" → "pt-BR" · "es-MX" → "es" · "fr-CA" → "fr" · unknown → null */
/** language subtag → interface locale */
const SUBTAG: Record<string, Locale> = {
  en: "en", pt: "pt-BR", es: "es", fr: "fr", de: "de", it: "it",
  nl: "nl", pl: "pl", tr: "tr", ru: "ru", uk: "uk",
  ar: "ar", hi: "hi", id: "id", in: "id",
  ja: "ja", ko: "ko", zh: "zh",
  vi: "vi", th: "th", he: "he", iw: "he",
};

export function matchLocale(tag: string | undefined | null): Locale | null {
  if (!tag) return null;
  const base = tag.toLowerCase().split(/[-_]/)[0];
  return SUBTAG[base] ?? null;
}

/**
 * Time zone → language, for the case where the browser is set to a language we
 * do not ship but the person is somewhere we do. Kept to zones that are
 * unambiguous about the place.
 */
const ZONE_LOCALE: Record<string, Locale> = {
  // Brazil
  "America/Sao_Paulo": "pt-BR",
  "America/Bahia": "pt-BR",
  "America/Fortaleza": "pt-BR",
  "America/Recife": "pt-BR",
  "America/Manaus": "pt-BR",
  "America/Belem": "pt-BR",
  "America/Cuiaba": "pt-BR",
  "America/Campo_Grande": "pt-BR",
  "America/Porto_Velho": "pt-BR",
  "America/Rio_Branco": "pt-BR",
  "America/Noronha": "pt-BR",
  "America/Araguaina": "pt-BR",
  "America/Maceio": "pt-BR",
  "America/Santarem": "pt-BR",
  "America/Boa_Vista": "pt-BR",
  // Portuguese-speaking beyond Brazil
  "Europe/Lisbon": "pt-BR",
  "Atlantic/Azores": "pt-BR",
  // Spanish-speaking
  "Europe/Madrid": "es",
  "Atlantic/Canary": "es",
  "America/Mexico_City": "es",
  "America/Monterrey": "es",
  "America/Tijuana": "es",
  "America/Bogota": "es",
  "America/Lima": "es",
  "America/Santiago": "es",
  "America/Caracas": "es",
  "America/Argentina/Buenos_Aires": "es",
  "America/Argentina/Cordoba": "es",
  "America/Montevideo": "es",
  "America/Guayaquil": "es",
  "America/La_Paz": "es",
  "America/Asuncion": "es",
  "America/Panama": "es",
  "America/Costa_Rica": "es",
  "America/Guatemala": "es",
  "America/El_Salvador": "es",
  "America/Tegucigalpa": "es",
  "America/Managua": "es",
  "America/Havana": "es",
  "America/Santo_Domingo": "es",
  "America/Puerto_Rico": "es",
  // French-speaking
  "Europe/Paris": "fr",
  "Europe/Brussels": "fr",
  "Europe/Monaco": "fr",
  "America/Montreal": "fr",
  "Canada/Eastern": "fr",
  "Africa/Dakar": "fr",
  "Africa/Abidjan": "fr",
  "Africa/Casablanca": "fr",
  "Africa/Algiers": "fr",
  "Africa/Tunis": "fr",
  "Indian/Reunion": "fr",
  // German-speaking
  "Europe/Berlin": "de",
  "Europe/Vienna": "de",
  "Europe/Zurich": "de",
  "Europe/Luxembourg": "de",
  // Italian-speaking
  "Europe/Rome": "it",
  "Europe/Vatican": "it",
  "Europe/San_Marino": "it",
};

/**
 * Decides the starting language. Order matters: a saved choice wins, then the
 * browser's own preference, then the time zone, then English.
 */
export function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem("keew-ia-locale");
    if (isLocale(saved)) return saved;
  } catch {
    /* storage blocked */
  }

  if (typeof navigator !== "undefined") {
    const list = navigator.languages?.length
      ? navigator.languages
      : navigator.language
        ? [navigator.language]
        : [];
    for (const tag of list) {
      const hit = matchLocale(tag);
      if (hit) return hit;
    }
  }

  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && ZONE_LOCALE[zone]) return ZONE_LOCALE[zone];
  } catch {
    /* Intl unavailable */
  }

  return "en";
}

/** The language the Open-Meteo and Wikipedia calls should prefer. */
export const apiLang = (l: Locale) => (l === "pt-BR" ? "pt" : l);
