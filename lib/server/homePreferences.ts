import { cookies } from "next/headers";

import {
  COOKIE_CONTENT_LANGUAGES,
  COOKIE_UI_LANGUAGE,
  COOKIE_WATCH_REGION,
} from "@/lib/regionLanguageCookieNames";
import {
  DEFAULT_LANGUAGES_FOR_REGION,
  migrateOldLanguageCode,
  parseContentLanguagesCookie,
  parseWatchRegionCookie,
  type ContentLanguageCode,
  type WatchRegionCode,
} from "@/lib/regionLanguagePrefs";

export async function getServerHomePreferences(): Promise<{
  watchRegion: WatchRegionCode;
  languages: ContentLanguageCode[];
}> {
  const jar = await cookies();
  const watchRegion = parseWatchRegionCookie(jar.get(COOKIE_WATCH_REGION)?.value);

  const langs = parseContentLanguagesCookie(
    jar.get(COOKIE_CONTENT_LANGUAGES)?.value
  );
  if (langs) return { watchRegion, languages: langs };

  // Migration: try old single-language cookie
  const oldLang = jar.get(COOKIE_UI_LANGUAGE)?.value;
  if (oldLang) {
    const migrated = migrateOldLanguageCode(oldLang);
    if (migrated) return { watchRegion, languages: [migrated] };
  }

  return { watchRegion, languages: DEFAULT_LANGUAGES_FOR_REGION[watchRegion] };
}
