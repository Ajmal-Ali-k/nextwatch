import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE, providerLogoUrl } from "@/lib/tmdb/constants";
import { withWatchUrls, type WatchProviderMonetization } from "@/lib/tmdb/watchProviderOutboundLinks";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB", "CA", "NL", "AE"]);

type TmdbProviderRow = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
};

type TmdbTvWatchProvidersResponse = {
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

function parseTvId(raw: string): number | null {
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
  const tvId = parseTvId(idParam);
  if (tvId === null) {
    return NextResponse.json({ error: "Invalid TV id" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const watchRegion = (searchParams.get("watchRegion") ?? "IN").toUpperCase();
  const mediaTitle = searchParams.get("title")?.trim() ?? "";
  if (!ALLOWED_REGIONS.has(watchRegion)) {
    return NextResponse.json({ error: "Invalid watchRegion" }, { status: 400 });
  }

  const url = new URL(`${TMDB_API_V3_BASE}/tv/${tvId}/watch/providers`);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url.toString(), { next: { revalidate: 3600 } });

  if (!res.ok) {
    await res.text().catch(() => {});
    return NextResponse.json(
      { error: "TMDB request failed", providers: [] },
      { status: 502 }
    );
  }

  const data = (await res.json()) as TmdbTvWatchProvidersResponse;
  const regionBlock = data.results?.[watchRegion];
  if (!regionBlock) {
    return NextResponse.json({ providers: [] });
  }

  const tmdbWatchPageUrl =
    typeof regionBlock.link === "string" && regionBlock.link.trim()
      ? regionBlock.link.trim()
      : null;

  const rows: {
    providerId: number;
    name: string;
    logoUrl: string | null;
    label: WatchProviderMonetization;
  }[] = [];

  const push = (
    list: TmdbProviderRow[] | undefined,
    label: WatchProviderMonetization
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
  const deduped = rows.filter((r) => {
    if (seen.has(r.providerId)) return false;
    seen.add(r.providerId);
    return true;
  });

  const providers = withWatchUrls(deduped, watchRegion, mediaTitle, tmdbWatchPageUrl);

  return NextResponse.json({ providers });
}
