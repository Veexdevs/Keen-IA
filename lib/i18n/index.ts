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
 *
 * The catalogue itself is lib/i18n/languages.ts. Twenty of those languages have
 * hand-written dictionaries in dict.ts; the rest are translated on demand. This
 * file only answers one question: which language is this device asking for?
 */

export { canonicalTag, LANGUAGE_BY_TAG, LANGUAGES, primaryTag, type Language } from "./languages";

/** The twenty languages with bundled dictionaries. */
export const LOCALES = [
  "en", "pt-BR", "es", "fr", "de", "it",
  "nl", "pl", "tr", "ru", "uk",
  "ar", "hi", "id", "ja", "ko", "zh", "vi", "th", "he",
] as const;
export type Locale = (typeof LOCALES)[number];

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
