export const WATCH_REGIONS = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom (UK)" },
  { code: "CA", label: "Canada" },
  { code: "NL", label: "Netherlands" },
  { code: "AE", label: "UAE" },
] as const;

export type WatchRegionCode = (typeof WATCH_REGIONS)[number]["code"];

export type ContentLanguageCode =
  | "hi"
  | "ta"
  | "te"
  | "ml"
  | "en"
  | "kn"
  | "mr"
  | "bn"
  | "pa"
  | "ja"
  | "ko"
  | "nl"
  | "ar"
  | "fr";

export const ALL_CONTENT_LANGUAGES: readonly {
  code: ContentLanguageCode;
  label: string;
}[] = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "ml", label: "Malayalam" },
  { code: "kn", label: "Kannada" },
  { code: "mr", label: "Marathi" },
  { code: "bn", label: "Bengali" },
  { code: "pa", label: "Punjabi" },
  { code: "ja", label: "Japanese" },
  { code: "ko", label: "Korean" },
  { code: "nl", label: "Dutch" },
  { code: "ar", label: "Arabic" },
  { code: "fr", label: "French" },
] as const;

export const DEFAULT_LANGUAGES_FOR_REGION: Record<
  WatchRegionCode,
  ContentLanguageCode[]
> = {
  IN: ["hi", "en"],
  US: ["en"],
  GB: ["en"],
  CA: ["en", "fr"],
  NL: ["nl", "en"],
  AE: ["ar", "en"],
};

const ALL_LANGUAGE_CODES = new Set<string>(
  ALL_CONTENT_LANGUAGES.map((l) => l.code)
);

export function isValidContentLanguage(
  code: string
): code is ContentLanguageCode {
  return ALL_LANGUAGE_CODES.has(code);
}

export function languageLabel(code: ContentLanguageCode): string {
  return (
    ALL_CONTENT_LANGUAGES.find((l) => l.code === code)?.label ?? code
  );
}

const VALID_REGION_CODES = new Set<string>(
  WATCH_REGIONS.map((r) => r.code)
);

export function parseWatchRegionCookie(
  value: string | undefined
): WatchRegionCode {
  const u = value?.trim().toUpperCase();
  if (u && VALID_REGION_CODES.has(u)) return u as WatchRegionCode;
  return "IN";
}

export function parseContentLanguagesCookie(
  value: string | undefined
): ContentLanguageCode[] | null {
  if (!value) return null;
  const codes = value
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(isValidContentLanguage);
  return codes.length > 0 ? codes : null;
}

/** Migrate old "hi-IN" style language code to ISO 639-1 */
export function migrateOldLanguageCode(
  oldCode: string
): ContentLanguageCode | null {
  const iso = oldCode.split("-")[0]?.toLowerCase();
  if (iso && isValidContentLanguage(iso)) return iso;
  return null;
}

export const MAX_LANGUAGES = 5;
