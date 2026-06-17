import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLd } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo";
import { buildItemListJsonLd } from "@/lib/seo/structuredData";
import { getServerHomePreferences } from "@/lib/server/homePreferences";
import { parseDiscoverSort } from "@/lib/tmdb/discoverSort";
import {
  fetchDiscoverMoviePage,
  type NormalizedDiscoverMovie,
} from "@/lib/tmdb/discoverPages";
import {
  discoverAnyOttWatchProvidersParam,
  getProviderIdForRegion,
  MAJOR_OTT_PLATFORM_KEYS,
  type OttPlatformKey,
} from "@/lib/tmdb/platforms";
import MoviesPageContent, {
  type MoviesInitialDiscoverData,
} from "./MoviesPageContent";

export const metadata: Metadata = createPageMetadata({
  title: "Movies on OTT",
  description:
    "Browse popular and newly released movies available across streaming platforms by region and language.",
  path: "/movies",
});

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const OTT_KEY_SET = new Set<string>(MAJOR_OTT_PLATFORM_KEYS);

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parsePositiveInteger(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function parsePage(value: string | null): number {
  const n = parsePositiveInteger(value);
  return n ?? 1;
}

function movieItemList(results: NormalizedDiscoverMovie[]) {
  return buildItemListJsonLd({
    name: "New Movies on OTT",
    url: "/movies",
    items: results.map((movie) => ({
      title: movie.title,
      url: `/movies/${movie.id}`,
      image: movie.posterUrl,
    })),
  });
}

async function getInitialDiscoverData(
  searchParams: Record<string, string | string[] | undefined>
): Promise<MoviesInitialDiscoverData | undefined> {
  const prefs = await getServerHomePreferences();
  const providerRaw = firstParam(searchParams.provider);
  const providerId = parsePositiveInteger(providerRaw) ?? undefined;
  const platformRaw = firstParam(searchParams.platform);
  const platform =
    providerId === undefined && platformRaw && OTT_KEY_SET.has(platformRaw)
      ? (platformRaw as OttPlatformKey)
      : null;
  const presetProviderId =
    platform === null ? undefined : getProviderIdForRegion(prefs.watchRegion, platform);
  const resolvedProviderId = providerId ?? presetProviderId;

  if (platform !== null && presetProviderId === undefined) return undefined;

  const page = parsePage(firstParam(searchParams.page));
  const sortBy = parseDiscoverSort(firstParam(searchParams.sort));
  const genreId = parsePositiveInteger(firstParam(searchParams.genre));
  const languagesParam = prefs.languages.join(",");
  const data = await fetchDiscoverMoviePage({
    watchRegion: prefs.watchRegion,
    languages: prefs.languages,
    page,
    providerId: resolvedProviderId,
    watchProvidersFilter:
      resolvedProviderId === undefined
        ? discoverAnyOttWatchProvidersParam(prefs.watchRegion)
        : undefined,
    sortBy,
    genreId,
  });

  if (!data) return undefined;

  return {
    data,
    updatedAt: Date.now(),
    params: {
      watchRegion: prefs.watchRegion,
      languagesParam,
      page,
      providerId: resolvedProviderId ?? null,
      sortBy,
      genreId,
    },
  };
}

function MoviesPageFallback() {
  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>
      <div className="mx-auto container px-4 pt-2 sm:px-6 lg:px-0">
        <div className="h-12 max-w-3xl animate-pulse rounded-lg bg-white/10" />
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="aspect-2/3 animate-pulse rounded-xl border border-white/10 bg-white/10"
            />
          ))}
        </div>
      </div>
    </main>
  );
}

export default async function MoviesPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialDiscoverData = await getInitialDiscoverData(resolvedSearchParams);

  return (
    <>
      {initialDiscoverData && initialDiscoverData.data.results.length > 0 ? (
        <JsonLd data={movieItemList(initialDiscoverData.data.results)} />
      ) : null}
      <Suspense fallback={<MoviesPageFallback />}>
        <MoviesPageContent initialDiscoverData={initialDiscoverData} />
      </Suspense>
    </>
  );
}
