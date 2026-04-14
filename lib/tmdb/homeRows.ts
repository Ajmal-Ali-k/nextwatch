import type { Movie } from "@/components/MoviesRow";
import type { UiLanguageCode, WatchRegionCode } from "@/lib/regionLanguagePrefs";
import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { originalLanguageForDiscover } from "@/lib/tmdb/discoverFilters";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { getCuratedHomeRows } from "@/lib/db/getCuratedHomeRows";

const REVALIDATE_SEC = 900;
const LIST_LANGUAGE = "en-US";

type HomeRows = {
  theatres: Movie[];
  ottMovies: Movie[];
  ottSeries: Movie[];
  anime: Movie[];
};

type MovieListItem = {
  id?: number;
  title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type TvListItem = {
  id?: number;
  name?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: REVALIDATE_SEC } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function mapMovies(items: MovieListItem[] | undefined, limit: number): Movie[] {
  const out: Movie[] = [];
  for (const m of items ?? []) {
    if (out.length >= limit) break;
    const id = m.id;
    const title = typeof m.title === "string" ? m.title.trim() : "";
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || !title) continue;
    const image = posterUrl(m.poster_path ?? null);
    if (!image) continue;
    out.push({ id, title, date: formatDate(m.release_date), image });
  }
  return out;
}

function mapTv(items: TvListItem[] | undefined, limit: number): Movie[] {
  const out: Movie[] = [];
  for (const s of items ?? []) {
    if (out.length >= limit) break;
    const id = s.id;
    const title = typeof s.name === "string" ? s.name.trim() : "";
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || !title) continue;
    const image = posterUrl(s.poster_path ?? null);
    if (!image) continue;
    out.push({ id, title, date: formatDate(s.first_air_date), image });
  }
  return out;
}

export async function getHomeRows(prefs: {
  watchRegion: WatchRegionCode;
  language: UiLanguageCode;
}): Promise<HomeRows> {
  // Try admin-curated data first
  const curated = await getCuratedHomeRows();
  if (curated) {
    return { ...curated, anime: [] };
  }

  // Fall back to TMDB API
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return { theatres: [], ottMovies: [], ottSeries: [], anime: [] };

  const withOriginalLanguage = originalLanguageForDiscover(prefs.watchRegion, prefs.language);

  const nowPlayingUrl = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  nowPlayingUrl.searchParams.set("api_key", apiKey);
  nowPlayingUrl.searchParams.set("language", LIST_LANGUAGE);
  nowPlayingUrl.searchParams.set("region", prefs.watchRegion);
  nowPlayingUrl.searchParams.set("page", "1");

  const ottMoviesUrl = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
  ottMoviesUrl.searchParams.set("api_key", apiKey);
  ottMoviesUrl.searchParams.set("watch_region", prefs.watchRegion);
  ottMoviesUrl.searchParams.set("language", LIST_LANGUAGE);
  ottMoviesUrl.searchParams.set("sort_by", "popularity.desc");
  ottMoviesUrl.searchParams.set("include_adult", "false");
  ottMoviesUrl.searchParams.set("page", "1");
  ottMoviesUrl.searchParams.set(
    "with_watch_providers",
    discoverAnyOttWatchProvidersParam(prefs.watchRegion)
  );
  ottMoviesUrl.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
  if (withOriginalLanguage) {
    ottMoviesUrl.searchParams.set("with_original_language", withOriginalLanguage);
  }

  const ottSeriesUrl = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
  ottSeriesUrl.searchParams.set("api_key", apiKey);
  ottSeriesUrl.searchParams.set("watch_region", prefs.watchRegion);
  ottSeriesUrl.searchParams.set("language", LIST_LANGUAGE);
  ottSeriesUrl.searchParams.set("sort_by", "popularity.desc");
  ottSeriesUrl.searchParams.set("include_adult", "false");
  ottSeriesUrl.searchParams.set("page", "1");
  if (withOriginalLanguage) {
    ottSeriesUrl.searchParams.set("with_original_language", withOriginalLanguage);
  }

  const animeUrl = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
  animeUrl.searchParams.set("api_key", apiKey);
  animeUrl.searchParams.set("language", LIST_LANGUAGE);
  animeUrl.searchParams.set("sort_by", "popularity.desc");
  animeUrl.searchParams.set("include_adult", "false");
  animeUrl.searchParams.set("page", "1");
  animeUrl.searchParams.set("with_genres", "16");
  animeUrl.searchParams.set("with_origin_country", "JP");
  animeUrl.searchParams.set("with_original_language", "ja");

  const [theatresRaw, ottMoviesRaw, ottSeriesRaw, animeRaw] = await Promise.all([
    fetchJson<{ results?: MovieListItem[] }>(nowPlayingUrl.toString()),
    fetchJson<{ results?: MovieListItem[] }>(ottMoviesUrl.toString()),
    fetchJson<{ results?: TvListItem[] }>(ottSeriesUrl.toString()),
    fetchJson<{ results?: TvListItem[] }>(animeUrl.toString()),
  ]);

  return {
    theatres: mapMovies(theatresRaw?.results, 12),
    ottMovies: mapMovies(ottMoviesRaw?.results, 12),
    ottSeries: mapTv(ottSeriesRaw?.results, 12),
    anime: mapTv(animeRaw?.results, 12),
  };
}

