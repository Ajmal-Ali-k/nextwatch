import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { originalLanguageForDiscover } from "@/lib/tmdb/discoverFilters";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { parseTvDiscoverSort } from "@/lib/tmdb/tvDiscoverSort";
import type {
  NormalizedDiscoverTvShow,
  TmdbDiscoverTvResult,
  TmdbDiscoverTvResponse,
} from "@/lib/tmdb/types";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB"]);
const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
const RESULTS_PER_VIEW = 24;

const DISCOVER_RESPONSE_LANGUAGE = "en-US";

const MAX_BROWSABLE_ITEMS = TMDB_MAX_PAGE * TMDB_PAGE_SIZE;
const MAX_DISPLAY_PAGE = Math.ceil(MAX_BROWSABLE_ITEMS / RESULTS_PER_VIEW);

function toNormalized(m: TmdbDiscoverTvResult): NormalizedDiscoverTvShow {
  return {
    id: m.id,
    title: m.name,
    firstAirDate: m.first_air_date,
    posterUrl: posterUrl(m.poster_path),
    overview: m.overview,
  };
}

function buildDiscoverTvUrl(
  apiKey: string,
  watchRegion: string,
  tmdbLanguage: string,
  providerId: string | undefined,
  tmdbPage: number,
  withOriginalLanguage: string | undefined,
  sortBy: string,
  withGenres: string | undefined,
  airDateGte: string | undefined,
  airDateLte: string | undefined
): string {
  const url = new URL(`${TMDB_API_V3_BASE}/discover/tv`);
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
  if (providerId) {
    url.searchParams.set("with_watch_providers", providerId);
    url.searchParams.set("with_watch_monetization_types", "flatrate|rent|buy");
  }
  if (airDateGte) {
    url.searchParams.set("first_air_date.gte", airDateGte);
  }
  if (airDateLte) {
    url.searchParams.set("first_air_date.lte", airDateLte);
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

  const sortBy = parseTvDiscoverSort(searchParams.get("sortBy"));
  const airDateGte = searchParams.get("airDateGte") ?? undefined;
  const airDateLte = searchParams.get("airDateLte") ?? undefined;

  let genreIdStr: string | undefined;
  const genreIdParam = searchParams.get("genreId");
  if (genreIdParam != null && genreIdParam !== "") {
    const gid = Number(genreIdParam);
    if (!Number.isInteger(gid) || gid < 1) {
      return NextResponse.json({ error: "Invalid genreId" }, { status: 400 });
    }
    genreIdStr = String(gid);
  }

  let providerId: string | undefined;
  if (providerIdParam != null && providerIdParam !== "") {
    const n = Number(providerIdParam);
    if (!Number.isInteger(n) || n < 1) {
      return NextResponse.json({ error: "Invalid providerId" }, { status: 400 });
    }
    providerId = String(n);
  } else {
    providerId = discoverAnyOttWatchProvidersParam(watchRegionRaw);
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
  const merged: NormalizedDiscoverTvShow[] = [];
  let totalResults = 0;
  let totalPages = 1;

  const fetchOptions = { next: { revalidate: 3600 } as const };
  const withOriginalLanguage = originalLanguageForDiscover(watchRegionRaw, language);

  while (merged.length < RESULTS_PER_VIEW && tmdbPage <= TMDB_MAX_PAGE) {
    const url = buildDiscoverTvUrl(
      apiKey,
      watchRegionRaw,
      DISCOVER_RESPONSE_LANGUAGE,
      providerId,
      tmdbPage,
      withOriginalLanguage,
      sortBy,
      genreIdStr,
      airDateGte,
      airDateLte
    );
    const res = await fetch(url, fetchOptions);

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: "TMDB request failed", status: res.status, detail: text.slice(0, 200) },
        { status: 502 }
      );
    }

    const data = (await res.json()) as TmdbDiscoverTvResponse;
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
