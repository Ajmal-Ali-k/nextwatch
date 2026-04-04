"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { Film, Search as SearchIcon } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;
const STALE_TIME_MS = 3 * 60_000;

type SearchJson = {
  results: {
    id: number;
    title: string;
    originalTitle: string | null;
    releaseDate: string;
    posterUrl: string | null;
  }[];
  error?: string;
};

function tmdbMovieUrl(id: number): string {
  return `https://www.themoviedb.org/movie/${id}`;
}

function releaseYear(iso: string): string {
  if (!iso) return "";
  const y = iso.slice(0, 4);
  return /^\d{4}$/.test(y) ? y : "";
}

function SearchPanel({
  className,
  listId,
  children,
}: {
  className?: string;
  listId: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-full z-[80] mt-1 overflow-hidden rounded-lg border border-white/20 bg-neutral-950/98 shadow-xl shadow-black/40 ring-1 ring-black/30 backdrop-blur-md",
        className
      )}
      id={listId}
      role="listbox"
      aria-label="Movie search results"
    >
      {children}
    </div>
  );
}

function SearchResultsBody({
  isFetching,
  isError,
  errorMessage,
  results,
  onPick,
}: {
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  results: SearchJson["results"];
  onPick?: () => void;
}) {
  if (isFetching) {
    return (
      <p className="px-3 py-4 text-center text-sm text-white/55" role="status">
        Searching…
      </p>
    );
  }
  if (isError && errorMessage) {
    return (
      <p className="px-3 py-4 text-center text-sm text-amber-200/90" role="alert">
        {errorMessage}
      </p>
    );
  }
  if (results.length === 0) {
    return (
      <p className="px-3 py-4 text-center text-sm text-white/55">
        No movies found. Try another title.
      </p>
    );
  }
  return (
    <ul className="max-h-[min(55vh,20rem)] overflow-y-auto py-1">
      {results.map((m) => {
        const year = releaseYear(m.releaseDate);
        return (
          <li key={m.id} role="presentation">
            <a
              href={tmdbMovieUrl(m.id)}
              target="_blank"
              rel="noopener noreferrer"
              role="option"
              aria-selected={false}
              className="flex items-center gap-3 px-3 py-2 text-left text-sm text-white/90 transition hover:bg-white/10"
              onClick={onPick}
            >
              <span className="flex size-11 shrink-0 overflow-hidden rounded-md bg-black/40">
                {m.posterUrl ? (
                  <Image
                    src={m.posterUrl}
                    alt=""
                    width={45}
                    height={68}
                    className="size-full object-cover"
                    sizes="45px"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-[10px] font-bold text-white/35">
                    —
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-white">{m.title}</span>
                {m.originalTitle ? (
                  <span className="block truncate text-xs text-white/55" lang="und">
                    {m.originalTitle}
                  </span>
                ) : null}
                {year ? (
                  <span className="text-xs text-white/50">{year}</span>
                ) : null}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export default function NavbarSearch() {
  const [searchText, setSearchText] = useState("");
  const debouncedQuery = useDebouncedValue(searchText, DEBOUNCE_MS);
  const [panelOpen, setPanelOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const mobileRootRef = useRef<HTMLDivElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const listId = useId();
  const inputId = useId();
  const mobileListId = useId();
  const mobileInputId = useId();

  const enabled = debouncedQuery.trim().length >= 2;

  const query = useQuery({
    queryKey: ["movie-search", debouncedQuery.trim()],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        query: debouncedQuery.trim(),
      });
      const res = await fetch(`/api/movies/search?${params.toString()}`, { signal });
      const data = (await res.json()) as SearchJson;
      if (res.status === 429) {
        throw new Error(
          data.error ?? "Too many searches. Please wait a moment and try again."
        );
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed. Try again.");
      }
      return data.results;
    },
    enabled,
    staleTime: STALE_TIME_MS,
  });

  const results = query.data ?? [];
  const showPanelDesktop =
    panelOpen && enabled && (query.isFetching || query.isFetched || query.isError);
  const showPanelMobile =
    mobileOpen && enabled && (query.isFetching || query.isFetched || query.isError);

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node;
      if (!rootRef.current?.contains(t) && !mobileRootRef.current?.contains(t)) {
        setPanelOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    queueMicrotask(() => mobileInputRef.current?.focus());
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const onInputEscape = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setPanelOpen(false);
      setSearchText("");
    }
  }, []);

  const errorMessage =
    query.error instanceof Error ? query.error.message : query.isError ? "Search failed." : null;

  return (
    <>
      {/* Desktop */}
      <div
        ref={rootRef}
        className="relative hidden max-w-md flex-1 sm:block"
        role="search"
      >
        <label htmlFor={inputId} className="sr-only">
          Search movies
        </label>
        <Film
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/85"
          aria-hidden
        />
        <Input
          id={inputId}
          type="search"
          autoComplete="off"
          placeholder="Search movies…"
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setPanelOpen(true);
          }}
          onFocus={() => setPanelOpen(true)}
          onKeyDown={onInputEscape}
          role="combobox"
          aria-expanded={showPanelDesktop}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-haspopup="listbox"
          className={cn(
            "h-9 border-white/30 bg-red-500/50 pl-10 text-white placeholder:text-white/70",
            "focus-visible:ring-white/50 focus-visible:border-white/50"
          )}
        />
        {showPanelDesktop ? (
          <SearchPanel listId={listId}>
            <SearchResultsBody
              isFetching={query.isFetching}
              isError={query.isError}
              errorMessage={errorMessage}
              results={results}
            />
            <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-snug text-white/45">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p>
          </SearchPanel>
        ) : null}
      </div>

      {/* Mobile trigger */}
      <button
        type="button"
        className="shrink-0 text-white/95 transition-colors hover:text-white sm:hidden"
        aria-label="Open movie search"
        onClick={() => setMobileOpen(true)}
      >
        <SearchIcon className="size-5" />
      </button>

      {/* Mobile full-screen search */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-950/98 p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:hidden"
          ref={mobileRootRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search movies"
        >
          <div className="flex items-center gap-2 border-b border-white/15 pb-3">
            <button
              type="button"
              className="rounded-lg px-2 py-1.5 text-sm font-medium text-white/90 hover:bg-white/10"
              onClick={() => setMobileOpen(false)}
            >
              Close
            </button>
          </div>
          <label htmlFor={mobileInputId} className="sr-only">
            Search movies
          </label>
          <div className="relative mt-3">
            <Film
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/85"
              aria-hidden
            />
            <Input
              ref={mobileInputRef}
              id={mobileInputId}
              type="search"
              autoComplete="off"
              placeholder="Search movies…"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              role="combobox"
              aria-expanded={showPanelMobile}
              aria-controls={mobileListId}
              aria-autocomplete="list"
              aria-haspopup="listbox"
              className={cn(
                "h-11 border-white/25 bg-white/10 pl-10 text-white placeholder:text-white/60",
                "focus-visible:ring-white/40"
              )}
            />
          </div>
          {enabled ? (
            <div
              className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/15 bg-black/30"
              id={mobileListId}
              role="listbox"
              aria-label="Movie search results"
            >
              <SearchResultsBody
                isFetching={query.isFetching}
                isError={query.isError}
                errorMessage={errorMessage}
                results={results}
                onPick={() => setMobileOpen(false)}
              />
              <p className="mt-auto border-t border-white/10 px-3 py-2 text-[10px] leading-snug text-white/45">
                This product uses the TMDB API but is not endorsed or certified by TMDB.
              </p>
            </div>
          ) : (
            <p className="mt-6 text-center text-sm text-white/50">
              Type at least 2 characters to search.
            </p>
          )}
        </div>
      ) : null}
    </>
  );
}
