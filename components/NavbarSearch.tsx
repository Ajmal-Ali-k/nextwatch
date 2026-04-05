"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Film, Search as SearchIcon, Tv } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import type { SearchMovieItem, SearchTvItem } from "@/app/api/search/route";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { cn } from "@/lib/utils";

const DEBOUNCE_MS = 350;
const STALE_TIME_MS = 3 * 60_000;
const SUGGEST_PER_TYPE = 3;

type CombinedSearchJson = {
  query: string;
  movies: { results: SearchMovieItem[] };
  tv: { results: SearchTvItem[] };
  error?: string;
};

function highlightMatch(text: string, query: string): ReactNode {
  const q = query.trim();
  if (!q) return text;
  const lower = text.toLowerCase();
  const idx = lower.indexOf(q.toLowerCase());
  if (idx === -1) {
    return <strong className="font-semibold text-white">{text}</strong>;
  }
  return (
    <>
      <span className="text-white/90">{text.slice(0, idx)}</span>
      <strong className="font-semibold text-white">{text.slice(idx, idx + q.length)}</strong>
      <span className="text-white/90">{text.slice(idx + q.length)}</span>
    </>
  );
}

function SearchPanel({
  className,
  listId,
  children,
}: {
  className?: string;
  listId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 top-full z-80 mt-1 overflow-hidden rounded-lg border border-white/20 bg-neutral-950/98 shadow-xl shadow-black/40 ring-1 ring-black/30 backdrop-blur-md",
        className
      )}
      id={listId}
      role="region"
      aria-label="Search suggestions"
    >
      {children}
    </div>
  );
}

