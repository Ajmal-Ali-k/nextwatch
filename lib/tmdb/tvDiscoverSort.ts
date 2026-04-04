/** TMDB discover TV `sort_by` values we allow from the client */
export const TV_DISCOVER_SORT_OPTIONS = [
  { value: "popularity.desc", label: "Popularity" },
  { value: "first_air_date.desc", label: "Newest" },
  { value: "vote_average.desc", label: "Rating" },
  { value: "name.asc", label: "Title A–Z" },
] as const;

export type TvDiscoverSortValue = (typeof TV_DISCOVER_SORT_OPTIONS)[number]["value"];

const ALLOWED_SORT = new Set<string>(TV_DISCOVER_SORT_OPTIONS.map((o) => o.value));

const DEFAULT_TV_DISCOVER_SORT: TvDiscoverSortValue = "popularity.desc";

export function parseTvDiscoverSort(param: string | null): TvDiscoverSortValue {
  const v = param ?? DEFAULT_TV_DISCOVER_SORT;
  return ALLOWED_SORT.has(v) ? (v as TvDiscoverSortValue) : DEFAULT_TV_DISCOVER_SORT;
}
