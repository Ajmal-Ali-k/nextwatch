import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { originalLanguageForDiscover } from "@/lib/tmdb/discoverFilters";
import type {
  NormalizedDiscoverMovie,
  TmdbDiscoverMovieResult,
  TmdbDiscoverResponse,
} from "@/lib/tmdb/types";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB"]);
/** TMDB now_playing uses the same page cap as other movie lists. */
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
/** Merge TMDB pages so each UI page shows this many movies (same as discover). */
const RESULTS_PER_VIEW = 24;

/** English titles on cards; region still scopes theatrical releases. */
const NOW_PLAYING_RESPONSE_LANGUAGE = "en-US";

const MAX_BROWSABLE_ITEMS = TMDB_MAX_PAGE * TMDB_PAGE_SIZE;
const MAX_DISPLAY_PAGE = Math.ceil(MAX_BROWSABLE_ITEMS / RESULTS_PER_VIEW);

type NormalizedWithLang = NormalizedDiscoverMovie & { originalLanguage?: string };

function toNormalized(m: TmdbDiscoverMovieResult): NormalizedWithLang {
  return {
    id: m.id,
    title: m.title,
    releaseDate: m.release_date,
    posterUrl: posterUrl(m.poster_path),
    overview: m.overview,
    originalLanguage: m.original_language,
  };
}

function buildNowPlayingUrl(
  apiKey: string,
  region: string,
  tmdbPage: number
): string {
  const url = new URL(`${TMDB_API_V3_BASE}/movie/now_playing`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("language", NOW_PLAYING_RESPONSE_LANGUAGE);
  url.searchParams.set("region", region);
  url.searchParams.set("page", String(tmdbPage));
  return url.toString();
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
  const watchRegionRaw = (searchParams.get("watchRegion") ?? "IN").toUpperCase();
  const language = searchParams.get("language") ?? "";
  const preferredLang = originalLanguageForDiscover(watchRegionRaw, language);
  const pageRaw = searchParams.get("page");
  const pageParsed = pageRaw == null || pageRaw === "" ? 1 : Number(pageRaw);
  if (!Number.isInteger(pageParsed) || pageParsed < 1 || pageParsed > MAX_DISPLAY_PAGE) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  const displayPage = pageParsed;

  if (!ALLOWED_REGIONS.has(watchRegionRaw)) {
    return NextResponse.json({ error: "Invalid watchRegion" }, { status: 400 });
  }

  const offset = (displayPage - 1) * RESULTS_PER_VIEW;
  if (offset >= MAX_BROWSABLE_ITEMS) {
    return NextResponse.json({
      page: displayPage,
      totalPages: 1,
      totalResults: 0,
      results: [],
    });
  }

  let tmdbPage = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  let skip = offset % TMDB_PAGE_SIZE;
  const merged: NormalizedWithLang[] = [];
  let totalResults = 0;
  let totalPages = 1;

  const fetchOptions = { next: { revalidate: 900 } as const };

  while (merged.length < RESULTS_PER_VIEW && tmdbPage <= TMDB_MAX_PAGE) {
    const url = buildNowPlayingUrl(apiKey, watchRegionRaw, tmdbPage);
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "TMDB request failed", status: res.status, detail: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as TmdbDiscoverResponse;
    if (totalResults === 0) {
      totalResults = data.total_results ?? 0;
      const cappedItems = Math.min(totalResults, MAX_BROWSABLE_ITEMS);
      totalPages =
        totalResults === 0 ? 1 : Math.max(1, Math.ceil(cappedItems / RESULTS_PER_VIEW));
      if (displayPage > totalPages || offset >= cappedItems) {
        return NextResponse.json({
          page: displayPage,
          totalPages,
          totalResults,
          results: [],
        });
      }
    }

    const slice = data.results.slice(skip);
    skip = 0;
    for (const m of slice) {
      merged.push(toNormalized(m));
      if (merged.length >= RESULTS_PER_VIEW) break;
    }

    if (data.results.length === 0) break;
    tmdbPage += 1;
  }

  merged.sort((a, b) => {
    if (preferredLang) {
      const aMatch = a.originalLanguage === preferredLang ? 0 : 1;
      const bMatch = b.originalLanguage === preferredLang ? 0 : 1;
      if (aMatch !== bMatch) return aMatch - bMatch;
    }
    return (b.releaseDate ?? "").localeCompare(a.releaseDate ?? "");
  });

  // Strip internal field before sending to client
  const results: NormalizedDiscoverMovie[] = merged.map(
    ({ originalLanguage: _, ...rest }) => rest
  );

  return NextResponse.json({
    page: displayPage,
    totalPages,
    totalResults,
    results,
  });
}
