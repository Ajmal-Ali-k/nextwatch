/** TMDB discover `sort_by` values we allow from the client */
export const DISCOVER_SORT_OPTIONS = [
  { value: "primary_release_date.desc", label: "Newest" },
  { value: "popularity.desc", label: "Popularity" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "title.asc", label: "Title A–Z" },
] as const;

export type DiscoverSortValue = (typeof DISCOVER_SORT_OPTIONS)[number]["value"];

const ALLOWED_SORT = new Set<string>(DISCOVER_SORT_OPTIONS.map((o) => o.value));

export function parseDiscoverSort(param: string | null): DiscoverSortValue {
  const v = param ?? "primary_release_date.desc";
  return ALLOWED_SORT.has(v) ? (v as DiscoverSortValue) : "primary_release_date.desc";
}
