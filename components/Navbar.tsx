"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookmarkIcon, ChevronDown, GlobeIcon, SearchIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { LocaleMenuPopover } from "@/components/LocaleMenu";
import { languageLabelFor, useRegionLanguage } from "@/components/RegionLanguageProvider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/in-theaters", label: "In Theaters" },
  { href: "/movies", label: "Movies" },
  { href: "/tv_shows", label: "TV Shows" },
  { href: "/calendar", label: "Calendar" },
];

export default function Navbar() {
  const { watchRegion, language } = useRegionLanguage();
  const [localeOpen, setLocaleOpen] = useState(false);
  const localeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const el = localeRef.current;
      if (!el?.contains(event.target as Node)) {
        setLocaleOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const localeSummary = `${watchRegion} · ${languageLabelFor(watchRegion, language)}`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#D6212A]/50 bg-[#D6212A]">
      <nav className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-3 sm:gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="shrink-0 font-bold tracking-tight text-white text-lg sm:text-xl"
        >
          NextWatchList
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-6 md:flex">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-white/95 transition-colors hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Search - shadcn Input with icon */}
        <div className="relative hidden sm:block flex-1 max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/80" />
          <Input
            type="search"
            placeholder="Search by name, genre, etc"
            className={cn(
              "h-9 border-white/30 bg-red-500/50 pl-9 text-white placeholder:text-white/70",
              "focus-visible:ring-white/50 focus-visible:border-white/50"
            )}
            aria-label="Search by name, genre, etc"
          />
        </div>

        <button
          type="button"
          className="sm:hidden text-white/95 transition-colors hover:text-white"
          aria-label="Search"
        >
          <SearchIcon className="size-5" />
        </button>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <div className="relative" ref={localeRef}>
            <button
              type="button"
              onClick={() => setLocaleOpen((o) => !o)}
              className={cn(
                "flex max-w-44 items-center gap-1.5 rounded-lg border border-white/25 bg-red-500/35 px-2 py-1.5 text-left text-sm font-medium text-white/95 shadow-sm backdrop-blur-sm transition hover:border-white/40 hover:bg-red-500/45 sm:max-w-56",
                localeOpen && "border-white/45 bg-red-500/50"
              )}
              aria-label="Country & Language"
              aria-expanded={localeOpen}
              aria-haspopup="dialog"
            >
              <GlobeIcon className="size-4 shrink-0" aria-hidden />
              <span className="hidden min-w-0 flex-1 truncate sm:inline">{localeSummary}</span>
              <ChevronDown
                className={cn(
                  "size-4 shrink-0 text-white/80 transition-transform",
                  localeOpen && "rotate-180"
                )}
                aria-hidden
              />
            </button>
            {localeOpen ? <LocaleMenuPopover onClose={() => setLocaleOpen(false)} /> : null}
          </div>
          <Link
            href="/watchlist"
            className="flex items-center gap-1.5 text-sm font-medium text-white/95 transition-colors hover:text-white"
          >
            <span className="hidden sm:inline">Watchlist</span>
            <BookmarkIcon className="size-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
