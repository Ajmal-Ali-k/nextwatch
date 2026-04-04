/** TMDB discover `sort_by` values we allow from the client */
export const DISCOVER_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "title.asc", label: "Title A–Z" },
] as const;

export type DiscoverSortValue = (typeof DISCOVER_SORT_OPTIONS)[number]["value"];

const ALLOWED_SORT = new Set<string>(DISCOVER_SORT_OPTIONS.map((o) => o.value));

const DEFAULT_DISCOVER_SORT: DiscoverSortValue = "popularity.desc";

export function parseDiscoverSort(param: string | null): DiscoverSortValue {
  const v = param ?? DEFAULT_DISCOVER_SORT;
  return ALLOWED_SORT.has(v) ? (v as DiscoverSortValue) : DEFAULT_DISCOVER_SORT;
}
