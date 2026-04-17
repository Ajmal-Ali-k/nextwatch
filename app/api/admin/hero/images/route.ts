import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin/auth";
import { TMDB_API_V3_BASE, TMDB_IMAGE_BASE } from "@/lib/tmdb/constants";

type TmdbImage = {
  file_path?: string;
  width?: number;
  height?: number;
  vote_average?: number;
  iso_639_1?: string | null;
};

export async function GET(request: Request) {
  const authError = requireAdmin(request);
  if (authError) return authError;

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "TMDB API key not configured" },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(request.url);
  const tmdbId = searchParams.get("id");
  const mediaType = searchParams.get("type") ?? "movie";

  if (!tmdbId || !/^\d+$/.test(tmdbId)) {
    return NextResponse.json({ error: "Valid id is required" }, { status: 400 });
  }

  const url = new URL(
    `${TMDB_API_V3_BASE}/${mediaType}/${tmdbId}/images`
  );
  url.searchParams.set("api_key", apiKey);
  // Include all languages so we get non-English backdrops too
  url.searchParams.set("include_image_language", "en,null");

  const res = await fetch(url.toString());
  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { backdrops?: TmdbImage[] };
  const backdrops = (data.backdrops ?? [])
    .filter(
      (img): img is TmdbImage & { file_path: string } =>
        typeof img.file_path === "string" && img.file_path.length > 0
    )
    .map((img) => ({
      filePath: img.file_path,
      url: `${TMDB_IMAGE_BASE}/original${img.file_path}`,
      thumbUrl: `${TMDB_IMAGE_BASE}/w780${img.file_path}`,
      width: img.width ?? 0,
      height: img.height ?? 0,
      voteAverage: img.vote_average ?? 0,
    }));

  return NextResponse.json({ backdrops });
}
