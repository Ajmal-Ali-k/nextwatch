export type PlatformKey =
  | "all"
  | "netflix"
  | "prime"
  | "jiohotstar"
  | "sony"
  | "zee"
  | "youtube"
  | "apple";

export type OttPlatformKey = Exclude<PlatformKey, "all">;

/** Major preset row order: Netflix, Prime, Jio Hotstar, Sony LIV, Zee5, YouTube, Apple TV+. */
export const MAJOR_OTT_PLATFORM_KEYS: readonly OttPlatformKey[] = [
  "netflix",
  "prime",
  "jiohotstar",
  "sony",
  "zee",
  "youtube",
  "apple",
] as const;

/** UI fallback when TMDB watch-provider list has not loaded or omits an entry. */
export const MAJOR_PLATFORM_FALLBACK_LABEL: Record<OttPlatformKey, string> = {
  netflix: "Netflix",
  prime: "Prime Video",
  jiohotstar: "Jio Hotstar",
  sony: "Sony LIV",
  zee: "Zee5",
  youtube: "YouTube",
  apple: "Apple TV+",
};

export const MAJOR_PLATFORM_FALLBACK_INITIALS: Record<OttPlatformKey, string> = {
  netflix: "NF",
  prime: "PV",
  jiohotstar: "JH",
  sony: "SL",
  zee: "Z5",
  youtube: "YT",
  apple: "AT",
};

/**
 * TMDB watch provider IDs per ISO watch_region.
 * Verify or extend via https://developer.themoviedb.org/reference/watch-providers-movie-list
 */
const PROVIDER_IDS: Record<string, Partial<Record<OttPlatformKey, number>>> = {
  IN: {
    netflix: 8,
    prime: 119,
    /** India: TMDB uses dedicated id 2336 ("JioHotstar"); 337 (Disney+) is not in IN watch-provider list. */
    jiohotstar: 2336,
    sony: 237,
    zee: 232,
    /** TMDB often uses 192 for YouTube; 1926 may be absent from watch-provider list for some locales. */
    youtube: 192,
    /**
     * IN: id 350 ("Apple TV") yields 0 discover results with Indian `with_original_language`;
     * id 2 ("Apple TV Store") matches TMDB's India catalogue for those filters (same row users pick in More).
     */
    apple: 2,
  },
  US: {
    netflix: 8,
    prime: 9,
    jiohotstar: 337,
    /** Sony LIV / Zee5 are India-only in this app; omit for US/GB so presets and discover stay accurate. */
    youtube: 192,
    apple: 350,
  },
  GB: {
    netflix: 8,
    prime: 9,
    jiohotstar: 337,
    youtube: 192,
    apple: 350,
  },
};

/** Major keys that map to streaming options meaningful only for watch_region IN. */
export function isIndiaOnlyOttKey(key: OttPlatformKey): boolean {
  return key === "sony" || key === "zee";
}

/**
 * Preset platform chips for the TV discover page. Apple TV+ is hidden for India because
 * TMDB TV discover often returns no results for the mapped provider id in that region.
 */
export function majorOttPlatformKeysForTvPage(watchRegion: string): OttPlatformKey[] {
  if (watchRegion.toUpperCase() === "IN") {
    return MAJOR_OTT_PLATFORM_KEYS.filter((k) => k !== "apple");
  }
  return [...MAJOR_OTT_PLATFORM_KEYS];
}

/**
 * Drop Sony LIV / Zee5 from the regional provider catalog outside India so they do not appear as
 * major chips or under "More", and TMDB ids 237/232 cannot be selected for US/UK discover.
 */
export function filterIndiaOnlyProvidersForRegion<
  T extends { providerId: number; name: string },
>(watchRegion: string, providers: readonly T[]): T[] {
  if (watchRegion.toUpperCase() === "IN") return [...providers];
  return providers.filter((p) => !isIndiaOnlyWatchProviderRow(p));
}

function isIndiaOnlyWatchProviderRow(p: { providerId: number; name: string }): boolean {
  if (p.providerId === 237 || p.providerId === 232) return true;
  const n = p.name.trim().toLowerCase();
  if (/\bsony\s*liv\b/.test(n) || n === "sonyliv") return true;
  if (/\bzee\s*5\b/.test(n) || /\bzee5\b/.test(n)) return true;
  return false;
}

export function getProviderIdForRegion(
  watchRegion: string,
  platform: OttPlatformKey
): number | undefined {
  const row = PROVIDER_IDS[watchRegion.toUpperCase()];
  return row?.[platform];
}

