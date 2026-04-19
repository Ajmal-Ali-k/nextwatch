import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";
import type { HomeLatestTrailersByCategory, HomeTrailerCard } from "@/lib/tmdb/latestTrailersTypes";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import {
  pickYoutubeTrailer,
  pickYoutubeTrailerForLocale,
  type TmdbVideo,
} from "@/lib/tmdb/videoPicker";
import type { ContentLanguageCode, WatchRegionCode } from "@/lib/regionLanguagePrefs";
import { getCuratedTrailers } from "@/lib/db/getCuratedTrailers";

const DISCOVER_LIST_LANGUAGE = "en-US";
const REVALIDATE_SEC = 900;
const MAX_PER_CATEGORY = 6;
const VIDEO_FETCH_CAP = 10;
const MAX_PARALLEL_LANGUAGES = 3;

export type { HomeLatestTrailersByCategory, HomeTrailerCard } from "@/lib/tmdb/latestTrailersTypes";

function tmdbPreferredTrailerAudioIso6391(languages: ContentLanguageCode[]): string[] {
  const chain = [...languages];
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

function pickTrailerKey(
  videos: TmdbVideo[] | null | undefined,
  languages: ContentLanguageCode[]
): string | null {
  const list = videos ?? undefined;
  const chain = tmdbPreferredTrailerAudioIso6391(languages);
  return pickYoutubeTrailerForLocale(list, chain) ?? pickYoutubeTrailer(list);
}

async function trailersFromMovies(
  results: TmdbMovieRow[] | undefined,
  apiKey: string,
  languages: ContentLanguageCode[]
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
    const yt = pickTrailerKey(videoBatches[i], languages);
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
  languages: ContentLanguageCode[]
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
    const yt = pickTrailerKey(videoBatches[i], languages);
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
  Upcoming: [],
};

export type HomeLatestTrailersPrefs = {
  watchRegion: WatchRegionCode;
  languages: ContentLanguageCode[];
};

export async function getHomeLatestTrailersByCategory(
  prefs: HomeLatestTrailersPrefs
): Promise<HomeLatestTrailersByCategory> {
  const curated = await getCuratedTrailers();
  if (curated) return curated;

  const key = process.env.TMDB_API_KEY;
  if (!key) return { ...EMPTY };
  const apiKey: string = key;

  const { watchRegion, languages } = prefs;
  const langs = languages.slice(0, MAX_PARALLEL_LANGUAGES);

  // Theatres: region-based, no language filter
  const nowPlayingUrl = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  nowPlayingUrl.searchParams.set("api_key", apiKey);
  nowPlayingUrl.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
  nowPlayingUrl.searchParams.set("region", watchRegion);
  nowPlayingUrl.searchParams.set("page", "1");

  const airSince = new Date();
  airSince.setDate(airSince.getDate() - 200);
  const airDateGte = airSince.toISOString().slice(0, 10);

  // OTT series/movies: parallel per language
  function buildOttSeriesUrl(lang: string): string {
    const url = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("watch_region", watchRegion);
    url.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", "1");
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("with_original_language", lang);
    url.searchParams.set("air_date.gte", airDateGte);
    return url.toString();
  }

  const today = new Date().toISOString().slice(0, 10);

  function buildOttMovieUrl(lang: string): string {
    const url = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("watch_region", watchRegion);
    url.searchParams.set("language", DISCOVER_LIST_LANGUAGE);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("page", "1");
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("with_original_language", lang);
    url.searchParams.set("with_watch_providers", discoverAnyOttWatchProvidersParam(watchRegion));
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
    url.searchParams.set("with_release_type", "4|5|6");
    url.searchParams.set("primary_release_date.lte", today);
    return url.toString();
  }

  type MovieResults = { results?: TmdbMovieRow[] };
  type TvResults = { results?: TmdbTvRow[] };

  const [np, ...ottResults] = await Promise.all([
    fetchJson<MovieResults>(nowPlayingUrl.toString()),
    ...langs.map((lang) => fetchJson<TvResults>(buildOttSeriesUrl(lang))),
    ...langs.map((lang) => fetchJson<MovieResults>(buildOttMovieUrl(lang))),
  ]);

  const ottSeriesLists = ottResults.slice(0, langs.length) as (TvResults | null)[];
  const ottMovieLists = ottResults.slice(langs.length) as (MovieResults | null)[];

  // Round-robin interleave so every language gets fair visibility
  function interleaveByLang<T extends { id?: number }>(
    lists: (({ results?: T[] } | null))[]
  ): T[] {
    const slices = lists.map((l) => l?.results ?? []);
    const seen = new Set<number>();
    const out: T[] = [];
    const maxLen = Math.max(0, ...slices.map((s) => s.length));
    for (let i = 0; i < maxLen; i++) {
      for (const slice of slices) {
        if (i >= slice.length) continue;
        const r = slice[i];
        if (typeof r.id === "number") {
          if (seen.has(r.id)) continue;
          seen.add(r.id);
        }
        out.push(r);
      }
    }
    return out;
  }

  const mergedSeries = interleaveByLang(ottSeriesLists);
  const mergedMovies = interleaveByLang(ottMovieLists);

  const [theatre, ottSeries, ottMovies] = await Promise.all([
    trailersFromMovies(np?.results, apiKey, languages),
    trailersFromTv(mergedSeries, apiKey, languages),
    trailersFromMovies(mergedMovies, apiKey, languages),
  ]);

  return {
    Theatre: theatre,
    "OTT Series": ottSeries,
    "OTT Movies": ottMovies,
    Upcoming: [],
  };
}
