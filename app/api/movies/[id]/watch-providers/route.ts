import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, providerLogoUrl } from "@/lib/tmdb/constants";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB"]);

type TmdbProviderRow = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

type TmdbMovieWatchProvidersResponse = {
  results?: Record<
    string,
    {
      link?: string;
      flatrate?: TmdbProviderRow[];
      rent?: TmdbProviderRow[];
      buy?: TmdbProviderRow[];
    }
  >;
};

function parseMovieId(raw: string): number | null {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key is not configured. Set TMDB_API_KEY in the environment." },
      { status: 500 }
    );
  }

  const { id: idParam } = await context.params;
  const movieId = parseMovieId(idParam);
  if (movieId === null) {
    return NextResponse.json({ error: "Invalid movie id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const watchRegion = (searchParams.get("watchRegion") ?? "IN").toUpperCase();
  if (!ALLOWED_REGIONS.has(watchRegion)) {
    return NextResponse.json({ error: "Invalid watchRegion" }, { status: 400 });
  }

  const url = new URL(`${TMDB_API_V3_BASE}/movie/${movieId}/watch/providers`);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (!res.ok) {
    await res.text().catch(() => {});
    return NextResponse.json(
      { error: "TMDB request failed", providers: [] },
      { status: 502 }
    );
  }

  const data = (await res.json()) as TmdbMovieWatchProvidersResponse;
  const regionBlock = data.results?.[watchRegion];
  if (!regionBlock) {
    return NextResponse.json({ providers: [] });
  }

  type Monetization = "Stream" | "Rent" | "Buy";
  const rows: {
    providerId: number;
    name: string;
    logoUrl: string | null;
    label: Monetization;
  }[] = [];

  const push = (
    list: TmdbProviderRow[] | undefined,
    label: Monetization
  ) => {
    for (const p of list ?? []) {
      const name = String(p.provider_name ?? "").trim();
      if (!name) continue;
      rows.push({
        providerId: p.provider_id,
        name,
        logoUrl: providerLogoUrl(p.logo_path),
        label,
      });
    }
  };

  push(regionBlock.flatrate, "Stream");
  push(regionBlock.rent, "Rent");
  push(regionBlock.buy, "Buy");

  const seen = new Set<number>();
  const providers = rows.filter((r) => {
    if (seen.has(r.providerId)) return false;
    seen.add(r.providerId);
    return true;
  });

  return NextResponse.json({ providers });
}
