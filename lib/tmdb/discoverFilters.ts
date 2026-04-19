import type { ContentLanguageCode } from "@/lib/regionLanguagePrefs";

/**
 * Build the `with_original_language` value for a single TMDB discover request.
 * ContentLanguageCode is already ISO 639-1, so this is a passthrough.
 */
export function originalLanguageParam(
  lang: ContentLanguageCode
): string {
  return lang;
}
