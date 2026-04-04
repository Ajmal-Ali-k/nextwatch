import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";

const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

type TmdbGenreListResponse = {
  genres: { id: number; name: string }[];
};

async function fetchTmdbTvGenreList(
  apiKey: string,
  language: string
): Promise<{ genres: { id: number; name: string }[]; ok: boolean }> {
  const url = new URL(`${TMDB_API_V3_BASE}/genre/tv/list`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", language);

  const res = await fetch(url.toString(), { next: { revalidate: 86400 } });
  if (!res.ok) {
    return { ok: false, genres: [] };
  }

  const data = (await res.json()) as TmdbGenreListResponse;
  return { ok: true, genres: data.genres ?? [] };
}

function fillEmptyGenreNames(
  genres: { id: number; name: string }[],
  fallback: { id: number; name: string }[]
): { id: number; name: string }[] {
  if (fallback.length === 0) return genres;
  const byId = new Map(fallback.map((g) => [g.id, g.name]));
  return genres.map((g) => {
    const localized = String(g.name ?? "").trim();
    const en = String(byId.get(g.id) ?? "").trim();
    return { id: g.id, name: localized || en || "Unknown" };
  });
}

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key is not configured. Set TMDB_API_KEY in the environment." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const language = searchParams.get("language") ?? "en-US";
  if (!LANGUAGE_PATTERN.test(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  let { genres } = await fetchTmdbTvGenreList(apiKey, language);

  const primary = language.split("-")[0];
  if (
    genres.length === 0 &&
    primary !== language &&
    LANGUAGE_PATTERN.test(primary)
  ) {
    genres = (await fetchTmdbTvGenreList(apiKey, primary)).genres;
  }

  if (genres.length === 0 && language !== "en-US") {
    genres = (await fetchTmdbTvGenreList(apiKey, "en-US")).genres;
  }

  if (genres.length === 0) {
    return NextResponse.json(
      { error: "TMDB returned no genres" },
      { status: 502 }
    );
  }

  if (genres.some((g) => !String(g.name ?? "").trim())) {
    const { genres: enGenres } = await fetchTmdbTvGenreList(apiKey, "en-US");
    genres = fillEmptyGenreNames(genres, enGenres);
  }

  return NextResponse.json({ genres });
}
