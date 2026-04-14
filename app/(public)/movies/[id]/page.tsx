import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MediaDetailView from "@/components/MediaDetailView";
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
    return { title: "Movie | NextWatch" };
  }
  const data = await loadMovieDetail(movieId);
  if (!data) {
    return { title: "Not found | NextWatch" };
  }
  const desc =
    data.overview.length > 160 ? `${data.overview.slice(0, 157)}…` : data.overview;
  return {
    title: `${data.title} | NextWatch`,
    description: desc,
    openGraph: {
      title: data.title,
      description: desc,
      images: data.posterUrl ? [{ url: data.posterUrl }] : undefined,
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const movieId = parseMovieId(id);
  if (movieId === null) notFound();

  const data = await loadMovieDetail(movieId);
  if (!data) notFound();

  return <MediaDetailView model={movieToMediaPresentation(data)} />;
}
