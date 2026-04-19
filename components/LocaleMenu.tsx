"use client";

import { Check, MapPin, Languages } from "lucide-react";

import { cn } from "@/lib/utils";
import { MAX_LANGUAGES } from "@/lib/regionLanguagePrefs";
import {
  ALL_CONTENT_LANGUAGES,
  WATCH_REGIONS,
  useRegionLanguage,
} from "@/components/RegionLanguageProvider";

const optionBase =
  "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45";

const popoverShell =
  "absolute right-0 top-full z-60 mt-2 overflow-hidden rounded-xl border border-white/25 bg-red-950/95 shadow-xl shadow-black/40 ring-1 ring-black/30 backdrop-blur-md font-sans text-base tracking-normal";

/* ── Region Popover ─────────────────────────────────────────────── */

export function RegionPopover() {
  const { watchRegion, setWatchRegion } = useRegionLanguage();

  return (
    <div
      className={cn(popoverShell, "w-[min(100vw-2rem,16rem)]")}
      role="dialog"
      aria-label="Select region"
    >
      <div className="border-b border-white/10 bg-red-900/40 px-3 py-2">
        <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-white/60">
          <MapPin className="size-3" />
          Where you watch
        </p>
      </div>

      <div className="max-h-[min(60vh,22rem)] overflow-y-auto p-3">
        <p className="text-[10px] text-white/40">
          Controls streaming availability &amp; regional trends
        </p>
        <div
          className="mt-2 flex flex-col gap-1.5"
          role="radiogroup"
          aria-label="Watch region"
        >
          {WATCH_REGIONS.map((r) => {
            const active = watchRegion === r.code;
            return (
              <button
                key={r.code}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setWatchRegion(r.code)}
                className={cn(
                  optionBase,
                  "flex items-center gap-2.5",
                  active
                    ? "border-[#E50914] bg-[#E50914]/20 text-white"
                    : "border-white/15 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded-full border",
                    active
                      ? "border-[#E50914] bg-[#E50914]"
                      : "border-white/30 bg-transparent"
                  )}
                >
                  {active && (
                    <span className="size-1.5 rounded-full bg-white" />
                  )}
                </span>
                <span className="flex-1">
                  <span className="font-medium">{r.label}</span>
                  <span className="ml-1.5 text-[11px] text-white/50">
                    {r.code}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Language Popover ────────────────────────────────────────────── */

export function LanguagePopover() {
  const { languages, toggleLanguage } = useRegionLanguage();
  const langSet = new Set(languages);

  return (
    <div
      className={cn(popoverShell, "w-[min(100vw-2rem,18rem)]")}
      role="dialog"
      aria-label="Select languages"
    >
      <div className="border-b border-white/10 bg-red-900/40 px-3 py-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase text-white/60">
            <Languages className="size-3" />
            Content languages
          </p>
          <span className="text-[10px] tabular-nums text-white/40">
            {languages.length}/{MAX_LANGUAGES}
          </span>
        </div>
      </div>

      <div className="max-h-[min(60vh,26rem)] overflow-y-auto p-3">
        <p className="text-[10px] text-white/40">
          Movies &amp; shows in these languages
        </p>
        <div
          className="mt-2 flex flex-col gap-1.5"
          role="group"
          aria-label="Content languages"
        >
          {ALL_CONTENT_LANGUAGES.map((l) => {
            const active = langSet.has(l.code);
            const atMax = languages.length >= MAX_LANGUAGES && !active;
            return (
              <button
                key={l.code}
                type="button"
                role="checkbox"
                aria-checked={active}
                disabled={atMax}
                onClick={() => toggleLanguage(l.code)}
                className={cn(
                  optionBase,
                  "flex items-center gap-2",
                  active
                    ? "border-[#E50914] bg-[#E50914]/20 text-white"
                    : atMax
                      ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/40"
                      : "border-white/15 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                )}
              >
                <span
                  className={cn(
                    "flex size-4 shrink-0 items-center justify-center rounded border",
                    active
                      ? "border-[#E50914] bg-[#E50914]"
                      : "border-white/30 bg-transparent"
                  )}
                >
                  {active && (
                    <Check className="size-3 text-white" strokeWidth={3} />
                  )}
                </span>
                <span className="flex-1 font-medium">{l.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
