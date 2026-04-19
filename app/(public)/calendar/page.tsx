"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { RegionPopover } from "@/components/LocaleMenu";
import { WATCH_REGIONS, useRegionLanguage } from "@/components/RegionLanguageProvider";
import { cn } from "@/lib/utils";

type TabKey = "In Theatres" | "Movies on OTT" | "TV Series on OTT";

type CalendarMovie = {
  id: number;
  kind: "movie" | "tv";
  title: string;
  date: string;
  image: string | null;
  overview: string;
};

const tabs: TabKey[] = ["In Theatres", "Movies on OTT", "TV Series on OTT"];

type MoviesApiJson = {
  results: {
    id: number;
    title: string;
    releaseDate: string;
    posterUrl: string | null;
    overview: string;
  }[];
};

type TvApiJson = {
  results: {
    id: number;
    title: string;
    firstAirDate: string;
    posterUrl: string | null;
    overview: string;
  }[];
};

function regionLabel(code: string): string {
  return WATCH_REGIONS.find((r) => r.code === code)?.label ?? code;
}

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
}

function releaseYear(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return "";
  return `(${d.getFullYear()})`;
}

function toSections(items: CalendarMovie[]) {
  const grouped = new Map<string, CalendarMovie[]>();
  for (const item of items) {
    const dateKey = item.date && item.date !== "—" ? item.date : "TBA";
    const arr = grouped.get(dateKey) ?? [];
    arr.push(item);
    grouped.set(dateKey, arr);
  }

  const sorted = [...grouped.entries()].sort(([a], [b]) => {
    if (a === "TBA") return 1;
    if (b === "TBA") return -1;
    return a.localeCompare(b);
  });

  return sorted.map(([dateKey, movies]) => ({
    dayLabel: dateKey === "TBA" ? "To Be Announced" : formatDayLabel(dateKey),
    movies,
  }));
}

