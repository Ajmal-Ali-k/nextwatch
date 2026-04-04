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
};

type Json = { providers: ProviderRow[]; error?: string };

const SECTION_ORDER: ProviderRow["label"][] = ["Stream", "Rent", "Buy"];

const SECTION_HEADING: Record<ProviderRow["label"], string> = {
  Stream: "Stream",
  Rent: "Rent",
  Buy: "Buy",
};

function ProviderChip({ platform }: { platform: ProviderRow }) {
  return (
    <div className="inline-flex max-w-[200px] items-center gap-2.5 rounded-xl border border-white/15 bg-white/5 px-3 py-2 backdrop-blur-sm">
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
    </div>
  );
}

type MovieDetailWatchProvidersProps =
  | { movieId: number; tvId?: never }
  | { tvId: number; movieId?: never };

export function MovieDetailWatchProviders(props: MovieDetailWatchProvidersProps) {
  const { watchRegion } = useRegionLanguage();
  const isTv = "tvId" in props;
  const mediaId = isTv ? props.tvId : props.movieId;

  const q = useQuery({
    queryKey: [
      isTv ? "tv-watch-providers-detail" : "movie-watch-providers",
      mediaId,
      watchRegion,
    ],
    queryFn: async ({ signal }) => {
      const params = new URLSearchParams({ watchRegion });
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
    return (
      <p className="text-sm text-white/50">
        No streaming links listed for your region in TMDB.
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
