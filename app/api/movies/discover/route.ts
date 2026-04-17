import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { originalLanguageForDiscover } from "@/lib/tmdb/discoverFilters";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { parseDiscoverSort } from "@/lib/tmdb/discoverSort";
import type {
  NormalizedDiscoverMovie,
  TmdbDiscoverMovieResult,
  TmdbDiscoverResponse,
} from "@/lib/tmdb/types";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB"]);
const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
/** TMDB discover allows TMDB page 1–500 */
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
/** TMDB returns 20 per request; we merge so each response returns this many movies */
const RESULTS_PER_VIEW = 24;

/**
 * TMDB `language` for discover text fields. Use English so titles match common poster
 * artwork; UI `language` still drives `with_original_language` via {@link originalLanguageForDiscover}.
 */
const DISCOVER_RESPONSE_LANGUAGE = "en-US";

const MAX_BROWSABLE_ITEMS = TMDB_MAX_PAGE * TMDB_PAGE_SIZE;
const MAX_DISPLAY_PAGE = Math.ceil(MAX_BROWSABLE_ITEMS / RESULTS_PER_VIEW);

function toNormalized(m: TmdbDiscoverMovieResult): NormalizedDiscoverMovie {
  return {
    id: m.id,
    title: m.title,
    releaseDate: m.release_date,
    posterUrl: posterUrl(m.poster_path),
    overview: m.overview,
  };
}

function buildDiscoverUrl(
  apiKey: string,
  watchRegion: string,
  tmdbLanguage: string,
  /** Single provider id, or pipe-separated OR list from {@link discoverAnyOttWatchProvidersParam}. */
  watchProvidersFilter: string | undefined,
  tmdbPage: number,
  withOriginalLanguage: string | undefined,
  sortBy: string,
  withGenres: string | undefined,
  releaseDateGte: string | undefined,
  releaseDateLte: string | undefined
): string {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("watch_region", watchRegion);
  url.searchParams.set("language", tmdbLanguage);
  url.searchParams.set("sort_by", sortBy);
  url.searchParams.set("include_adult", "false");
  url.searchParams.set("page", String(tmdbPage));
  if (withOriginalLanguage) {
    url.searchParams.set("with_original_language", withOriginalLanguage);
  }
  if (withGenres) {
    url.searchParams.set("with_genres", withGenres);
  }
  if (watchProvidersFilter) {
    url.searchParams.set("with_watch_providers", watchProvidersFilter);
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
  }
  if (releaseDateGte) {
    url.searchParams.set("primary_release_date.gte", releaseDateGte);
  }
  if (releaseDateLte) {
    url.searchParams.set("primary_release_date.lte", releaseDateLte);
  }
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
  const language = searchParams.get("language") ?? "en-US";
  const providerIdParam = searchParams.get("providerId");
  const pageRaw = searchParams.get("page");
  const pageParsed = pageRaw == null || pageRaw === "" ? 1 : Number(pageRaw);
  if (!Number.isInteger(pageParsed) || pageParsed < 1 || pageParsed > MAX_DISPLAY_PAGE) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  const displayPage = pageParsed;

  if (!ALLOWED_REGIONS.has(watchRegionRaw)) {
    return NextResponse.json({ error: "Invalid watchRegion" }, { status: 400 });
  }
  if (!LANGUAGE_PATTERN.test(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const sortBy = parseDiscoverSort(searchParams.get("sortBy"));
  const releaseDateGte = searchParams.get("releaseDateGte") ?? undefined;
  const releaseDateLte = searchParams.get("releaseDateLte") ?? undefined;

  let genreIdStr: string | undefined;
  const genreIdParam = searchParams.get("genreId");
  if (genreIdParam != null && genreIdParam !== "") {
    const gid = Number(genreIdParam);
    if (!Number.isInteger(gid) || gid < 1) {
      return NextResponse.json({ error: "Invalid genreId" }, { status: 400 });
    }
    genreIdStr = String(gid);
  }

  let watchProvidersFilter: string | undefined;
  if (providerIdParam != null && providerIdParam !== "") {
    const n = Number(providerIdParam);
    if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json({ error: "Invalid providerId" }, { status: 400 });
    }
    watchProvidersFilter = String(n);
  } else {
    /** "All" = any major OTT in region (excludes theatrical-only). */
    watchProvidersFilter = discoverAnyOttWatchProvidersParam(watchRegionRaw);
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
  const merged: NormalizedDiscoverMovie[] = [];
  let totalResults = 0;
  let totalPages = 1;

  const fetchOptions = { next: { revalidate: 3600 } as const };
  const withOriginalLanguage = originalLanguageForDiscover(watchRegionRaw, language);

  while (merged.length < RESULTS_PER_VIEW && tmdbPage <= TMDB_MAX_PAGE) {
    const url = buildDiscoverUrl(
      apiKey,
      watchRegionRaw,
      DISCOVER_RESPONSE_LANGUAGE,
      watchProvidersFilter,
      tmdbPage,
      withOriginalLanguage,
      sortBy,
      genreIdStr,
      releaseDateGte,
      releaseDateLte
    );
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
      totalResults = data.total_results;
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

  return NextResponse.json({
    page: displayPage,
    totalPages,
    totalResults,
    results: merged,
  });
}
