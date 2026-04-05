import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";
import { originalLanguageForDiscover } from "@/lib/tmdb/discoverFilters";
import type { HomeLatestTrailersByCategory, HomeTrailerCard } from "@/lib/tmdb/latestTrailersTypes";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import {
  pickYoutubeTrailer,
  pickYoutubeTrailerForLocale,
  type TmdbVideo,
} from "@/lib/tmdb/videoPicker";
import type { UiLanguageCode, WatchRegionCode } from "@/lib/regionLanguagePrefs";

const DISCOVER_LIST_LANGUAGE = "en-US";
const REVALIDATE_SEC = 900;
const MAX_PER_CATEGORY = 6;
const VIDEO_FETCH_CAP = 10;

export type { HomeLatestTrailersByCategory, HomeTrailerCard } from "@/lib/tmdb/latestTrailersTypes";

function tmdbPreferredTrailerAudioIso6391(ui: UiLanguageCode): string[] {
  const primary = ui.split("-")[0]?.toLowerCase() ?? "en";
  const chain = [primary];
  if (!chain.includes("en")) chain.push("en");
  return chain;
}

function formatListDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function youtubeThumb(key: string): string {
  return `https://img.youtube.com/vi/${key}/hqdefault.jpg`;
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

async function fetchMovieVideos(movieId: number, apiKey: string): Promise<TmdbVideo[] | null> {
  const url = new URL(`${TMDB_API_V3_BASE}/movie/${movieId}/videos`);
  url.searchParams.set("api_key", apiKey);
  const data = await fetchJson<{ results?: TmdbVideo[] }>(url.toString());
  return data?.results ?? null;
}

async function fetchTvVideos(tvId: number, apiKey: string): Promise<TmdbVideo[] | null> {
  const url = new URL(`${TMDB_API_V3_BASE}/tv/${tvId}/videos`);
  url.searchParams.set("api_key", apiKey);
  const data = await fetchJson<{ results?: TmdbVideo[] }>(url.toString());
  return data?.results ?? null;
}

type TmdbMovieRow = {
  id?: number;
  title?: string;
  release_date?: string;
};

type TmdbTvRow = {
  id?: number;
  name?: string;
  first_air_date?: string;
};

function pickTrailerKey(videos: TmdbVideo[] | null | undefined, uiLanguage: UiLanguageCode): string | null {
  const list = videos ?? undefined;
  const chain = tmdbPreferredTrailerAudioIso6391(uiLanguage);
  return pickYoutubeTrailerForLocale(list, chain) ?? pickYoutubeTrailer(list);
}

async function trailersFromMovies(
  results: TmdbMovieRow[] | undefined,
  apiKey: string,
  uiLanguage: UiLanguageCode
): Promise<HomeTrailerCard[]> {
  const rows = (results ?? []).filter(
    (r): r is TmdbMovieRow & { id: number } =>
      typeof r.id === "number" && Number.isInteger(r.id) && r.id >= 1
  );
  const slice = rows.slice(0, VIDEO_FETCH_CAP);
  const videoBatches = await Promise.all(slice.map((m) => fetchMovieVideos(m.id, apiKey)));

  const out: HomeTrailerCard[] = [];
  for (let i = 0; i < slice.length && out.length < MAX_PER_CATEGORY; i++) {
    const m = slice[i];
    const yt = pickTrailerKey(videoBatches[i], uiLanguage);
    if (!yt) continue;
    const title = typeof m.title === "string" ? m.title.trim() : "";
    if (!title) continue;
    out.push({
      id: `movie-${m.id}-${yt}`,
      title,
      date: formatListDate(m.release_date),
      image: youtubeThumb(yt),
      youtubeKey: yt,
      detailHref: `/movies/${m.id}`,
    });
  }
  return out;
}

async function trailersFromTv(
  results: TmdbTvRow[] | undefined,
  apiKey: string,
  uiLanguage: UiLanguageCode
): Promise<HomeTrailerCard[]> {
  const rows = (results ?? []).filter(
    (r): r is TmdbTvRow & { id: number } =>
      typeof r.id === "number" && Number.isInteger(r.id) && r.id >= 1
  );
  const slice = rows.slice(0, VIDEO_FETCH_CAP);
  const videoBatches = await Promise.all(slice.map((m) => fetchTvVideos(m.id, apiKey)));

  const out: HomeTrailerCard[] = [];
  for (let i = 0; i < slice.length && out.length < MAX_PER_CATEGORY; i++) {
    const m = slice[i];
    const yt = pickTrailerKey(videoBatches[i], uiLanguage);
    if (!yt) continue;
    const title = typeof m.name === "string" ? m.name.trim() : "";
    if (!title) continue;
    out.push({
      id: `tv-${m.id}-${yt}`,
      title,
      date: formatListDate(m.first_air_date),
      image: youtubeThumb(yt),
      youtubeKey: yt,
      detailHref: `/tv-shows/${m.id}`,
    });
  }
  return out;
}

const EMPTY: HomeLatestTrailersByCategory = {
  Theatre: [],
  "OTT Series": [],
  "OTT Movies": [],
};

export type HomeLatestTrailersPrefs = {
  watchRegion: WatchRegionCode;
  language: UiLanguageCode;
};

export async function getHomeLatestTrailersByCategory(
  prefs: HomeLatestTrailersPrefs
): Promise<HomeLatestTrailersByCategory> {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) return { ...EMPTY };

  const { watchRegion, language: uiLanguage } = prefs;
  const withOriginal = originalLanguageForDiscover(watchRegion, uiLanguage);

  const nowPlayingUrl = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  nowPlayingUrl.searchParams.set("api_key", apiKey);
  nowPlayingUrl.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
  nowPlayingUrl.searchParams.set("region", watchRegion);
  nowPlayingUrl.searchParams.set("page", "1");

  const ottSeriesUrl = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
  ottSeriesUrl.searchParams.set("api_key", apiKey);
  ottSeriesUrl.searchParams.set("watch_region", watchRegion);
  ottSeriesUrl.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
  ottSeriesUrl.searchParams.set("sort_by", "popularity.desc");
  ottSeriesUrl.searchParams.set("page", "1");
  ottSeriesUrl.searchParams.set("include_adult", "false");
  if (withOriginal) {
    ottSeriesUrl.searchParams.set("with_original_language", withOriginal);
  }
  const airSince = new Date();
  airSince.setDate(airSince.getDate() - 200);
  ottSeriesUrl.searchParams.set("air_date.gte", airSince.toISOString().slice(0, 10));

  const discoverUrl = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
  discoverUrl.searchParams.set("api_key", apiKey);
  discoverUrl.searchParams.set("watch_region", watchRegion);
  discoverUrl.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
  discoverUrl.searchParams.set("sort_by", "popularity.desc");
  discoverUrl.searchParams.set("page", "1");
  discoverUrl.searchParams.set("include_adult", "false");
  if (withOriginal) {
    discoverUrl.searchParams.set("with_original_language", withOriginal);
  }
  discoverUrl.searchParams.set("with_watch_providers", discoverAnyOttWatchProvidersParam(watchRegion));
  discoverUrl.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");

  const [np, ottSeriesList, dm] = await Promise.all([
    fetchJson<{ results?: TmdbMovieRow[] }>(nowPlayingUrl.toString()),
    fetchJson<{ results?: TmdbTvRow[] }>(ottSeriesUrl.toString()),
    fetchJson<{ results?: TmdbMovieRow[] }>(discoverUrl.toString()),
  ]);

  const [theatre, ottSeries, ottMovies] = await Promise.all([
    trailersFromMovies(np?.results, apiKey, uiLanguage),
    trailersFromTv(ottSeriesList?.results, apiKey, uiLanguage),
    trailersFromMovies(dm?.results, apiKey, uiLanguage),
  ]);

  return {
    Theatre: theatre,
    "OTT Series": ottSeries,
    "OTT Movies": ottMovies,
  };
}
