/**
 * TMDB watch/providers does not expose per-service deep links. We open the best-effort
 * destination: provider search URL when we know the TMDB provider_id, else TMDB's
 * regional "where to watch" page (`link` on the country block).
 */

export type WatchProviderMonetization = "Stream" | "Rent" | "Buy";

export type WatchProviderApiRow = {
  providerId: number;
  name: string;
  logoUrl: string | null;
  label: WatchProviderMonetization;
  /** Resolved URL to open when the user taps the chip (new tab). */
  watchUrl: string | null;
};

function encodeTitle(title: string): string {
  return encodeURIComponent(title.trim());
}

/**
 * Known TMDB `provider_id` → platform search/browse URL for the given title.
 * Returns null when we should fall back to {@link tmdbWatchPageUrl}.
 */
function providerOutboundUrl(
  providerId: number,
  _watchRegion: string,
  title: string
): string | null {
  const t = title.trim();
  if (!t) return null;
  const q = encodeTitle(t);

  switch (providerId) {
    case 8:
      return `https://www.netflix.com/search?q=${q}`;
    case 9:
    case 119:
    case 179:
      return `https://www.primevideo.com/search?phrase=${q}`;
    case 337:
      return `https://www.disneyplus.com/search?q=${q}`;
    case 350:
    case 2:
      return `https://tv.apple.com/search?term=${q}`;
    case 15:
      return `https://www.hulu.com/search?q=${q}`;
    case 2336:
      return `https://www.hotstar.com/in/explore/search?q=${q}`;
    case 232:
      return `https://www.zee5.com/search?q=${q}`;
    case 237:
      return `https://www.sonyliv.com/search?q=${q}`;
    case 192:
      return `https://www.youtube.com/results?search_query=${q}`;
    case 531:
      return `https://www.paramountplus.com/search/?q=${q}`;
    case 386:
    case 384:
      return `https://www.max.com/search?q=${q}`;
    default:
      return null;
  }
}

export function resolveWatchOutboundUrl(input: {
  providerId: number;
  watchRegion: string;
  title: string;
  tmdbWatchPageUrl: string | null;
}): string | null {
  const direct = providerOutboundUrl(
    input.providerId,
    input.watchRegion,
    input.title
  );
  if (direct) return direct;
  const fallback = input.tmdbWatchPageUrl?.trim();
  return fallback && fallback.length > 0 ? fallback : null;
}

export function withWatchUrls(
  rows: Omit<WatchProviderApiRow, "watchUrl">[],
  watchRegion: string,
  mediaTitle: string,
  tmdbWatchPageUrl: string | null
): WatchProviderApiRow[] {
  return rows.map((r) => ({
    ...r,
    watchUrl: resolveWatchOutboundUrl({
      providerId: r.providerId,
      watchRegion,
      title: mediaTitle,
      tmdbWatchPageUrl,
    }),
  }));
}
