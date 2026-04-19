import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Aligned with `/api/movies/now-playing` display page cap (30 results per page). */
const TMDB_MAX_PAGE = 500;
const TMDB_PAGE_SIZE = 20;
const RESULTS_PER_VIEW = 30;
const MAX_PAGE = Math.ceil((TMDB_MAX_PAGE * TMDB_PAGE_SIZE) / RESULTS_PER_VIEW);

export function parseInTheatersPage(raw: string | null): number {
  if (raw == null || raw === "") return 1;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > MAX_PAGE) return 1;
  return n;
}

export function useInTheatersPageUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const page = useMemo(
    () => parseInTheatersPage(searchParams.get("page")),
    [searchParams]
  );

  const replacePage = useCallback(
    (next: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next <= 1) params.delete("page");
      else params.set("page", String(next));
      const q = params.toString();
      router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  return { page, replacePage };
}
