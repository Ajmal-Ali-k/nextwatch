import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/JsonLd";
import MediaDetailView from "@/components/MediaDetailView";
import {
  SITE_NAME,
  canonicalUrl,
  truncateSeoDescription,
} from "@/lib/seo";
import { buildTvSeriesJsonLd } from "@/lib/seo/structuredData";
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
    return { title: "TV show" };
  }
  const data = await loadTvDetail(tvId);
  if (!data) {
    return { title: "TV show not found" };
  }
  const desc = truncateSeoDescription(
    data.overview,
    `Watch ${data.title} details, trailers, cast, seasons, and streaming availability on ${SITE_NAME}.`
  );
  const url = canonicalUrl(`/tv-shows/${tvId}`);
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
      type: "video.tv_show",
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

export default async function TvShowDetailPage({ params }: Props) {
  const { id } = await params;
  const tvId = parseTvId(id);
  if (tvId === null) notFound();

  const data = await loadTvDetail(tvId);
  if (!data) notFound();

  return (
    <>
      <JsonLd data={buildTvSeriesJsonLd(data)} />
      <MediaDetailView model={tvToMediaPresentation(data)} />
    </>
  );
}
