/**
 * TMDB discover `with_original_language` expects ISO 639-1 codes.
 * Maps our UI locale (region + language) to filter movies by original spoken language.
 */
export function originalLanguageForDiscover(
  watchRegion: string,
  uiLanguage: string
): string | undefined {
  const region = watchRegion.toUpperCase();

  if (region === "IN") {
    const map: Record<string, string> = {
      "hi-IN": "hi",
      "ta-IN": "ta",
      "te-IN": "te",
      "ml-IN": "ml",
    };
    return map[uiLanguage];
  }

  if (region === "US" && uiLanguage === "en-US") return "en";
  if (region === "GB" && uiLanguage === "en-GB") return "en";

  return undefined;
}
