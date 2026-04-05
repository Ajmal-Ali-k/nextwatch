export const WATCH_REGIONS = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom (UK)" },
] as const;

export type WatchRegionCode = (typeof WATCH_REGIONS)[number]["code"];

export type UiLanguageCode = "hi-IN" | "ta-IN" | "te-IN" | "ml-IN" | "en-US" | "en-GB";

export const LANGUAGES_BY_REGION: Record<
  WatchRegionCode,
  readonly { code: UiLanguageCode; label: string }[]
> = {
  IN: [
    { code: "hi-IN", label: "Hindi" },
    { code: "ta-IN", label: "Tamil" },
    { code: "te-IN", label: "Telugu" },
    { code: "ml-IN", label: "Malayalam" },
  ],
  US: [{ code: "en-US", label: "English (US)" }],
  GB: [{ code: "en-GB", label: "English (UK)" }],
};

export function defaultLanguageForRegion(region: WatchRegionCode): UiLanguageCode {
  return LANGUAGES_BY_REGION[region][0].code;
}

export function isValidLanguageForRegion(
  region: WatchRegionCode,
  lang: string
): lang is UiLanguageCode {
  return LANGUAGES_BY_REGION[region].some((l) => l.code === lang);
}

export function languageLabelFor(region: WatchRegionCode, code: UiLanguageCode): string {
  return LANGUAGES_BY_REGION[region].find((l) => l.code === code)?.label ?? code;
}

export function parseWatchRegionCookie(value: string | undefined): WatchRegionCode {
  const u = value?.trim().toUpperCase();
  if (u === "IN" || u === "US" || u === "GB") return u;
  return "IN";
}
