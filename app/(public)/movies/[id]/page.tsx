import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import MediaDetailView from "@/components/MediaDetailView";
import {
  SITE_NAME,
  canonicalUrl,
  truncateSeoDescription,
} from "@/lib/seo";
import { buildMovieJsonLd } from "@/lib/seo/structuredData";
import { loadMovieDetail } from "@/lib/tmdb/movieDetail";
import { movieToMediaPresentation } from "@/lib/tmdb/mediaDetailPresentation";

type Props = { params: Promise<{ id: string }> };

function parseMovieId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (movieId === null) {
    return { title: "Movie" };
  }
  const data = await loadMovieDetail(movieId);
  if (!data) {
    return { title: "Movie not found" };
  }
  const desc = truncateSeoDescription(
    data.overview,
    `Watch ${data.title} details, trailers, cast, and streaming availability on ${SITE_NAME}.`
  );
  const url = canonicalUrl(`/movies/${movieId}`);
  const images = data.posterUrl
    ? [{ url: data.posterUrl, alt: `${data.title} poster` }]
    : undefined;

  return {
    title: data.title,
    description: desc,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: `${data.title} | ${SITE_NAME}`,
      description: desc,
      url,
      siteName: SITE_NAME,
      type: "video.movie",
      images,
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.title} | ${SITE_NAME}`,
      description: desc,
      images: data.posterUrl ? [data.posterUrl] : undefined,
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (movieId === null) notFound();

  const data = await loadMovieDetail(movieId);
  if (!data) notFound();

  return (
    <>
      <JsonLd data={buildMovieJsonLd(data)} />
      <MediaDetailView model={movieToMediaPresentation(data)} />
    </>
  );
}