/** TMDB provider IDs shown as major preset buttons for this region (exclude from "more" list). */
export function majorProviderIdsForRegion(watchRegion: string): Set<number> {
  const row = PROVIDER_IDS[watchRegion.toUpperCase()];
  if (!row) return new Set();
  return new Set(
    (Object.values(row) as (number | undefined)[]).filter(
      (id): id is number => typeof id === "number"
    )
  );
}

/**
 * Pipe-separated `with_watch_providers` value for TMDB discover (OR semantics).
 * Used when the user picks "All" platforms so results are limited to titles with at least one
 * major streaming/rental option in the region — excluding theatrical-only listings.
 */
export function discoverAnyOttWatchProvidersParam(watchRegion: string): string {
  const ids = [...majorProviderIdsForRegion(watchRegion.toUpperCase())].sort(
    (a, b) => a - b
  );
  return ids.join("|");
}

export type WatchProviderPickRow = {
  providerId: number;
  name: string;
  displayPriority?: number;
};

function byDisplayPriority(a: WatchProviderPickRow, b: WatchProviderPickRow): number {
  return (a.displayPriority ?? 9999) - (b.displayPriority ?? 9999);
}

function pickYoutubeId(providers: readonly WatchProviderPickRow[]): number | undefined {
  const nn = (s: string) => s.trim().toLowerCase();
  const youtubeRows = providers
    .filter((p) => /youtube/i.test(p.name))
    .sort(byDisplayPriority);
  if (!youtubeRows.length) return undefined;
  const preferred = youtubeRows.filter(
    (p) => !/(premium|kids|music)\b/i.test(nn(p.name))
  );
  const pool = preferred.length > 0 ? preferred : youtubeRows;
  return pool[0]?.providerId;
}

function pickJioHotstarId(providers: readonly WatchProviderPickRow[]): number | undefined {
  const nn = (s: string) => s.trim().toLowerCase();
  const hotLike = providers
    .filter((p) =>
      /hotstar|jio\s*cinema|jiohotstar|disney.*hotstar|disney\+\s*hotstar/i.test(nn(p.name))
    )
    .sort(byDisplayPriority);
  if (hotLike.length > 0) return hotLike[0].providerId;

  const dplus = providers
    .filter(
      (p) =>
        nn(p.name) === "disney+" ||
        /^disney\+/i.test(p.name.trim()) ||
        /^disney plus\b/i.test(nn(p.name))
    )
    .sort(byDisplayPriority);
  if (dplus.length > 0) return dplus[0].providerId;

  return undefined;
}

/**
 * TMDB often uses different provider_id values per region than static tables; the watch-provider
 * list is authoritative. When the configured id is missing from `providers`, match by name for
 * youtube / jiohotstar so majors align with the same rows as the "More" list.
 */
export function resolveMajorProviderId(
  watchRegion: string,
  key: OttPlatformKey,
  providers: readonly WatchProviderPickRow[]
): number | undefined {
  const fallback = getProviderIdForRegion(watchRegion, key);
  if (!providers.length) return fallback;

  const inList = (id: number | undefined) =>
    id !== undefined && providers.some((p) => p.providerId === id);

  if (key === "apple" && watchRegion.toUpperCase() === "IN") {
    const appleStore = providers.find((p) => p.providerId === 2);
    if (appleStore) return 2;
  }

  if (fallback !== undefined && inList(fallback)) return fallback;

  if (key === "youtube") {
    const picked = pickYoutubeId(providers);
    if (picked !== undefined) return picked;
    return fallback;
  }

  if (key === "jiohotstar") {
    const picked = pickJioHotstarId(providers);
    if (picked !== undefined) return picked;
    return fallback;
  }

  return fallback;
}

/** Hardcoded majors plus any resolved alternate ids (same service, different TMDB id). */
export function majorProviderIdsExcludedFromMore(
  watchRegion: string,
  providers: readonly WatchProviderPickRow[]
): Set<number> {
  const out = new Set<number>();
  for (const id of majorProviderIdsForRegion(watchRegion)) {
    out.add(id);
  }
  if (!providers.length) return out;
  for (const key of MAJOR_OTT_PLATFORM_KEYS) {
    const r = resolveMajorProviderId(watchRegion, key, providers);
    if (r !== undefined) out.add(r);
  }
  if (watchRegion.toUpperCase() === "IN" && out.has(2)) {
    out.add(350);
  }
  return out;
}
