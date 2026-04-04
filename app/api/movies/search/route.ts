import { NextResponse } from "next/server";

import { checkMovieSearchRateLimit, getClientIp } from "@/lib/server/movieSearchRateLimit";
import { TMDB_API_V3_BASE, posterThumbnailUrl } from "@/lib/tmdb/constants";

/** TMDB localized `title` for search results — English so typing Latin script matches dropdown labels. */
const TMDB_SEARCH_LANGUAGE = "en-US";

const MIN_QUERY_LEN = 2;
const MAX_QUERY_LEN = 100;
const MAX_RESULTS = 10;

type TmdbSearchMovieResult = {
  id?: number;
  title?: string;
  original_title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbSearchMovieResponse = {
  results?: TmdbSearchMovieResult[];
};

export type MovieSearchResultItem = {
  id: number;
  title: string;
  /** Native/local title when different from `title` (e.g. Malayalam script). */
  originalTitle: string | null;
  releaseDate: string;
  posterUrl: string | null;
};

function normalizeQuery(raw: string): string | null {
  const trimmed = raw.trim().replace(/[\u0000-\u001F\u007F]/g, "");
  if (trimmed.length < MIN_QUERY_LEN) return null;
  if (trimmed.length > MAX_QUERY_LEN) return trimmed.slice(0, MAX_QUERY_LEN);
  return trimmed;
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
      { error: "Too many search requests. Try again in a moment.", results: [] },
      {
        status: 429,
        headers: { "Retry-After": String(limited.retryAfterSec) },
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const rawQuery = searchParams.get("query") ?? searchParams.get("q") ?? "";
  const query = normalizeQuery(rawQuery);
  if (query === null) {
    return NextResponse.json({ results: [] satisfies MovieSearchResultItem[] });
  }

  const url = new URL(`${TMDB_API_V3_BASE}/search/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
  url.searchParams.set("page", "1");
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });

  if (!res.ok) {
    await res.text().catch(() => {});
    return NextResponse.json(
      { error: "TMDB request failed", results: [] },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  const data = (await res.json()) as TmdbSearchMovieResponse;
  const rawResults = data.results ?? [];
  const results: MovieSearchResultItem[] = [];

  for (const m of rawResults) {
    if (results.length >= MAX_RESULTS) break;
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
      posterUrl: posterThumbnailUrl(m.poster_path ?? null),
    });
  }

  return NextResponse.json(
    { results },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60" } }
  );
}
