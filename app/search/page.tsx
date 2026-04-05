import type { Metadata } from "next";
import { Suspense } from "react";

import SearchPageContent from "./SearchPageContent";

function SearchFallback() {
  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>
      <div className="mx-auto container px-4 pt-2 sm:px-6 lg:px-0">
        <div className="h-10 max-w-2xl animate-pulse rounded-lg bg-white/10" />
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

type SearchPageProps = {
  searchParams: Promise<{ q?: string; query?: string }>;
};

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const p = await searchParams;
  const q = (p.q ?? p.query ?? "").trim();
  if (q.length < 2) {
    return { title: "Search | NextWatchList" };
  }
  return {
    title: `Search: ${q} | NextWatchList`,
    description: `Search results for “${q}” on NextWatchList.`,
  };
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchPageContent />
    </Suspense>
  );
}
