import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, posterUrl } from "@/lib/tmdb/constants";
import { discoverAnyOttWatchProvidersParam } from "@/lib/tmdb/platforms";
import { parseDiscoverSort } from "@/lib/tmdb/discoverSort";
import { isValidContentLanguage } from "@/lib/regionLanguagePrefs";
import type {
  NormalizedDiscoverMovie,
  TmdbDiscoverMovieResult,
  TmdbDiscoverResponse,
} from "@/lib/tmdb/types";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB", "CA", "NL", "AE"]);
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
const RESULTS_PER_VIEW = 30;
const MAX_PARALLEL_LANGUAGES = 3;

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

async function fetchOnePage(
  apiKey: string,
  watchRegion: string,
  watchProvidersFilter: string | undefined,
  tmdbPage: number,
  withOriginalLanguage: string | undefined,
  sortBy: string,
  genreIdStr: string | undefined,
  releaseDateGte: string | undefined,
  releaseDateLte: string | undefined
): Promise<{ results: TmdbDiscoverMovieResult[]; totalResults: number } | null> {
  const url = buildDiscoverUrl(
    apiKey,
    watchRegion,
    DISCOVER_RESPONSE_LANGUAGE,
    watchProvidersFilter,
    tmdbPage,
    withOriginalLanguage,
    sortBy,
    genreIdStr,
    releaseDateGte,
    releaseDateLte
  );
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const data = (await res.json()) as TmdbDiscoverResponse;
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

  // How many TMDB results we need per language to fill one display page.
  // With N languages, each needs ceil(RESULTS_PER_VIEW / N) items.
  const langList = languages.length > 0 ? languages : [undefined];
  const perLangNeeded = Math.ceil(RESULTS_PER_VIEW / langList.length);
  // Each TMDB page gives 20 results; figure out how many pages we need.
  const tmdbPagesNeeded = Math.ceil(perLangNeeded / TMDB_PAGE_SIZE);
  const tmdbPageStart = Math.floor(offset / TMDB_PAGE_SIZE) + 1;
  const skip = offset % TMDB_PAGE_SIZE;

  // Fetch enough TMDB pages per language in parallel
  const fetchPromises: Promise<{
    results: TmdbDiscoverMovieResult[];
    totalResults: number;
  } | null>[] = [];
  const langIndex: number[] = [];

  for (let li = 0; li < langList.length; li++) {
    for (let p = 0; p < tmdbPagesNeeded; p++) {
      fetchPromises.push(
        fetchOnePage(
          apiKey,
          watchRegionRaw,
          watchProvidersFilter,
          tmdbPageStart + p,
          langList[li],
          sortBy,
          genreIdStr,
          releaseDateGte,
          releaseDateLte
        )
      );
      langIndex.push(li);
    }
  }

  const allResults = await Promise.all(fetchPromises);

  // Concatenate TMDB pages per language into one slice each
  const langSlices: TmdbDiscoverMovieResult[][] = langList.map(() => []);
  let maxTotalResults = 0;

  for (let i = 0; i < allResults.length; i++) {
    const result = allResults[i];
    if (!result) continue;
    if (result.totalResults > maxTotalResults) {
      maxTotalResults = result.totalResults;
    }
    langSlices[langIndex[i]].push(...result.results);
  }

  // Apply skip only to the first batch of results
  for (let li = 0; li < langSlices.length; li++) {
    if (skip > 0) langSlices[li] = langSlices[li].slice(skip);
  }

  // Round-robin: take one result from each language in turn so every
  // selected language gets fair representation on every page.
  const seen = new Set<number>();
  const merged: NormalizedDiscoverMovie[] = [];
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
    results.sort((a, b) => (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""));
  }

  return NextResponse.json({
    page: displayPage,
    totalPages,
    totalResults: maxTotalResults,
    results,
  });
}
