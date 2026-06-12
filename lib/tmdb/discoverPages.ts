const TMDB_API_V3_BASE = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
const RESULTS_PER_VIEW = 30;
const MAX_PARALLEL_LANGUAGES = 3;
const DISCOVER_RESPONSE_LANGUAGE = "en-US";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB", "CA", "NL", "AE"]);
const VALID_CONTENT_LANGUAGES = new Set([
  "hi",
  "ta",
  "te",
  "ml",
  "en",
  "kn",
  "mr",
  "bn",
  "pa",
  "ja",
  "ko",
  "nl",
  "ar",
  "fr",
]);

const MAX_BROWSABLE_ITEMS = TMDB_MAX_PAGE * TMDB_PAGE_SIZE;
const MAX_DISPLAY_PAGE = Math.ceil(MAX_BROWSABLE_ITEMS / RESULTS_PER_VIEW);

type DiscoverMovieSort =
  | "popularity.desc"
  | "primary_release_date.desc"
  | "vote_average.desc"
  | "title.asc";

type DiscoverTvSort =
  | "popularity.desc"
  | "first_air_date.desc"
  | "vote_average.desc"
  | "name.asc";

export type TmdbDiscoverMovieResult = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  original_language?: string;
};

export type TmdbDiscoverResponse = {
  page: number;
  results: TmdbDiscoverMovieResult[];
  total_pages: number;
  total_results: number;
};

export type NormalizedDiscoverMovie = {
  id: number;
  title: string;
  releaseDate: string;
  posterUrl: string | null;
  overview: string;
};

export type TmdbDiscoverTvResult = {
  id: number;
  name: string;
  overview: string;
  first_air_date: string;
  poster_path: string | null;
};

export type TmdbDiscoverTvResponse = {
  page: number;
  results: TmdbDiscoverTvResult[];
  total_pages: number;
  total_results: number;
};

export type NormalizedDiscoverTvShow = {
  id: number;
  title: string;
  firstAirDate: string;
  posterUrl: string | null;
  overview: string;
};

export type DiscoverPage<T> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};

export type DiscoverPageWindow = {
  offset: number;
  tmdbPageStart: number;
  tmdbPagesNeeded: number;
  skip: number;
  perLanguageNeeded: number;
};

type FetchPageResult<T> = {
  results: T[];
  totalResults: number;
};

type DiscoverMoviePageOptions = {
  apiKey?: string;
  watchRegion: string;
  languages: string[];
  page: number;
  watchProvidersFilter?: string;
  providerId?: number;
  sortBy: DiscoverMovieSort;
  genreId?: number | null;
  releaseDateGte?: string;
  releaseDateLte?: string;
};

type DiscoverTvPageOptions = {
  apiKey?: string;
  watchRegion: string;
  languages: string[];
  page: number;
  watchProvidersFilter?: string;
  providerId?: number;
  sortBy: DiscoverTvSort;
  genreId?: number | null;
  airDateGte?: string;
  airDateLte?: string;
};

type NowPlayingPageOptions = {
  apiKey?: string;
  watchRegion: string;
  languages: string[];
  page: number;
};

type NormalizedWithLang = NormalizedDiscoverMovie & { originalLanguage?: string };

