"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { DetailCreditPerson } from "@/lib/tmdb/detailCredits";
import { DetailSectionHeading } from "./DetailSectionHeading";

const SCROLL_HIDE =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:size-0";

function initialsFromName(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const a = parts[0]?.[0];
    const b = parts[parts.length - 1]?.[0];
    if (a && b) return `${a}${b}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase() || "?";
}

function CreditAvatar({ person }: { person: DetailCreditPerson }) {
  return (
    <div className="relative mx-auto size-11 shrink-0 overflow-hidden rounded-full border border-white/15 bg-neutral-800/90 shadow-inner shadow-black/40">
      {person.profileUrl ? (
        <Image
          src={person.profileUrl}
          alt={person.name}
          width={44}
          height={44}
          className="size-full object-cover"
          sizes="44px"
        />
      ) : (
        <span className="flex size-full items-center justify-center text-[10px] font-bold tracking-tight text-white/55">
          {initialsFromName(person.name)}
        </span>
      )}
    </div>
  );
}

function CreditCard({ person }: { person: DetailCreditPerson }) {
  return (
    <li className="flex w-21 shrink-0 flex-col items-center text-center">
      <CreditAvatar person={person} />
      <p className="mt-3 w-full text-[11px] font-semibold leading-snug text-white/90 line-clamp-2">
        {person.name}
      </p>
      <p className="mt-1 w-full text-[10px] leading-snug text-white/50 line-clamp-2">
        {person.role}
      </p>
    </li>
  );
}

function CastCrewDivider() {
  return (
    <li className="flex shrink-0 flex-col items-center gap-2 px-2 pt-0" aria-hidden>
      <div className="h-11 w-px shrink-0 rounded-full bg-white/25" />
      <span className="whitespace-nowrap text-[10px] font-semibold uppercase tracking-wider text-white/45">
        Crew
      </span>
    </li>
  );
}

export function DetailCreditsSection({
  cast,
  crew,
}: {
  cast: DetailCreditPerson[];
  crew: DetailCreditPerson[];
}) {
  const scrollRef = useRef<HTMLUListElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const max = scrollWidth - clientWidth;
    setCanLeft(scrollLeft > 2);
    setCanRight(max > 2 && scrollLeft < max - 2);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    const ro = new ResizeObserver(() => updateScrollState());
    ro.observe(el);
    return () => ro.disconnect();
  }, [cast, crew, updateScrollState]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = scrollRef.current;
    if (!el) return;
    const delta = Math.min(el.clientWidth * 0.85, 320) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  if (cast.length === 0 && crew.length === 0) return null;

  const title =
    cast.length > 0 && crew.length > 0
      ? "Cast & Crew"
      : cast.length > 0
        ? "Cast"
        : "Crew";

  const navBtnClass =
    "flex size-9 shrink-0 items-center justify-center rounded-full border border-white/45 bg-transparent text-white transition hover:border-white hover:bg-white/5 disabled:pointer-events-none disabled:opacity-0";

  return (
    <div className="mt-12 border-t border-white/10 pt-10">
      <div className="mb-5 flex min-w-0 items-center justify-between gap-4">
        {/* <h2 className="font-(family-name:--font-anton) text-base font-medium  text-white sm:text-lg">
          {title}
        </h2> */}
        <DetailSectionHeading className="mb-6">
          {title}
        </DetailSectionHeading>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className={navBtnClass}
            aria-label="Scroll credits left"
            disabled={!canLeft}
            onClick={() => scrollByDir(-1)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className={navBtnClass}
            aria-label="Scroll credits right"
            disabled={!canRight}
            onClick={() => scrollByDir(1)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>
      </div>

      <ul
        ref={scrollRef}
        onScroll={updateScrollState}
        className={`flex min-w-0 flex-nowrap gap-4 overflow-x-auto overflow-y-hidden py-1 ${SCROLL_HIDE}`}
        aria-label="Cast and crew"
      >
        {cast.map((person, i) => (
          <CreditCard key={`cast-${person.name}-${i}`} person={person} />
        ))}
        {cast.length > 0 && crew.length > 0 ? <CastCrewDivider /> : null}
        {crew.map((person, i) => (
          <CreditCard key={`crew-${person.name}-${i}`} person={person} />
        ))}
      </ul>
    </div>
  );
}
