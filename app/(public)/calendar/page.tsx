"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRegionLanguage } from "@/components/RegionLanguageProvider";

type TabKey = "In Theatres" | "Movies on OTT" | "TV Series on OTT";

type CalendarMovie = {
  id: number;
  kind: "movie" | "tv";
  title: string;
  date: string;
  image: string | null;
};

const tabs: TabKey[] = ["In Theatres", "Movies on OTT", "TV Series on OTT"];

type MoviesApiJson = {
  results: {
    id: number;
    title: string;
    releaseDate: string;
    posterUrl: string | null;
  }[];
};

type TvApiJson = {
  results: {
    id: number;
    title: string;
    firstAirDate: string;
    posterUrl: string | null;
  }[];
};

function formatDayLabel(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
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
    return b.localeCompare(a);
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

function isWithinWindow(iso: string, pastMonths: number, futureMonths: number): boolean {
  if (!iso || iso === "—") return false;
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - pastMonths);
  const maxDate = new Date();
  maxDate.setMonth(maxDate.getMonth() + futureMonths);
  return d >= minDate && d <= maxDate;
}

export default function ReleaseCalendarPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("In Theatres");
  const { watchRegion, language } = useRegionLanguage();

  const calendarQuery = useQuery<CalendarMovie[]>({
    queryKey: ["calendar-page", activeTab, watchRegion, language],
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
          }));
      }

      if (activeTab === "Movies on OTT") {
        const params = new URLSearchParams({
          watchRegion,
          language,
          sortBy: "primary_release_date.desc",
          page: "1",
        });
        const res = await fetch(`/api/movies/discover?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Failed to load OTT movies");
        const data = (await res.json()) as MoviesApiJson;
        return data.results
          .filter((m) => isWithinWindow(m.releaseDate, 24, 2))
          .map((m) => ({
            id: m.id,
            kind: "movie" as const,
            title: m.title,
            date: m.releaseDate,
            image: m.posterUrl,
          }));
      }

      const params = new URLSearchParams({
        watchRegion,
        language,
        sortBy: "first_air_date.desc",
        page: "1",
      });
      const res = await fetch(`/api/tv/discover?${params.toString()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Failed to load OTT TV series");
      const data = (await res.json()) as TvApiJson;
      return data.results
        .filter((s) => isWithinWindow(s.firstAirDate, 24, 2))
        .map((s) => ({
          id: s.id,
          kind: "tv" as const,
          title: s.title,
          date: s.firstAirDate,
          image: s.posterUrl,
        }));
    },
  });

  const sections = useMemo(() => {
    return toSections(calendarQuery.data ?? []);
  }, [calendarQuery.data]);

  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      {/* page glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container">
        {/* Header */}
        <div className="mt-2 px-4 sm:px-6 lg:px-0">
          <div className="flex max-w-4xl flex-col gap-4">
            <h1 className="font-(family-name:--font-anton) text-4xl sm:text-5xl uppercase tracking-tight">
              Release Calendar
            </h1>

            <div className="flex flex-wrap items-center gap-3">
              {/* segmented tabs */}
              <div className="inline-flex items-center overflow-hidden rounded-full border border-[#E50914]/60 bg-black/20 p-1">
                {tabs.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(t)}
                    className={`min-w-[130px] rounded-full px-6 py-2 text-sm font-medium transition ${
                      activeTab === t
                        ? "bg-[#E50914] text-white"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* filter by country */}
              {/* <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/30"
              >
                {watchRegion} · {languageLabelFor(watchRegion, language)}{" "}
                <ChevronDown className="size-4 text-white/70" />
              </button> */}
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-12 px-4 sm:px-6 lg:px-0">
          {calendarQuery.isLoading ? (
            <p className="text-sm text-white/70">Loading calendar…</p>
          ) : null}
          {calendarQuery.isError ? (
            <p className="text-sm text-red-300">Could not load release calendar right now.</p>
          ) : null}
          {sections.map(({ dayLabel, movies }) => (
            <section key={dayLabel}>
              <h2 className="font-(family-name:--font-anton) mb-6 text-xl sm:text-2xl uppercase tracking-tight text-white/95">
                {dayLabel}
              </h2>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {movies.map((m, idx) => (
                  <Link
                    key={`${dayLabel}-${m.id}-${idx}`}
                    href={m.kind === "tv" ? `/tv-shows/${m.id}` : `/movies/${m.id}`}
                    className="group text-inherit no-underline"
                  >
                    <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      {m.image ? (
                        <Image
                          src={m.image}
                          alt={m.title}
                          fill
                          className="object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex size-full items-center justify-center text-sm text-white/45">
                          No poster
                        </div>
                      )}
                    </div>

                    <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/60">{m.date}</p>
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