function posterUrl(posterPath: string | null): string | null {
  const path = typeof posterPath === "string" ? posterPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w500${path}`;
}

function parseLanguages(languages: readonly string[]): string[] {
  return languages
    .map((language) => language.trim().toLowerCase())
    .filter((language) => VALID_CONTENT_LANGUAGES.has(language))
    .slice(0, MAX_PARALLEL_LANGUAGES);
}

function validDisplayPage(page: number): boolean {
  return Number.isInteger(page) && page >= 1 && page <= MAX_DISPLAY_PAGE;
}

function emptyPage<T>(page: number, totalPages: number = 1, totalResults: number = 0): DiscoverPage<T> {
  return {
    page,
    totalPages,
    totalResults,
    results: [],
  };
}

export function calculateDiscoverPageWindow(
  displayPage: number,
  languageCount: number
): DiscoverPageWindow {
  const normalizedLanguageCount = Math.max(1, Math.floor(languageCount));
  const offset = (displayPage - 1) * RESULTS_PER_VIEW;
  const perLanguageNeeded = Math.ceil(RESULTS_PER_VIEW / normalizedLanguageCount);
  const skip = offset % TMDB_PAGE_SIZE;

  return {
    offset,
    tmdbPageStart: Math.floor(offset / TMDB_PAGE_SIZE) + 1,
    tmdbPagesNeeded: Math.ceil((skip + perLanguageNeeded) / TMDB_PAGE_SIZE),
    skip,
    perLanguageNeeded,
  };
}

export function mergeDiscoverLanguageSlices<T>(
  slices: T[][],
  getId: (item: T) => number | string,
  limit: number = RESULTS_PER_VIEW
): T[] {
  const seen = new Set<number | string>();
  const merged: T[] = [];
  const maxLen = Math.max(0, ...slices.map((slice) => slice.length));

  for (let i = 0; i < maxLen && merged.length < limit; i++) {
    for (const slice of slices) {
      if (i >= slice.length) continue;
      const item = slice[i];
      const id = getId(item);
      if (seen.has(id)) continue;
      seen.add(id);
      merged.push(item);
      if (merged.length >= limit) break;
    }
  }

  return merged;
}

export function normalizeDiscoverMovie(
  movie: TmdbDiscoverMovieResult
): NormalizedDiscoverMovie {
  return {
    id: movie.id,
    title: movie.title,
    releaseDate: movie.release_date,
    posterUrl: posterUrl(movie.poster_path),
    overview: movie.overview,
  };
}

export function normalizeDiscoverTvShow(
  show: TmdbDiscoverTvResult
): NormalizedDiscoverTvShow {
  return {
    id: show.id,
    title: show.name,
    firstAirDate: show.first_air_date,
    posterUrl: posterUrl(show.poster_path),
    overview: show.overview,
  };
}

function buildDiscoverMovieUrl(
  apiKey: string,
  options: DiscoverMoviePageOptions,
  tmdbPage: number,
  withOriginalLanguage: string | undefined
): string {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("watch_region", options.watchRegion.toUpperCase());
  url.searchParams.set("language", DISCOVER_RESPONSE_LANGUAGE);
  url.searchParams.set("sort_by", options.sortBy);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(tmdbPage));
  if (withOriginalLanguage) {
    url.searchParams.set("with_original_language", withOriginalLanguage);
  }
  if (options.genreId) {
    url.searchParams.set("with_genres", String(options.genreId));
  }
  const providerFilter =
    options.providerId !== undefined
      ? String(options.providerId)
      : options.watchProvidersFilter;
  if (providerFilter) {
    url.searchParams.set("with_watch_providers", providerFilter);
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
  }
  if (options.releaseDateGte) {
    url.searchParams.set("primary_release_date.gte", options.releaseDateGte);
  }
  if (options.releaseDateLte) {
    url.searchParams.set("primary_release_date.lte", options.releaseDateLte);
  }
  return url.toString();
}

function buildDiscoverTvUrl(
  apiKey: string,
  options: DiscoverTvPageOptions,
  tmdbPage: number,
  withOriginalLanguage: string | undefined
): string {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("watch_region", options.watchRegion.toUpperCase());
  url.searchParams.set("language", DISCOVER_RESPONSE_LANGUAGE);
  url.searchParams.set("sort_by", options.sortBy);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(tmdbPage));
  if (withOriginalLanguage) {
    url.searchParams.set("with_original_language", withOriginalLanguage);
  }
  if (options.genreId) {
    url.searchParams.set("with_genres", String(options.genreId));
  }
  const providerFilter =
    options.providerId !== undefined
      ? String(options.providerId)
      : options.watchProvidersFilter;
  if (providerFilter) {
    url.searchParams.set("with_watch_providers", providerFilter);
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
  }
  if (options.airDateGte) {
    url.searchParams.set("first_air_date.gte", options.airDateGte);
  }
  if (options.airDateLte) {
    url.searchParams.set("first_air_date.lte", options.airDateLte);
  }
  return url.toString();
}

async function fetchJsonPage<T>(
  url: string,
  revalidate: number
): Promise<FetchPageResult<T> | null> {
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) return null;
    const data = (await res.json()) as { results?: T[]; total_results?: number };
    return {
      results: data.results ?? [],
      totalResults: data.total_results ?? 0,
    };
  } catch {
    return null;
  }
}

function totalPagesFor(totalResults: number): number {
  if (totalResults === 0) return 1;
  return Math.max(
    1,
    Math.ceil(Math.min(totalResults, MAX_BROWSABLE_ITEMS) / RESULTS_PER_VIEW)
  );
}

export async function fetchDiscoverMoviePage(
  options: DiscoverMoviePageOptions
): Promise<DiscoverPage<NormalizedDiscoverMovie> | null> {
  const apiKey = options.apiKey ?? process.env.TMDB_API_KEY;
  const watchRegion = options.watchRegion.toUpperCase();
  if (!apiKey || !ALLOWED_REGIONS.has(watchRegion) || !validDisplayPage(options.page)) {
    return null;
  }

  const languages = parseLanguages(options.languages);
  const langList = languages.length > 0 ? languages : [undefined];
  const window = calculateDiscoverPageWindow(options.page, langList.length);
  if (window.offset >= MAX_BROWSABLE_ITEMS) return emptyPage(options.page);

  const fetches: Promise<FetchPageResult<TmdbDiscoverMovieResult> | null>[] = [];
  const langIndex: number[] = [];

  for (let li = 0; li < langList.length; li++) {
    for (let p = 0; p < window.tmdbPagesNeeded; p++) {
      fetches.push(
        fetchJsonPage<TmdbDiscoverMovieResult>(
          buildDiscoverMovieUrl(apiKey, { ...options, watchRegion }, window.tmdbPageStart + p, langList[li]),
          3600
        )
      );
      langIndex.push(li);
    }
  }

  const allResults = await Promise.all(fetches);
  const langSlices: TmdbDiscoverMovieResult[][] = langList.map(() => []);
  let maxTotalResults = 0;

  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (!result) continue;
    maxTotalResults = Math.max(maxTotalResults, result.totalResults);
    langSlices[langIndex[i]].push(...result.results);
  }

  for (let li = 0; li < langSlices.length; li++) {
    if (window.skip > 0) langSlices[li] = langSlices[li].slice(window.skip);
  }

  const totalPages = totalPagesFor(maxTotalResults);
  if (options.page > totalPages || window.offset >= Math.min(maxTotalResults, MAX_BROWSABLE_ITEMS)) {
    return emptyPage(options.page, totalPages, maxTotalResults);
  }

  const merged = mergeDiscoverLanguageSlices(langSlices, (movie) => movie.id)
    .map(normalizeDiscoverMovie);

  if (options.sortBy === "popularity.desc") {
    merged.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  }

  return {
    page: options.page,
    totalPages,
    totalResults: maxTotalResults,
    results: merged.slice(0, RESULTS_PER_VIEW),
  };
}

export async function fetchDiscoverTvPage(
  options: DiscoverTvPageOptions
): Promise<DiscoverPage<NormalizedDiscoverTvShow> | null> {
  const apiKey = options.apiKey ?? process.env.TMDB_API_KEY;
  const watchRegion = options.watchRegion.toUpperCase();
  if (!apiKey || !ALLOWED_REGIONS.has(watchRegion) || !validDisplayPage(options.page)) {
    return null;
  }

  const languages = parseLanguages(options.languages);
  const langList = languages.length > 0 ? languages : [undefined];
  const window = calculateDiscoverPageWindow(options.page, langList.length);
  if (window.offset >= MAX_BROWSABLE_ITEMS) return emptyPage(options.page);

  const fetches: Promise<FetchPageResult<TmdbDiscoverTvResult> | null>[] = [];
  const langIndex: number[] = [];

  for (let li = 0; li < langList.length; li++) {
    for (let p = 0; p < window.tmdbPagesNeeded; p++) {
      fetches.push(
        fetchJsonPage<TmdbDiscoverTvResult>(
          buildDiscoverTvUrl(apiKey, { ...options, watchRegion }, window.tmdbPageStart + p, langList[li]),
          3600
        )
      );
      langIndex.push(li);
    }
  }

  const allResults = await Promise.all(fetches);
  const langSlices: TmdbDiscoverTvResult[][] = langList.map(() => []);
  let maxTotalResults = 0;

  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (!result) continue;
    maxTotalResults = Math.max(maxTotalResults, result.totalResults);
    langSlices[langIndex[i]].push(...result.results);
  }

  for (let li = 0; li < langSlices.length; li++) {
    if (window.skip > 0) langSlices[li] = langSlices[li].slice(window.skip);
  }

  const totalPages = totalPagesFor(maxTotalResults);
  if (options.page > totalPages || window.offset >= Math.min(maxTotalResults, MAX_BROWSABLE_ITEMS)) {
    return emptyPage(options.page, totalPages, maxTotalResults);
  }

  const merged = mergeDiscoverLanguageSlices(langSlices, (show) => show.id)
    .map(normalizeDiscoverTvShow);

  if (options.sortBy === "popularity.desc") {
    merged.sort((a, b) =>
      (b.firstAirDate ?? "").localeCompare(a.firstAirDate ?? "")
    );
  }

  return {
    page: options.page,
    totalPages,
    totalResults: maxTotalResults,
    results: merged.slice(0, RESULTS_PER_VIEW),
  };
}

function buildNowPlayingUrl(apiKey: string, region: string, tmdbPage: number): string {
  const url = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", DISCOVER_RESPONSE_LANGUAGE);
  url.searchParams.set("region", region);
  url.searchParams.set("page", String(tmdbPage));
  return url.toString();
}

function buildUpcomingMovieUrl(apiKey: string, region: string, tmdbPage: number): string {
  const url = new URL(`${TMDB_API_V3_BASE}/movie/upcoming`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", DISCOVER_RESPONSE_LANGUAGE);
  url.searchParams.set("region", region);
  url.searchParams.set("page", String(tmdbPage));
  return url.toString();
}

async function fetchRegionalMovieListPage(
  options: NowPlayingPageOptions,
  buildUrl: (apiKey: string, region: string, tmdbPage: number) => string,
  sortForPreferredLanguages: boolean
): Promise<DiscoverPage<NormalizedDiscoverMovie> | null> {
  const apiKey = options.apiKey ?? process.env.TMDB_API_KEY;
  const watchRegion = options.watchRegion.toUpperCase();
  if (!apiKey || !ALLOWED_REGIONS.has(watchRegion) || !validDisplayPage(options.page)) {
    return null;
  }

  const preferredLangs = new Set(parseLanguages(options.languages));
  const offset = (options.page - 1) * RESULTS_PER_VIEW;
  if (offset >= MAX_BROWSABLE_ITEMS) return emptyPage(options.page);

  let tmdbPage = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  let skip = offset % TMDB_PAGE_SIZE;
  const merged: NormalizedWithLang[] = [];
  let totalResults = 0;
  let totalPages = 1;

  while (merged.length < RESULTS_PER_VIEW && tmdbPage <= TMDB_MAX_PAGE) {
    const result = await fetchJsonPage<TmdbDiscoverMovieResult>(
      buildUrl(apiKey, watchRegion, tmdbPage),
      900
    );
    if (!result) return null;

    if (totalResults === 0) {
      totalResults = result.totalResults;
      totalPages = totalPagesFor(totalResults);
      if (options.page > totalPages || offset >= Math.min(totalResults, MAX_BROWSABLE_ITEMS)) {
        return emptyPage(options.page, totalPages, totalResults);
      }
    }

    const slice = result.results.slice(skip);
    skip = 0;
    for (const movie of slice) {
      merged.push({
        ...normalizeDiscoverMovie(movie),
        originalLanguage: movie.original_language,
      });
      if (merged.length >= RESULTS_PER_VIEW) break;
    }

    if (result.results.length === 0) break;
    tmdbPage += 1;
  }

  if (sortForPreferredLanguages && preferredLangs.size > 0) {
    merged.sort((a, b) => {
      const aMatch = a.originalLanguage && preferredLangs.has(a.originalLanguage) ? 0 : 1;
      const bMatch = b.originalLanguage && preferredLangs.has(b.originalLanguage) ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
      return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
    });
  }

  const results = merged.map((movie) => ({
    id: movie.id,
    title: movie.title,
    releaseDate: movie.releaseDate,
    posterUrl: movie.posterUrl,
    overview: movie.overview,
  }));

  return {
    page: options.page,
    totalPages,
    totalResults,
    results,
  };
}

export async function fetchNowPlayingMoviePage(
  options: NowPlayingPageOptions
): Promise<DiscoverPage<NormalizedDiscoverMovie> | null> {
  return fetchRegionalMovieListPage(options, buildNowPlayingUrl, true);
}

export async function fetchUpcomingMoviePage(
  options: NowPlayingPageOptions
): Promise<DiscoverPage<NormalizedDiscoverMovie> | null> {
  return fetchRegionalMovieListPage(options, buildUpcomingMovieUrl, false);
}
