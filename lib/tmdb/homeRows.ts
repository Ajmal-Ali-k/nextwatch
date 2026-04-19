import type { Movie } from "@/components/MoviesRow";
import type { ContentLanguageCode, WatchRegionCode } from "@/lib/regionLanguagePrefs";
import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { getCuratedHomeRows } from "@/lib/db/getCuratedHomeRows";

const REVALIDATE_SEC = 900;
const LIST_LANGUAGE = "en-US";
const MAX_PER_ROW = 12;
const MAX_PARALLEL_LANGUAGES = 3;

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

function dedup(items: Movie[], limit: number): Movie[] {
  const seen = new Set<number>();
  const out: Movie[] = [];
  for (const m of items) {
    if (m.id != null) {
      if (seen.has(m.id)) continue;
      seen.add(m.id);
    }
    out.push(m);
    if (out.length >= limit) break;
  }
  return out;
}

export async function getHomeRows(prefs: {
  watchRegion: WatchRegionCode;
  languages: ContentLanguageCode[];
}): Promise<HomeRows> {
  const curated = await getCuratedHomeRows();
  if (curated) {
    return { ...curated, anime: [] };
  }

  const key = process.env.TMDB_API_KEY;
  if (!key) return { theatres: [], ottMovies: [], ottSeries: [], anime: [] };
  const apiKey: string = key;

  const langs = prefs.languages.slice(0, MAX_PARALLEL_LANGUAGES);
  const ottProviders = discoverAnyOttWatchProvidersParam(prefs.watchRegion);

  // Theatres: region-based, no language filter
  const nowPlayingUrl = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  nowPlayingUrl.searchParams.set("api_key", apiKey);
  nowPlayingUrl.searchParams.set("language", LIST_LANGUAGE);
  nowPlayingUrl.searchParams.set("region", prefs.watchRegion);
  nowPlayingUrl.searchParams.set("page", "1");

  // Anime: hardcoded Japanese
  const animeUrl = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
  animeUrl.searchParams.set("api_key", apiKey);
  animeUrl.searchParams.set("language", LIST_LANGUAGE);
  animeUrl.searchParams.set("sort_by", "popularity.desc");
  animeUrl.searchParams.set("include_adult", "false");
  animeUrl.searchParams.set("page", "1");
  animeUrl.searchParams.set("with_genres", "16");
  animeUrl.searchParams.set("with_origin_country", "JP");
  animeUrl.searchParams.set("with_original_language", "ja");

  const today = new Date().toISOString().slice(0, 10);

  // OTT movies/series: parallel per language
  function buildOttMovieUrl(lang: string): string {
    const url = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("watch_region", prefs.watchRegion);
    url.searchParams.set("language", LIST_LANGUAGE);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("page", "1");
    url.searchParams.set("with_watch_providers", ottProviders);
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
    url.searchParams.set("with_original_language", lang);
    // Only include movies already released via digital/physical/TV — excludes
    // theatrical-only and unreleased titles (TMDB release types 4, 5, 6).
    url.searchParams.set("with_release_type", "4|5|6");
    url.searchParams.set("primary_release_date.lte", today);
    return url.toString();
  }

  function buildOttSeriesUrl(lang: string): string {
    const url = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("watch_region", prefs.watchRegion);
    url.searchParams.set("language", LIST_LANGUAGE);
    url.searchParams.set("sort_by", "popularity.desc");
    url.searchParams.set("include_adult", "false");
    url.searchParams.set("page", "1");
    url.searchParams.set("with_original_language", lang);
    return url.toString();
  }

  type MovieResults = { results?: MovieListItem[] };
  type TvResults = { results?: TvListItem[] };

  const [theatresRaw, animeRaw, ...ottResults] = await Promise.all([
    fetchJson<MovieResults>(nowPlayingUrl.toString()),
    fetchJson<TvResults>(animeUrl.toString()),
    ...langs.map((lang) => fetchJson<MovieResults>(buildOttMovieUrl(lang))),
    ...langs.map((lang) => fetchJson<TvResults>(buildOttSeriesUrl(lang))),
  ]);

  const ottMovieResults = ottResults.slice(0, langs.length) as (MovieResults | null)[];
  const ottSeriesResults = ottResults.slice(langs.length) as (TvResults | null)[];

  // Round-robin interleave so every selected language gets fair visibility
  const movieSlices = ottMovieResults.map((r) =>
    mapMovies(r?.results, MAX_PER_ROW)
  );
  const seriesSlices = ottSeriesResults.map((r) =>
    mapTv(r?.results, MAX_PER_ROW)
  );

  function interleave(slices: Movie[][]): Movie[] {
    const out: Movie[] = [];
    const maxLen = Math.max(0, ...slices.map((s) => s.length));
    for (let i = 0; i < maxLen; i++) {
      for (const slice of slices) {
        if (i < slice.length) out.push(slice[i]);
      }
    }
    return out;
  }

  return {
    theatres: mapMovies(theatresRaw?.results, MAX_PER_ROW),
    ottMovies: dedup(interleave(movieSlices), MAX_PER_ROW),
    ottSeries: dedup(interleave(seriesSlices), MAX_PER_ROW),
    anime: mapTv(animeRaw?.results, MAX_PER_ROW),
  };
}
