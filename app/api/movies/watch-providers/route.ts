import { NextResponse } from "next/server";

import { TMDB_API_V3_BASE } from "@/lib/tmdb/constants";

const ALLOWED_REGIONS = new Set(["IN", "US", "GB"]);
const LANGUAGE_PATTERN = /^[a-z]{2}(-[A-Z]{2})?$/;

type TmdbWatchProviderItem = {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
  display_priorities?: Record<string, number>;
};

type TmdbWatchProvidersMovieResponse = {
  results?: TmdbWatchProviderItem[];
};

const FALLBACK_PRIORITY = 9999;

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key is not configured. Set TMDB_API_KEY in the environment." },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const watchRegion = (searchParams.get("watchRegion") ?? "IN").toUpperCase();
  const language = searchParams.get("language") ?? "en-US";

  if (!ALLOWED_REGIONS.has(watchRegion)) {
    return NextResponse.json({ error: "Invalid watchRegion" }, { status: 400 });
  }
  if (!LANGUAGE_PATTERN.test(language)) {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const url = new URL(`${TMDB_API_V3_BASE}/watch/providers/movie`);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("watch_region", watchRegion);
  url.searchParams.set("language", language);

  const res = await fetch(url.toString(), { next: { revalidate: 86_400 } });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "TMDB request failed", status: res.status, detail: text.slice(0, 200) },
      { status: 502 }
    );
  }

  const data = (await res.json()) as TmdbWatchProvidersMovieResponse;
  const raw = data.results ?? [];

  const providers = raw
    .map((item) => {
      const displayPriority =
        item.display_priorities?.[watchRegion] ?? FALLBACK_PRIORITY;
      return {
        providerId: item.provider_id,
        name: item.provider_name,
        logoPath: item.logo_path,
        displayPriority,
      };
    })
    .sort((a, b) => {
      if (a.displayPriority !== b.displayPriority) {
        return a.displayPriority - b.displayPriority;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    });

  return NextResponse.json({ providers });
}