function SuggestionRows({
  isFetching,
  isError,
  errorMessage,
  movies,
  tv,
  query,
  onPick,
  seeAllHref,
}: {
  isFetching: boolean;
  isError: boolean;
  errorMessage: string | null;
  movies: SearchMovieItem[];
  tv: SearchTvItem[];
  query: string;
  onPick?: () => void;
  seeAllHref: string;
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

  const hasRows = movies.length > 0 || tv.length > 0;

  return (
    <div className="max-h-[min(55vh,20rem)] overflow-y-auto">
      {!hasRows ? (
        <p className="px-3 py-3 text-center text-sm text-white/55">No quick matches.</p>
      ) : (
        <ul className="py-0">
          {movies.map((m) => (
            <li key={`m-${m.id}`} className="border-b border-white/10 last:border-b-0">
              <Link
                href={`/movies/${m.id}`}
                className="flex items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-white/10"
                onClick={onPick}
              >
                <Film className="size-5 shrink-0 text-white/70" aria-hidden />
                <span>
                  {highlightMatch(m.title, query)}{" "}
                  <span className="font-normal text-white/55">in Movies</span>
                </span>
              </Link>
            </li>
          ))}
          {tv.map((t) => (
            <li key={`t-${t.id}`} className="border-b border-white/10 last:border-b-0">
              <Link
                href={`/tv-shows/${t.id}`}
                className="flex items-center gap-3 px-3 py-2.5 text-left text-sm transition hover:bg-white/10"
                onClick={onPick}
              >
                <Tv className="size-5 shrink-0 text-white/70" aria-hidden />
                <span>
                  {highlightMatch(t.title, query)}{" "}
                  <span className="font-normal text-white/55">in TV Shows</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-white/10 px-3 py-2">
        <Link
          href={seeAllHref}
          className="block text-center text-sm font-medium text-[#F5C518] transition hover:text-[#ffd54f]"
          onClick={onPick}
        >
          See all results
        </Link>
      </div>
    </div>
  );
}

export default function NavbarSearch() {
  const router = useRouter();
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
  const seeAllHref = `/search?q=${encodeURIComponent(debouncedQuery.trim())}`;

  const query = useQuery({
    queryKey: ["navbar-combined-search", debouncedQuery.trim()],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        query: debouncedQuery.trim(),
        page: "1",
      });
      const res = await fetch(`/api/search?${params.toString()}`, { signal });
      const data = (await res.json()) as CombinedSearchJson;
      if (res.status === 429) {
        throw new Error(
          data.error ?? "Too many searches. Please wait a moment and try again."
        );
      }
      if (!res.ok) {
        throw new Error(data.error ?? "Search failed. Try again.");
      }
      return data;
    },
    enabled,
    staleTime: STALE_TIME_MS,
  });

  const movieSuggestions = (query.data?.movies.results ?? []).slice(0, SUGGEST_PER_TYPE);
  const tvSuggestions = (query.data?.tv.results ?? []).slice(0, SUGGEST_PER_TYPE);

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

  const closeAndGoSearch = useCallback(() => {
    setPanelOpen(false);
    setMobileOpen(false);
  }, []);

  const submitSearch = useCallback(() => {
    const t = searchText.trim();
    if (t.length < 2) return;
    router.push(`/search?q=${encodeURIComponent(t)}`);
    closeAndGoSearch();
  }, [router, searchText, closeAndGoSearch]);

  const onInputEscape = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setPanelOpen(false);
      setSearchText("");
    }
  }, []);

  const errorMessage =
    query.error instanceof Error ? query.error.message : query.isError ? "Search failed." : null;

  const inputClassDesktop = cn(
    "h-9 w-full rounded-full border-white/30 bg-red-500/50 pl-10 pr-3 text-white placeholder:text-white/70",
    "focus-visible:border-white/50 focus-visible:ring-white/50"
  );

  const inputClassMobile = cn(
    "h-11 w-full rounded-full border-white/25 bg-white/10 pl-10 pr-3 text-white placeholder:text-white/60",
    "focus-visible:ring-white/40"
  );

  return (
    <>
      <div
        ref={rootRef}
        className="relative hidden max-w-md flex-1 sm:block"
        role="search"
      >
        <form
          className="relative"
          onSubmit={(e) => {
            e.preventDefault();
            submitSearch();
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Search movies and TV
          </label>
          <SearchIcon
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/85"
            aria-hidden
          />
          <Input
            id={inputId}
            type="search"
            autoComplete="off"
            placeholder="Search by name, genre, etc"
            value={searchText}
            onChange={(e) => {
              setSearchText(e.target.value);
              setPanelOpen(true);
            }}
            onFocus={() => setPanelOpen(true)}
            onKeyDown={(e) => {
              onInputEscape(e);
            }}
            role="combobox"
            aria-expanded={showPanelDesktop}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-haspopup="dialog"
            className={inputClassDesktop}
          />
        </form>
        {showPanelDesktop ? (
          <SearchPanel listId={listId}>
            <SuggestionRows
              isFetching={query.isFetching}
              isError={query.isError}
              errorMessage={errorMessage}
              movies={movieSuggestions}
              tv={tvSuggestions}
              query={debouncedQuery.trim()}
              seeAllHref={seeAllHref}
            />
            {/* <p className="border-t border-white/10 px-3 py-2 text-[10px] leading-snug text-white/45">
              This product uses the TMDB API but is not endorsed or certified by TMDB.
            </p> */}
          </SearchPanel>
        ) : null}
      </div>

      <button
        type="button"
        className="shrink-0 text-white/95 transition-colors hover:text-white sm:hidden"
        aria-label="Open search"
        onClick={() => setMobileOpen(true)}
      >
        <SearchIcon className="size-5" />
      </button>

      {mobileOpen ? (
        <div
          className="fixed inset-0 z-100 flex flex-col bg-neutral-950/98 p-4 pt-[max(1rem,env(safe-area-inset-top,0px))] sm:hidden"
          ref={mobileRootRef}
          role="dialog"
          aria-modal="true"
          aria-label="Search movies and TV"
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
          <form
            className="relative mt-3"
            onSubmit={(e) => {
              e.preventDefault();
              submitSearch();
            }}
          >
            <label htmlFor={mobileInputId} className="sr-only">
              Search movies and TV
            </label>
            <SearchIcon
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-white/85"
              aria-hidden
            />
            <Input
              ref={mobileInputRef}
              id={mobileInputId}
              type="search"
              autoComplete="off"
              placeholder="Search by name, genre, etc"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              role="combobox"
              aria-expanded={showPanelMobile}
              aria-controls={mobileListId}
              aria-autocomplete="list"
              aria-haspopup="dialog"
              className={inputClassMobile}
            />
          </form>
          {enabled ? (
            <div
              className="mt-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-white/15 bg-black/30"
              id={mobileListId}
              role="region"
              aria-label="Search suggestions"
            >
              <SuggestionRows
                isFetching={query.isFetching}
                isError={query.isError}
                errorMessage={errorMessage}
                movies={movieSuggestions}
                tv={tvSuggestions}
                query={debouncedQuery.trim()}
                onPick={() => setMobileOpen(false)}
                seeAllHref={seeAllHref}
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
