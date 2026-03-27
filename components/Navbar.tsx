"use client";

import Link from "next/link";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/in-theaters", label: "In Theaters" },
  { href: "/new_movies", label: "Movies" },
  { href: "/tv_shows", label: "TV Shows" },
  { href: "/calendar", label: "Calendar" },
];

import { SearchIcon } from "lucide-react";
import { GlobeIcon } from "lucide-react";
import { BookmarkIcon } from "lucide-react";

export default function Navbar() {
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
          <button
            type="button"
            className="flex items-center gap-1.5 text-sm font-medium text-white/95 transition-colors hover:text-white"
            aria-label="Country & Language"
          >
            <span className="hidden sm:inline">Country & Language</span>
            <GlobeIcon className="size-4" />
          </button>
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