function isWithinNextMonths(iso: string, months: number): boolean {
  if (!iso || iso === "—") return false;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const now = new Date();
  const maxFuture = new Date();
  maxFuture.setMonth(maxFuture.getMonth() + months);
  return d >= now && d <= maxFuture;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function dateRange(pastMonths: number, futureMonths: number): { gte: string; lte: string } {
  const min = new Date();
  min.setMonth(min.getMonth() - pastMonths);
  const max = new Date();
  max.setMonth(max.getMonth() + futureMonths);
  return { gte: toIsoDate(min), lte: toIsoDate(max) };
}

export default function ReleaseCalendarPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("In Theatres");
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement>(null);
  const { watchRegion, languages } = useRegionLanguage();
  const languagesParam = languages.join(",");

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!localeRef.current?.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const calendarQuery = useQuery<CalendarMovie[]>({
    queryKey: ["calendar-page", activeTab, watchRegion, languagesParam],
    queryFn: async () => {
      if (activeTab === "In Theatres") {
        const region = encodeURIComponent(watchRegion);
        const [nowRes, upcomingRes] = await Promise.all([
          fetch(`/api/movies/now-playing?watchRegion=${region}&page=1`, { cache: "no-store" }),
          fetch(`/api/movies/upcoming?watchRegion=${region}&page=1`, { cache: "no-store" }),
        ]);
        if (!nowRes.ok || !upcomingRes.ok) {
          throw new Error("Failed to load theatrical and upcoming releases");
        }
        const [nowData, upcomingData] = (await Promise.all([
          nowRes.json(),
          upcomingRes.json(),
        ])) as [MoviesApiJson, MoviesApiJson];

        const merged = [...nowData.results, ...upcomingData.results];
        const deduped = new Map<number, (typeof merged)[number]>();
        for (const row of merged) {
          if (!deduped.has(row.id)) deduped.set(row.id, row);
        }
        return [...deduped.values()]
          .filter((m) => isWithinNextMonths(m.releaseDate, 2))
          .map((m) => ({
            id: m.id,
            kind: "movie" as const,
            title: m.title,
            date: m.releaseDate,
            image: m.posterUrl,
            overview: m.overview,
          }));
      }

      if (activeTab === "Movies on OTT") {
        const { gte, lte } = dateRange(1, 2);
        const params = new URLSearchParams({
          watchRegion,
          languages: languagesParam,
          sortBy: "primary_release_date.desc",
          page: "1",
          releaseDateGte: gte,
          releaseDateLte: lte,
        });
        const res = await fetch(`/api/movies/discover?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load OTT movies");
        const data = (await res.json()) as MoviesApiJson;
        return data.results.map((m) => ({
          id: m.id,
          kind: "movie" as const,
          title: m.title,
          date: m.releaseDate,
          image: m.posterUrl,
          overview: m.overview,
        }));
      }

      const { gte, lte } = dateRange(1, 2);
      const params = new URLSearchParams({
        watchRegion,
        languages: languagesParam,
        sortBy: "first_air_date.desc",
        page: "1",
        airDateGte: gte,
        airDateLte: lte,
      });
      const res = await fetch(`/api/tv/discover?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load OTT TV series");
      const data = (await res.json()) as TvApiJson;
      return data.results.map((s) => ({
        id: s.id,
        kind: "tv" as const,
        title: s.title,
        date: s.firstAirDate,
        image: s.posterUrl,
        overview: s.overview,
      }));
    },
  });

  const sections = useMemo(() => {
    return toSections(calendarQuery.data ?? []);
  }, [calendarQuery.data]);

  return (
    <main className="relative min-h-screen pb-10 pt-8 text-white sm:pb-16 sm:pt-12">
      {/* page glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container">
        {/* Header */}
        <div className="mt-1 px-3 sm:mt-2 sm:px-6 lg:px-0">
          <h1 className="font-(family-name:--font-anton) text-2xl tracking-tight sm:text-4xl md:text-5xl">
            Upcoming releases{" "}
            <span className="relative inline-block" ref={localeRef}>
              <button
                type="button"
                onClick={() => setLocaleOpen((o) => !o)}
                className="inline-flex items-baseline gap-1 cursor-pointer sm:gap-2"
                aria-label="Change region"
                aria-expanded={localeOpen}
                aria-haspopup="dialog"
              >
                <span className={cn("font-bold text-white transition", localeOpen && "text-white/80")}>
                  {regionLabel(watchRegion)}
                </span>
                <ChevronDown
                  className={cn(
                    "relative top-0.5 inline size-4 text-white/60 transition-transform sm:size-5",
                    localeOpen && "rotate-180"
                  )}
                />
              </button>
              {localeOpen ? <RegionPopover /> : null}
            </span>
          </h1>

          {/* Tabs */}
          <div className="-mx-3 mt-4 flex items-center gap-1 overflow-x-auto border-b border-white/15 px-3 sm:mx-0 sm:mt-6 sm:gap-6 sm:px-0">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setActiveTab(t)}
                className={`relative shrink-0 pb-2.5 text-xs font-semibold uppercase tracking-wide transition sm:pb-3 sm:text-sm ${
                  activeTab === t
                    ? "text-white"
                    : "text-white/50 hover:text-white/75"
                }`}
              >
                {t}
                {activeTab === t ? (
                  <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#E50914]" />
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-8 px-3 sm:mt-10 sm:space-y-10 sm:px-6 lg:px-0">
          {calendarQuery.isLoading ? (
            <p className="text-sm text-white/70">Loading calendar…</p>
          ) : null}
          {calendarQuery.isError ? (
            <p className="text-sm text-red-300">Could not load release calendar right now.</p>
          ) : null}
          {sections.map(({ dayLabel, movies }) => (
            <section key={dayLabel}>
              <h2 className="font-(family-name:--font-anton) mb-3 text-base uppercase tracking-tight text-white/90 sm:mb-4 sm:text-lg md:text-xl">
                {dayLabel}
              </h2>

              <div className="divide-y divide-white/10">
                {movies.map((m, idx) => (
                  <Link
                    key={`${dayLabel}-${m.id}-${idx}`}
                    href={m.kind === "tv" ? `/tv-shows/${m.id}` : `/movies/${m.id}`}
                    className="group flex items-start gap-3 rounded-md px-1 py-3 text-inherit no-underline transition hover:bg-white/5 sm:items-center sm:gap-5 sm:px-0 sm:py-4"
                  >
                    {/* Poster thumbnail */}
                    <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded border border-white/10 bg-white/5 sm:h-20 sm:w-14 sm:rounded-md">
                      {m.image ? (
                        <Image
                          src={m.image}
                          alt={m.title}
                          fill
                          sizes="(min-width:640px) 56px, 44px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-[10px] text-white/40">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-(family-name:--font-anton) text-sm leading-snug text-white line-clamp-2 sm:text-base sm:line-clamp-1">
                        {m.title} {releaseYear(m.date)}
                      </h3>
                      {m.overview ? (
                        <p className="mt-0.5 text-[0.65rem] leading-relaxed text-white/50 line-clamp-2 sm:mt-1 sm:text-xs">
                          {m.overview}
                        </p>
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
          {!calendarQuery.isLoading && !calendarQuery.isError && sections.length === 0 ? (
            <p className="text-sm text-white/70">No releases found for this selection.</p>
          ) : null}
        </div>
      </div>
    </main>
  );
}
