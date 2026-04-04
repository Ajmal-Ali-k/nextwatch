export const TMDB_API_V3_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function posterUrl(posterPath: string | null): string | null {
  const path = typeof posterPath === "string" ? posterPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w500${path}`;
}

export function providerLogoUrl(logoPath: string | null): string | null {
  const path = typeof logoPath === "string" ? logoPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}
