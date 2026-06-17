import type { Metadata } from "next";

export const SITE_URL = "https://nextwatchlist.com";
export const SITE_NAME = "NextWatchList";
export const DEFAULT_TITLE = `${SITE_NAME} | Discover What to Watch Next`;
export const DEFAULT_DESCRIPTION =
  "Find movies and TV shows in theaters and across streaming platforms, track upcoming releases, and build your watchlist with NextWatchList.";
export const DEFAULT_OG_IMAGE = "/opengraph-image";
export const DEFAULT_TWITTER_IMAGE = "/twitter-image";

export function canonicalUrl(path: string = "/"): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function truncateSeoDescription(
  value: string,
  fallback: string = DEFAULT_DESCRIPTION,
  maxLength: number = 160
): string {
  const source = value.trim() || fallback;
  if (source.length <= maxLength) return source;
  return `${source.slice(0, maxLength - 3).trimEnd()}...`;
}

export function createPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  const url = canonicalUrl(path);
  const fullTitle = `${title} | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: SITE_NAME,
      type: "website",
      images: [
        {
          url: canonicalUrl(DEFAULT_OG_IMAGE),
          width: 1200,
          height: 630,
          alt: SITE_NAME,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [canonicalUrl(DEFAULT_TWITTER_IMAGE)],
    },
  };
}

export function createNoIndexMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    ...createPageMetadata({ title, description, path }),
    robots: {
      index: false,
      follow: false,
      googleBot: {
        index: false,
        follow: false,
      },
    },
  };
}
