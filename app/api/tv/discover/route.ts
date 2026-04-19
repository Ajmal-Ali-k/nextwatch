import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { parseTvDiscoverSort } from "@/lib/tmdb/tvDiscoverSort";
import { isValidContentLanguage } from "@/lib/regionLanguagePrefs";
import type {
  NormalizedDiscoverTvShow,
  TmdbDiscoverTvResult,
  TmdbDiscoverTvResponse,
} from "@/lib/tmdb/types";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB", "CA", "NL", "AE"]);
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
const RESULTS_PER_VIEW = 30;
const MAX_PARALLEL_LANGUAGES = 3;

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

async function fetchOnePage(
  apiKey: string,
  watchRegion: string,
  providerId: string | undefined,
  tmdbPage: number,
  withOriginalLanguage: string | undefined,
  sortBy: string,
  genreIdStr: string | undefined,
  airDateGte: string | undefined,
  airDateLte: string | undefined
): Promise<{ results: TmdbDiscoverTvResult[]; totalResults: number } | null> {
  const url = buildDiscoverTvUrl(
    apiKey,
    watchRegion,
    DISCOVER_RESPONSE_LANGUAGE,
    providerId,
    tmdbPage,
    withOriginalLanguage,
    sortBy,
    genreIdStr,
    airDateGte,
    airDateLte
  );
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as TmdbDiscoverTvResponse;
  return { results: data.results, totalResults: data.total_results };
}

function parseLanguages(param: string | null): string[] {
  if (!param) return [];
  return param
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(isValidContentLanguage)
    .slice(0, MAX_PARALLEL_LANGUAGES);
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
  const languages = parseLanguages(searchParams.get("languages"));
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

  const langList = languages.length > 0 ? languages : [undefined];
  const perLangNeeded = Math.ceil(RESULTS_PER_VIEW / langList.length);
  const tmdbPagesNeeded = Math.ceil(perLangNeeded / TMDB_PAGE_SIZE);
  const tmdbPageStart = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  const skip = offset % TMDB_PAGE_SIZE;

  const fetchPromises: Promise<{
    results: TmdbDiscoverTvResult[];
    totalResults: number;
  } | null>[] = [];
  const langIdx: number[] = [];

  for (let li = 0; li < langList.length; li++) {
    for (let p = 0; p < tmdbPagesNeeded; p++) {
      fetchPromises.push(
        fetchOnePage(
          apiKey,
          watchRegionRaw,
          providerId,
          tmdbPageStart + p,
          langList[li],
          sortBy,
          genreIdStr,
          airDateGte,
          airDateLte
        )
      );
      langIdx.push(li);
    }
  }

  const allResults = await Promise.all(fetchPromises);

  const langSlices: TmdbDiscoverTvResult[][] = langList.map(() => []);
  let maxTotalResults = 0;

  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (!result) continue;
    if (result.totalResults > maxTotalResults) {
      maxTotalResults = result.totalResults;
    }
    langSlices[langIdx[i]].push(...result.results);
  }

  for (let li = 0; li < langSlices.length; li++) {
    if (skip > 0) langSlices[li] = langSlices[li].slice(skip);
  }

  const seen = new Set<number>();
  const merged: NormalizedDiscoverTvShow[] = [];
  const maxLen = Math.max(0, ...langSlices.map((s) => s.length));
  for (let i = 0; i < maxLen && merged.length < RESULTS_PER_VIEW; i++) {
    for (const slice of langSlices) {
      if (i >= slice.length) continue;
      const m = slice[i];
      if (seen.has(m.id)) continue;
      seen.add(m.id);
      merged.push(toNormalized(m));
    }
  }

  const cappedItems = Math.min(maxTotalResults, MAX_BROWSABLE_ITEMS);
  const totalPages =
    maxTotalResults === 0
      ? 1
      : Math.max(1, Math.ceil(cappedItems / RESULTS_PER_VIEW));

  if (displayPage > totalPages || offset >= cappedItems) {
    return NextResponse.json({
      page: displayPage,
      totalPages,
      totalResults: maxTotalResults,
      results: [],
    });
  }

  const results = merged.slice(0, RESULTS_PER_VIEW);

  if (sortBy === "popularity.desc") {
    results.sort((a, b) =>
      (b.firstAirDate ?? "").localeCompare(a.firstAirDate ?? "")
    );
  }

  return NextResponse.json({
    page: displayPage,
    totalPages,
    totalResults: maxTotalResults,
    results,
  });
}
