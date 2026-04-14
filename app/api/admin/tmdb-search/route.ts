import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";

const TMDB_SEARCH_LANGUAGE = "en-US";

type TmdbSearchMovieResult = {
  id?: number;
  title?: string;
  release_date?: string;
  poster_path?: string | null;
};

type TmdbSearchTvResult = {
  id?: number;
  name?: string;
  first_air_date?: string;
  poster_path?: string | null;
};

export type AdminSearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseDate: string;
};

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const type = searchParams.get("type") ?? "movie";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  if (type === "tv") {
    const url = new URL(`${TMDB_API_V3_BASE}/search/tv`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("query", query);
    url.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
    url.searchParams.set("page", "1");
    url.searchParams.set("include_adult", "false");

    const res = await fetch(url.toString());
    if (!res.ok) {
      return NextResponse.json({ error: "TMDB search failed" }, { status: 502 });
    }

    const data = (await res.json()) as { results?: TmdbSearchTvResult[] };
    const results: AdminSearchResult[] = [];

    for (const item of data.results ?? []) {
      if (typeof item.id !== "number" || item.id < 1) continue;
      const title = typeof item.name === "string" ? item.name.trim() : "";
      if (!title) continue;
      results.push({
        tmdbId: item.id,
        mediaType: "tv",
        title,
        posterPath: item.poster_path ?? null,
        releaseDate: item.first_air_date ?? "",
      });
    }

    return NextResponse.json({ results });
  }

  // Default: movie search
  const url = new URL(`${TMDB_API_V3_BASE}/search/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
  url.searchParams.set("page", "1");
  url.searchParams.set("include_adult", "false");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json({ error: "TMDB search failed" }, { status: 502 });
  }

  const data = (await res.json()) as { results?: TmdbSearchMovieResult[] };
  const results: AdminSearchResult[] = [];

  for (const item of data.results ?? []) {
    if (typeof item.id !== "number" || item.id < 1) continue;
    const title = typeof item.title === "string" ? item.title.trim() : "";
    if (!title) continue;
    results.push({
      tmdbId: item.id,
      mediaType: "movie",
      title,
      posterPath: item.poster_path ?? null,
      releaseDate: item.release_date ?? "",
    });
  }

  return NextResponse.json({ results });
}
