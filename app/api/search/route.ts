import { NextResponse } from "next/server";

import { checkMovieSearchRateLimit, getClientIp } from "@/lib/server/movieSearchRateLimit";
import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";

/** English titles for search (matches existing movie search route). */
const TMDB_SEARCH_LANGUAGE = "en-US";

const MIN_QUERY_LEN = 2;
const MAX_QUERY_LEN = 100;
const TMDB_MAX_PAGE = 500;

type TmdbSearchMovieResult = {
  id?: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbSearchMovieResponse = {
  page?: number;
  results?: TmdbSearchMovieResult[];
  total_pages?: number;
  total_results?: number;
};

type TmdbSearchTvResult = {
  id?: number;
  name?: string;
  original_name?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

type TmdbSearchTvResponse = {
  page?: number;
  results?: TmdbSearchTvResult[];
  total_pages?: number;
  total_results?: number;
};

export type SearchMovieItem = {
  id: number;
  title: string;
  originalTitle: string | null;
  releaseDate: string;
  posterUrl: string | null;
};

export type SearchTvItem = {
  id: number;
  title: string;
  originalTitle: string | null;
  firstAirDate: string;
  posterUrl: string | null;
};

export type SearchSection<T> = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: T[];
};

function normalizeQuery(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (trimmed.length < MIN_QUERY_LEN) return null;
  if (trimmed.length > MAX_QUERY_LEN) return trimmed.slice(0, MAX_QUERY_LEN);
  return trimmed;
}

function normalizeMovies(data: TmdbSearchMovieResponse): SearchSection<SearchMovieItem> {
  const page = typeof data.page === "number" && data.page >= 1 ? data.page : 1;
  const totalPages = Math.max(1, data.total_pages ?? 1);
  const totalResults = data.total_results ?? 0;
  const results: SearchMovieItem[] = [];

  for (const m of data.results ?? []) {
    const id = m.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) continue;
    const title = typeof m.title === "string" ? m.title.trim() : "";
    if (!title) continue;
    const originalRaw =
      typeof m.original_title === "string" ? m.original_title.trim() : "";
    const originalTitle =
      originalRaw.length > 0 && originalRaw !== title ? originalRaw : null;
    results.push({
      id,
      title,
      originalTitle,
      releaseDate: typeof m.release_date === "string" ? m.release_date : "",
      posterUrl: posterUrl(m.poster_path ?? null),
    });
  }

  return { page, totalPages, totalResults, results };
}

function normalizeTv(data: TmdbSearchTvResponse): SearchSection<SearchTvItem> {
  const page = typeof data.page === "number" && data.page >= 1 ? data.page : 1;
  const totalPages = Math.max(1, data.total_pages ?? 1);
  const totalResults = data.total_results ?? 0;
  const results: SearchTvItem[] = [];

  for (const t of data.results ?? []) {
    const id = t.id;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1) continue;
    const title = typeof t.name === "string" ? t.name.trim() : "";
    if (!title) continue;
    const originalRaw =
      typeof t.original_name === "string" ? t.original_name.trim() : "";
    const originalTitle =
      originalRaw.length > 0 && originalRaw !== title ? originalRaw : null;
    results.push({
      id,
      title,
      originalTitle,
      firstAirDate: typeof t.first_air_date === "string" ? t.first_air_date : "",
      posterUrl: posterUrl(t.poster_path ?? null),
    });
  }

  return { page, totalPages, totalResults, results };
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key is not configured. Set TMDB_API_KEY in the environment." },
      { status: 500 }
    );
  }

  const ip = getClientIp(request);
  const limited = checkMovieSearchRateLimit(ip);
  if (!limited.ok) {
    return NextResponse.json(
      {
        error: "Too many search requests. Try again in a moment.",
        query: "",
        movies: { page: 1, totalPages: 0, totalResults: 0, results: [] },
        tv: { page: 1, totalPages: 0, totalResults: 0, results: [] },
      },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("query") ?? searchParams.get("q") ?? "";
  const query = normalizeQuery(rawQuery);

  const pageRaw = searchParams.get("page");
  const pageParsed = pageRaw == null || pageRaw === "" ? 1 : Number(pageRaw);
  if (!Number.isInteger(pageParsed) || pageParsed < 1 || pageParsed > TMDB_MAX_PAGE) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  const page = pageParsed;

  if (query === null) {
    return NextResponse.json({
      query: rawQuery.trim(),
      movies: { page: 1, totalPages: 0, totalResults: 0, results: [] },
      tv: { page: 1, totalPages: 0, totalResults: 0, results: [] },
    });
  }

  const movieUrl = new URL(`${TMDB_API_V3_BASE}/search/movie`);
  movieUrl.searchParams.set("api_key", apiKey);
  movieUrl.searchParams.set("query", query);
  movieUrl.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
  movieUrl.searchParams.set("page", String(page));
  movieUrl.searchParams.set("include_adult", "false");

  const tvUrl = new URL(`${TMDB_API_V3_BASE}/search/tv`);
  tvUrl.searchParams.set("api_key", apiKey);
  tvUrl.searchParams.set("query", query);
  tvUrl.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
  tvUrl.searchParams.set("page", String(page));
  tvUrl.searchParams.set("include_adult", "false");

  const fetchOpts = { next: { revalidate: 300 } as const };

  const [movieRes, tvRes] = await Promise.all([
    fetch(movieUrl.toString(), fetchOpts),
    fetch(tvUrl.toString(), fetchOpts),
  ]);

  const emptyMovies = (): SearchSection<SearchMovieItem> => ({
    page,
    totalPages: 0,
    totalResults: 0,
    results: [],
  });
  const emptyTv = (): SearchSection<SearchTvItem> => ({
    page,
    totalPages: 0,
    totalResults: 0,
    results: [],
  });

  if (!movieRes.ok) {
    await movieRes.text().catch(() => {});
    return NextResponse.json(
      {
        error: "TMDB movie search failed",
        query,
        movies: emptyMovies(),
        tv: emptyTv(),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }
  if (!tvRes.ok) {
    await tvRes.text().catch(() => {});
    return NextResponse.json(
      {
        error: "TMDB TV search failed",
        query,
        movies: emptyMovies(),
        tv: emptyTv(),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const movieData = (await movieRes.json()) as TmdbSearchMovieResponse;
  const tvData = (await tvRes.json()) as TmdbSearchTvResponse;

  return NextResponse.json(
    {
      query,
      movies: normalizeMovies(movieData),
      tv: normalizeTv(tvData),
    },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}
