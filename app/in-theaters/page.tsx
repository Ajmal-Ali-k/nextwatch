"use client";

import Image, { type StaticImageData } from "next/image";
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import netflixLogo from "@/assets/logos/netflix.png";
import primeLogo from "@/assets/logos/prime.png";
import jioHotstarLogo from "@/assets/logos/jiohotstar.png";
import huluLogo from "@/assets/logos/hulu.png";
import zeeLogo from "@/assets/logos/zee.png";
import youtubeLogo from "@/assets/logos/youtube.png";

import movie1917 from "@/assets/movies/1971.png";
import movieHer from "@/assets/movies/her.png";
import movieEternalSunshine from "@/assets/movies/eternal_sunshine.png";
import movieOnceUponATime from "@/assets/movies/onece_uponeatime_hollywood.png";
import movieTenet from "@/assets/movies/tenet.png";

type PlatformKey = "all" | "netflix" | "prime" | "jiohotstar" | "hulu" | "zee" | "youtube";

const platforms: { key: PlatformKey; name: string; logo: StaticImageData }[] = [
  { key: "netflix", name: "Netflix", logo: netflixLogo },
  { key: "prime", name: "Prime Video", logo: primeLogo },
  { key: "jiohotstar", name: "JioHotstar", logo: jioHotstarLogo },
  { key: "hulu", name: "Hulu", logo: huluLogo },
  { key: "zee", name: "Zee", logo: zeeLogo },
  { key: "youtube", name: "YouTube", logo: youtubeLogo },
];

const platformLogoByKey: Record<Exclude<PlatformKey, "all">, StaticImageData> = {
  netflix: netflixLogo,
  prime: primeLogo,
  jiohotstar: jioHotstarLogo,
  hulu: huluLogo,
  zee: zeeLogo,
  youtube: youtubeLogo,
};

const movies: {
  title: string;
  date: string;
  image: StaticImageData;
  platform: Exclude<PlatformKey, "all">;
}[] = [
  { title: "1917", date: "Jan 17, 2020", image: movie1917, platform: "netflix" },
  { title: "Green Book", date: "Jan 17, 2020", image: movieOnceUponATime, platform: "prime" },
  {
    title: "Eternal Sunshine of the Spotless Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
    platform: "jiohotstar",
  },
  { title: "Once Upon a Time in Hollywood", date: "Jan 17, 2020", image: movieOnceUponATime, platform: "hulu" },
  { title: "Tenet", date: "Jan 17, 2020", image: movieTenet, platform: "youtube" },
  { title: "Her", date: "Jan 17, 2020", image: movieHer, platform: "netflix" },
  { title: "1917", date: "Jan 17, 2020", image: movie1917, platform: "prime" },
  { title: "Green Book", date: "Jan 17, 2020", image: movieOnceUponATime, platform: "zee" },
  {
    title: "Eternal Sunshine of the Spotless Mind",
    date: "Jan 17, 2020",
    image: movieEternalSunshine,
    platform: "netflix",
  },
  { title: "Once Upon a Time in Hollywood", date: "Jan 17, 2020", image: movieOnceUponATime, platform: "prime" },
  { title: "Tenet", date: "Jan 17, 2020", image: movieTenet, platform: "jiohotstar" },
  { title: "Her", date: "Jan 17, 2020", image: movieHer, platform: "hulu" },
];

export default function TvShowsPage() {
  const [activePlatform, setActivePlatform] = useState<PlatformKey>("all");

  const visibleMovies = useMemo(() => {
    if (activePlatform === "all") return movies;
    return movies.filter((m) => m.platform === activePlatform);
  }, [activePlatform]);

  return (
    <main className="relative min-h-screen pb-16 pt-12 text-white">
      {/* page glow background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-neutral-900" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_25%,rgba(214,33,42,0.45)_0%,rgba(214,33,42,0.18)_28%,rgba(10,10,10,0.92)_62%,rgba(10,10,10,1)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,10,10,0.95)_0%,rgba(10,10,10,0.7)_30%,rgba(10,10,10,0.35)_55%,rgba(10,10,10,0.95)_100%)]" />
      </div>

      <div className="mx-auto container">
        <div className="mt-2 px-4 sm:px-6 lg:px-0">
          {/* Header */}
          <div className="max-w-3xl">
            <h1 className="font-(family-name:--font-anton) text-4xl sm:text-5xl uppercase tracking-tight">
              Now playing in Theaters
            </h1>

            {/* <p className="mt-4 text-xs font-semibold text-white/70">
              Filter by Platform
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {platforms.map((p) => {
                const active = activePlatform === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActivePlatform((cur) => (cur === p.key ? "all" : p.key))}
                    className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border transition ${
                      active
                        ? "border-[#E50914] bg-[#E50914]/15"
                        : "border-white/15 bg-white/5 hover:border-white/30"
                    }`}
                    aria-label={p.name}
                    title={p.name}
                  >
                    <Image
                      src={p.logo}
                      alt={p.name}
                      width={26}
                      height={26}
                      className="h-6 w-6 object-contain"
                    />
                  </button>
                );
              })}
            </div> */}

            <div className="mt-5 flex items-center gap-3">
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/30"
              >
                Sort By <ChevronDown className="size-4 text-white/70" />
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/25 px-4 py-2 text-sm text-white/80 backdrop-blur-sm transition hover:border-white/30"
              >
                Genre <ChevronDown className="size-4 text-white/70" />
              </button>
            </div>
          </div>
        </div>

        {/* Cards grid */}
        <section className="mt-10 px-4 sm:px-6 lg:px-0">
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visibleMovies.map((m, idx) => (
              <article key={`${m.title}-${idx}`} className="group">
                <div className="relative aspect-2/3 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <Image
                    src={m.image}
                    alt={m.title}
                    fill
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />

                  {/* platform logo badge */}
                  <div className="absolute bottom-2 right-2 flex size-8 items-center justify-center rounded-lg bg-black/55 backdrop-blur-sm">
                    <Image
                      src={platformLogoByKey[m.platform]}
                      alt={m.platform}
                      width={18}
                      height={18}
                      className="h-4.5 w-4.5 object-contain"
                    />
                  </div>
                </div>

                <h3 className="mt-3 font-(family-name:--font-anton) text-base leading-snug text-white line-clamp-2">
                  {m.title}
                </h3>
                <p className="mt-1 text-xs text-white/60">{m.date}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}