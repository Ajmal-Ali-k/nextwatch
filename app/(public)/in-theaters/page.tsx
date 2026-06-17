import type { Metadata } from "next";
import { Suspense } from "react";

import { JsonLd } from "@/components/JsonLd";
import { createPageMetadata } from "@/lib/seo";
import { buildItemListJsonLd } from "@/lib/seo/structuredData";
import { getServerHomePreferences } from "@/lib/server/homePreferences";
import {
  fetchNowPlayingMoviePage,
  type NormalizedDiscoverMovie,
} from "@/lib/tmdb/discoverPages";
import InTheatersPageContent, {
  type InTheatersInitialData,
} from "./InTheatersPageContent";

export const metadata: Metadata = createPageMetadata({
  title: "Movies in Theaters",
  description:
    "See new and upcoming cinema releases with regional theater availability on NextWatchList.",
  path: "/in-theaters",
});

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function parsePage(value: string | null): number {
  if (value == null || value === "") return 1;
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : 1;
}

function theaterItemList(results: NormalizedDiscoverMovie[]) {
  return buildItemListJsonLd({
    name: "Now Playing in Theaters",
    url: "/in-theaters",
    items: results.map((movie) => ({
      title: movie.title,
      url: `/movies/${movie.id}`,
      image: movie.posterUrl,
    })),
  });
}

async function getInitialData(
  searchParams: Record<string, string | string[] | undefined>
): Promise<InTheatersInitialData | undefined> {
  const prefs = await getServerHomePreferences();
  const page = parsePage(firstParam(searchParams.page));
  const languagesParam = prefs.languages.join(",");
  const data = await fetchNowPlayingMoviePage({
    watchRegion: prefs.watchRegion,
    languages: prefs.languages,
    page,
  });

  if (!data) return undefined;

  return {
    data,
    updatedAt: Date.now(),
    params: {
      watchRegion: prefs.watchRegion,
      languagesParam,
      page,
    },
  };
}

function InTheatersFallback() {
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

export default async function InTheatersPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const initialData = await getInitialData(resolvedSearchParams);

  return (
    <>
      {initialData && initialData.data.results.length > 0 ? (
        <JsonLd data={theaterItemList(initialData.data.results)} />
      ) : null}
      <Suspense fallback={<InTheatersFallback />}>
        <InTheatersPageContent initialData={initialData} />
      </Suspense>
    </>
  );
}
