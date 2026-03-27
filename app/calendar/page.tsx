"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import movie1917 from "@/assets/movies/1971.png";
import movieHer from "@/assets/movies/her.png";
import movieEternalSunshine from "@/assets/movies/eternal_sunshine.png";
import movieOnceUponATime from "@/assets/movies/onece_uponeatime_hollywood.png";
import movieTenet from "@/assets/movies/tenet.png";

type TabKey = "In Theatres" | "Movies on OTT" | "TV Series on OTT";

type CalendarMovie = {
  title: string;
  date: string;
  image: StaticImageData;
};

const tabs: TabKey[] = ["In Theatres", "Movies on OTT", "TV Series on OTT"];

const calendarData: Record<
  string,
  Record<TabKey, CalendarMovie[]>
> = {
  "March 14, 2026": {
    "In Theatres": [
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      {
        title: "Eternal Sunshine of the Spotless Mind",
        date: "Jan 17, 2020",
        image: movieEternalSunshine,
      },
      {
        title: "Once Upon a Time in Hollywood",
        date: "Jan 17, 2020",
        image: movieOnceUponATime,
      },
    ],
    "Movies on OTT": [
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
      {
        title: "Once Upon a Time in Hollywood",
        date: "Jan 17, 2020",
        image: movieOnceUponATime,
      },
    ],
    "TV Series on OTT": [
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
      {
        title: "Eternal Sunshine of the Spotless Mind",
        date: "Jan 17, 2020",
        image: movieEternalSunshine,
      },
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
    ],
  },
  "March 20, 2026": {
    "In Theatres": [
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      {
        title: "Eternal Sunshine of the Spotless Mind",
        date: "Jan 17, 2020",
        image: movieEternalSunshine,
      },
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
    ],
    "Movies on OTT": [
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
      {
        title: "Once Upon a Time in Hollywood",
        date: "Jan 17, 2020",
        image: movieOnceUponATime,
      },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
    ],
    "TV Series on OTT": [
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
      {
        title: "Once Upon a Time in Hollywood",
        date: "Jan 17, 2020",
        image: movieOnceUponATime,
      },
    ],
  },
  "March 24, 2026": {
    "In Theatres": [
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
    ],
    "Movies on OTT": [
      { title: "Her", date: "Jan 17, 2020", image: movieHer },
      { title: "Tenet", date: "Jan 17, 2020", image: movieTenet },
    ],
    "TV Series on OTT": [
      {
        title: "Eternal Sunshine of the Spotless Mind",
        date: "Jan 17, 2020",
        image: movieEternalSunshine,
      },
      { title: "1917", date: "Jan 17, 2020", image: movie1917 },
    ],
  },
};

export default function ReleaseCalendarPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("In Theatres");

  const sections = useMemo(() => {
    return Object.entries(calendarData).map(([dayLabel, byTab]) => ({
      dayLabel,
      movies: byTab[activeTab],
    }));
  }, [activeTab]);

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
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/30"
              >
                Filter by Country{" "}
                <ChevronDown className="size-4 text-white/70" />
              </button>
            </div>
          </div>
        </div>

        {/* Sections */}
        <div className="mt-10 space-y-12 px-4 sm:px-6 lg:px-0">
          {sections.map(({ dayLabel, movies }) => (
            <section key={dayLabel}>
              <h2 className="font-(family-name:--font-anton) mb-6 text-xl sm:text-2xl uppercase tracking-tight text-white/95">
                {dayLabel}
              </h2>

              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {movies.map((m, idx) => (
                  <article key={`${dayLabel}-${m.title}-${idx}`} className="group">
                    <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                      <Image
                        src={m.image}
                        alt={m.title}
                        fill
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>

                    <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                      {m.title}
                    </h3>
                    <p className="mt-1 text-xs text-white/60">{m.date}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
