import type { Metadata } from "next";
import { notFound } from "next/navigation";

import MediaDetailView from "@/components/MediaDetailView";
import { tvToMediaPresentation } from "@/lib/tmdb/mediaDetailPresentation";
import { loadTvDetail } from "@/lib/tmdb/tvDetail";

type Props = { params: Promise<{ id: string }> };

function parseTvId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const tvId = parseTvId(id);
  if (tvId === null) {
    return { title: "TV show | NextWatch" };
  }
  const data = await loadTvDetail(tvId);
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

export default async function TvShowDetailPage({ params }: Props) {
  const { id } = await params;
  const tvId = parseTvId(id);
  if (tvId === null) notFound();

  const data = await loadTvDetail(tvId);
  if (!data) notFound();

  return <MediaDetailView model={tvToMediaPresentation(data)} />;
}
