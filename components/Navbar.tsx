"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BookmarkIcon, ChevronDown, GlobeIcon, Menu, X } from "lucide-react";

import { LocaleMenuPopover } from "@/components/LocaleMenu";
import NavbarSearch from "@/components/NavbarSearch";
import { languageLabelFor, useRegionLanguage } from "@/components/RegionLanguageProvider";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/in-theaters", label: "In Theaters" },
  { href: "/movies", label: "Movies" },
  { href: "/tv-shows", label: "TV Shows" },
  { href: "/calendar", label: "Calendar" },
];

export default function Navbar() {
  const { watchRegion, language } = useRegionLanguage();
  const [localeOpen, setLocaleOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileMenuOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [mobileMenuOpen]);

  const localeSummary = `${watchRegion} · ${languageLabelFor(watchRegion, language)}`;

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-[#D6212A]/50 bg-[#D6212A]">
        <nav className="mx-auto flex h-12 max-w-[1600px] items-center justify-between gap-2 px-3 sm:h-14 sm:gap-6 sm:px-4 md:px-6">
          {/* Hamburger — mobile only */}
          <button
            type="button"
            className="shrink-0 rounded-md p-1.5 text-white/90 transition hover:bg-white/15 md:hidden"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileMenuOpen((o) => !o)}
          >
            {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>

          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 font-bold tracking-tight text-white text-base font-heading antialiased sm:text-xl"
          >
            NextWatchList
          </Link>

          {/* Nav links — desktop */}
          <div className="hidden items-center gap-6 md:flex font-sans">
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

          <NavbarSearch />

          <div className="flex shrink-0 items-center gap-2 sm:gap-4 font-sans">
            <div className="relative font-sans" ref={localeRef}>
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
                <span className="hidden min-w-0 flex-1 truncate sm:inline font-sans">{localeSummary}</span>
                <ChevronDown
                  className={cn(
                    "hidden size-4 shrink-0 text-white/80 transition-transform sm:block",
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

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav className="absolute left-0 top-12 flex w-64 flex-col gap-1 border-r border-white/10 bg-neutral-950/98 p-4 pt-5 shadow-2xl">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/90 transition hover:bg-white/10 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </>
  );
}
