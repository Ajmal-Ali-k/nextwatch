import { cookies } from "next/headers";

import {
  COOKIE_UI_LANGUAGE,
  COOKIE_WATCH_REGION,
} from "@/lib/regionLanguageCookieNames";
import {
  defaultLanguageForRegion,
  isValidLanguageForRegion,
  parseWatchRegionCookie,
  type UiLanguageCode,
  type WatchRegionCode,
} from "@/lib/regionLanguagePrefs";

export async function getServerHomePreferences(): Promise<{
  watchRegion: WatchRegionCode;
  language: UiLanguageCode;
}> {
  const jar = await cookies();
  const watchRegion = parseWatchRegionCookie(jar.get(COOKIE_WATCH_REGION)?.value);
  const langRaw = jar.get(COOKIE_UI_LANGUAGE)?.value;
  const language: UiLanguageCode =
    langRaw && isValidLanguageForRegion(watchRegion, langRaw)
      ? langRaw
      : defaultLanguageForRegion(watchRegion);
  return { watchRegion, language };
}
