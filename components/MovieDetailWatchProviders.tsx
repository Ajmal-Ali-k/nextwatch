"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useRegionLanguage } from "@/components/RegionLanguageProvider";

type ProviderRow = {
  providerId: number;
  name: string;
  logoUrl: string | null;
  label: "Stream" | "Rent" | "Buy";
  watchUrl: string | null;
};

type Json = { providers: ProviderRow[]; error?: string };

const chipClassName =
  "inline-flex max-w-[200px] items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm transition hover:border-white/35 hover:bg-white/10";

const SECTION_ORDER: ProviderRow["label"][] = ["Stream", "Rent", "Buy"];

const SECTION_HEADING: Record<ProviderRow["label"], string> = {
  Stream: "Stream",
  Rent: "Rent",
  Buy: "Buy",
};

function ProviderChip({ platform }: { platform: ProviderRow }) {
  const inner = (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-black/35">
        {platform.logoUrl ? (
          <Image
            src={platform.logoUrl}
            alt=""
            width={36}
            height={36}
            className="size-9 object-contain"
          />
        ) : (
          <span className="text-[10px] font-bold text-white/40">
            {platform.name.slice(0, 2)}
          </span>
        )}
      </span>
      <span className="min-w-0 truncate text-sm font-medium leading-tight text-white/95">
        {platform.name}
      </span>
    </>
  );

  if (platform.watchUrl) {
    return (
      <a
        href={platform.watchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`${chipClassName} cursor-pointer text-inherit no-underline outline-offset-2 focus-visible:ring-2 focus-visible:ring-white/40`}
        aria-label={`Watch on ${platform.name} (opens in a new tab)`}
      >
        {inner}
      </a>
    );
  }

  return <div className={chipClassName}>{inner}</div>;
}

type MovieDetailWatchProvidersProps =
  | { movieId: number; mediaTitle: string; tvId?: never; isInTheaters?: boolean }
  | { tvId: number; mediaTitle: string; movieId?: never; isInTheaters?: never };

export function MovieDetailWatchProviders(props: MovieDetailWatchProvidersProps) {
  const { watchRegion } = useRegionLanguage();
  const isTv = "tvId" in props;
  const mediaId = isTv ? props.tvId : props.movieId;
  const mediaTitle = props.mediaTitle;
  const isInTheaters = "isInTheaters" in props && props.isInTheaters;

  const q = useQuery({
    queryKey: [
      isTv ? "tv-watch-providers-detail" : "movie-watch-providers",
      mediaId,
      watchRegion,
      mediaTitle,
    ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({
        watchRegion,
        title: mediaTitle,
      });
      const path = isTv
        ? `/api/tv/${mediaId}/watch-providers`
        : `/api/movies/${mediaId}/watch-providers`;
      const res = await fetch(`${path}?${params.toString()}`, { signal });
      const data = (await res.json()) as Json;
      if (!res.ok) throw new Error(data.error ?? "Failed to load providers");
      return data.providers ?? [];
    },
    staleTime: 86_400_000,
  });

  const grouped = useMemo(() => {
    const map: Record<ProviderRow["label"], ProviderRow[]> = {
      Stream: [],
      Rent: [],
      Buy: [],
    };
    for (const p of q.data ?? []) {
      map[p.label].push(p);
    }
    return map;
  }, [q.data]);

  if (q.isPending) {
    return (
      <p className="text-sm text-white/50" role="status">
        Loading where to watch…
      </p>
    );
  }
  if (q.isError) {
    return (
      <p className="text-sm text-white/50" role="alert">
        {q.error instanceof Error ? q.error.message : "Providers unavailable."}
      </p>
    );
  }
  if (!q.data?.length) {
    if (isInTheaters) {
      return (
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
            Where to watch
          </p>
          <div className="inline-flex items-center gap-2.5 rounded-xl border border-[#F5C518]/30 bg-[#F5C518]/10 px-4 py-2.5 backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              className="size-5 shrink-0 text-[#F5C518]"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-2.625 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-1.5A1.125 1.125 0 0 1 18 18.375M20.625 4.5H3.375m17.25 0c.621 0 1.125.504 1.125 1.125M20.625 4.5h-1.5C18.504 4.5 18 5.004 18 5.625m3.75 0v1.5c0 .621-.504 1.125-1.125 1.125M3.375 4.5c-.621 0-1.125.504-1.125 1.125M3.375 4.5h1.5C5.496 4.5 6 5.004 6 5.625m-2.625 0v1.5c0 .621.504 1.125 1.125 1.125m0 0h13.5c.621 0 1.125-.504 1.125-1.125m-14.625 0h14.625m0 0c.621 0 1.125.504 1.125 1.125v5.25c0 .621-.504 1.125-1.125 1.125m0 0h-14.625m0 0c-.621 0-1.125-.504-1.125-1.125v-5.25c0-.621.504-1.125 1.125-1.125"
              />
            </svg>
            <span className="text-sm font-medium text-white/95">Now in Theaters</span>
          </div>
        </div>
      );
    }
    return (
      <p className="text-sm text-white/40">
        No streaming options available in your region.
      </p>
    );
  }

  const activeSections = SECTION_ORDER.filter((k) => grouped[k].length > 0);
  const singleSection = activeSections.length === 1;

  return (
    <div className="space-y-4">
      {singleSection ? (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-white/45">
          Where to watch
        </p>
      ) : null}
      {SECTION_ORDER.map((key) => {
        const list = grouped[key];
        if (!list.length) return null;
        return (
          <div key={key}>
            {!singleSection ? (
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
                {SECTION_HEADING[key]}
              </p>
            ) : null}
            <div className={`flex flex-wrap gap-2 ${singleSection ? "mt-2" : ""}`}>
              {list.map((platform) => (
                <ProviderChip
                  key={`${platform.providerId}-${platform.label}`}
                  platform={platform}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
