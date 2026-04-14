"use client";

import { cn } from "@/lib/utils";
import {
  LANGUAGES_BY_REGION,
  WATCH_REGIONS,
  useRegionLanguage,
} from "@/components/RegionLanguageProvider";

type LocaleMenuPopoverProps = {
  onClose: () => void;
};

const optionBase =
  "w-full rounded-lg border px-3 py-2.5 text-left text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/45";

export function LocaleMenuPopover({ onClose }: LocaleMenuPopoverProps) {
  const { watchRegion, language, setWatchRegion, setLanguage } = useRegionLanguage();
  const langOptions = LANGUAGES_BY_REGION[watchRegion];

  return (
    <div
      className="absolute right-0 top-full z-60 mt-2 w-[min(100vw-2rem,18.5rem)] overflow-hidden rounded-xl border border-white/25 bg-red-950/95 shadow-xl shadow-black/40 ring-1 ring-black/30 backdrop-blur-md"
      role="dialog"
      aria-label="Region and language"
    >
      <div className="border-b border-white/10 bg-red-900/40 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">
          Region & language
        </p>
        {/* <p className="text-xs text-white/80">TMDB watch region and display language</p> */}
      </div>

      <div className="max-h-[min(70vh,22rem)] overflow-y-auto p-3">
        <p className="text-xs font-medium text-white/65" id="locale-region-heading">
          Country / region
        </p>
        <div
          className="mt-2 flex flex-col gap-1.5"
          role="group"
          aria-labelledby="locale-region-heading"
        >
          {WATCH_REGIONS.map((r) => {
            const active = watchRegion === r.code;
            return (
              <button
                key={r.code}
                type="button"
                onClick={() => {
                  setWatchRegion(r.code);
                }}
                className={cn(
                  optionBase,
                  active
                    ? "border-[#E50914] bg-[#E50914]/20 text-white"
                    : "border-white/15 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                )}
              >
                <span className="font-medium">{r.label}</span>
                <span className="mt-0.5 block text-[11px] text-white/55">{r.code}</span>
              </button>
            );
          })}
        </div>

        <p
          className="mt-4 text-xs font-medium text-white/65"
          id="locale-language-heading"
        >
          Language
        </p>
        <div
          className="mt-2 flex flex-col gap-1.5"
          role="group"
          aria-labelledby="locale-language-heading"
        >
          {langOptions.map((l) => {
            const active = language === l.code;
            return (
              <button
                key={l.code}
                type="button"
                onClick={() => {
                  setLanguage(l.code);
                  onClose();
                }}
                className={cn(
                  optionBase,
                  active
                    ? "border-[#E50914] bg-[#E50914]/20 text-white"
                    : "border-white/15 bg-white/5 text-white/90 hover:border-white/30 hover:bg-white/10"
                )}
              >
                {l.label}
                <span className="mt-0.5 block font-mono text-[11px] text-white/50">
                  {l.code}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
