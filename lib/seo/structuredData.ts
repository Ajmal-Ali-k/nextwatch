const SITE_URL = "https://nextwatchlist.com";
const SITE_NAME = "NextWatchList";

type CreditPerson = {
  name: string;
  role?: string;
  image?: string | null;
  profileUrl?: string | null;
};

type JsonLdPerson = {
  "@type": "Person";
  name: string;
};

type MovieJsonLdInput = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  releaseDate: string;
  genres: string[];
  runtimeLabel?: string | null;
  cast: CreditPerson[];
  crew: CreditPerson[];
};

type TvSeriesJsonLdInput = {
  id: number;
  title: string;
  overview: string;
  posterUrl: string | null;
  firstAirDate: string;
  genres: string[];
  seasons: unknown[];
  cast: CreditPerson[];
};

type ItemListJsonLdInput = {
  name: string;
  url: string;
  items: {
    title: string;
    url: string;
    image?: string | null;
  }[];
};

function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${SITE_URL}${path}`;
}

function textOrFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  return trimmed || fallback;
}

function people(items: CreditPerson[]): JsonLdPerson[] | undefined {
  const mapped = items
    .map((item) => item.name.trim())
    .filter(Boolean)
    .map((name) => ({ "@type": "Person" as const, name }));
  return mapped.length > 0 ? mapped : undefined;
}

function directors(items: CreditPerson[]): JsonLdPerson[] | undefined {
  return people(items.filter((item) => item.role === "Director"));
}

export function safeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function buildMovieJsonLd(input: MovieJsonLdInput) {
  const description = textOrFallback(
    input.overview,
    `Watch ${input.title} details, cast, trailers, and availability on ${SITE_NAME}.`
  );
  const actor = people(input.cast);
  const director = directors(input.crew);

  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: input.title,
    description,
    url: absoluteUrl(`/movies/${input.id}`),
    image: input.posterUrl ?? undefined,
    datePublished: input.releaseDate || undefined,
    genre: input.genres.length > 0 ? input.genres : undefined,
    actor,
    director,
  };
}

export function buildTvSeriesJsonLd(input: TvSeriesJsonLdInput) {
  const description = textOrFallback(
    input.overview,
    `Watch ${input.title} details, cast, seasons, trailers, and availability on ${SITE_NAME}.`
  );
  const actor = people(input.cast);

  return {
    "@context": "https://schema.org",
    "@type": "TVSeries",
    name: input.title,
    description,
    url: absoluteUrl(`/tv-shows/${input.id}`),
    image: input.posterUrl ?? undefined,
    datePublished: input.firstAirDate || undefined,
    genre: input.genres.length > 0 ? input.genres : undefined,
    numberOfSeasons: input.seasons.length,
    actor,
  };
}

export function buildItemListJsonLd(input: ItemListJsonLdInput) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: input.name,
    url: absoluteUrl(input.url),
    itemListElement: input.items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Thing",
        name: item.title,
        url: absoluteUrl(item.url),
        image: item.image ?? undefined,
      },
    })),
  };
}
