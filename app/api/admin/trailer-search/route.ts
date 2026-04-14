import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";
import { pickYoutubeTrailer } from "@/lib/tmdb/videoPicker";

const TMDB_SEARCH_LANGUAGE = "en-US";

type TmdbVideo = {
  key?: string;
  type?: string;
  site?: string;
  official?: boolean;
  iso_639_1?: string | null;
};

export type TrailerSearchResult = {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  releaseDate: string;
  youtubeKey: string | null;
  thumbnailUrl: string | null;
};

async function fetchVideos(
  tmdbId: number,
  mediaType: "movie" | "tv",
  apiKey: string
): Promise<TmdbVideo[]> {
  const url = new URL(`${TMDB_API_V3_BASE}/${mediaType}/${tmdbId}/videos`);
  url.searchParams.set("api_key", apiKey);
  // Include all video languages so non-English trailers are found
  url.searchParams.set("include_video_language", "en,null,hi,ml,ta,te,kn,bn,mr,gu,pa,ur,ko,ja,zh,fr,de,es,pt,it,ru,ar,th,id,tr,pl,nl,sv,da,no,fi");
  try {
    const res = await fetch(url.toString());
    if (!res.ok) return [];
    const data = (await res.json()) as { results?: TmdbVideo[] };
    return data.results ?? [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "TMDB API key not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("query") ?? "").trim();
  const type = searchParams.get("type") === "tv" ? "tv" : "movie";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Search TMDB
  const searchEndpoint = type === "tv" ? "search/tv" : "search/movie";
  const searchUrl = new URL(`${TMDB_API_V3_BASE}/${searchEndpoint}`);
  searchUrl.searchParams.set("api_key", apiKey);
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("language", TMDB_SEARCH_LANGUAGE);
  searchUrl.searchParams.set("page", "1");
  searchUrl.searchParams.set("include_adult", "false");

  const searchRes = await fetch(searchUrl.toString());
  if (!searchRes.ok) {
    return NextResponse.json({ error: "TMDB search failed" }, { status: 502 });
  }

  const searchData = (await searchRes.json()) as {
    results?: {
      id?: number;
      title?: string;
      name?: string;
      release_date?: string;
      first_air_date?: string;
      poster_path?: string | null;
    }[];
  };

  const rawResults = (searchData.results ?? [])
    .filter(
      (r) => typeof r.id === "number" && r.id >= 1
    )
    .slice(0, 10);

  // Fetch YouTube trailers in parallel for top results
  const videoBatches = await Promise.all(
    rawResults.map((r) => fetchVideos(r.id!, type, apiKey))
  );

  const results: TrailerSearchResult[] = [];
  for (let i = 0; i < rawResults.length; i++) {
    const r = rawResults[i];
    const title = (type === "tv" ? r.name : r.title) ?? "";
    if (!title.trim()) continue;

    const youtubeKey = pickYoutubeTrailer(videoBatches[i] as Parameters<typeof pickYoutubeTrailer>[0]);

    results.push({
      tmdbId: r.id!,
      mediaType: type,
      title: title.trim(),
      posterPath: r.poster_path ?? null,
      releaseDate:
        (type === "tv" ? r.first_air_date : r.release_date) ?? "",
      youtubeKey,
      thumbnailUrl: youtubeKey
        ? `https://img.youtube.com/vi/${youtubeKey}/hqdefault.jpg`
        : null,
    });
  }

  return NextResponse.json({ results });
}
