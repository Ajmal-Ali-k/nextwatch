export const TMDB_API_V3_BASE = "https://api.themoviedb.org/3";
export const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

/** Full-resolution backdrop; TMDB fixed sizes top out at w1280, so `original` avoids upscaled blur on large viewports. */
export function backdropHeroUrl(path: string | null): string | null {
  const p = typeof path === "string" ? path.trim() : "";
  if (!p) return null;
  return `${TMDB_IMAGE_BASE}/original${p}`;
}

export function posterUrl(posterPath: string | null): string | null {
  const path = typeof posterPath === "string" ? posterPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w500${path}`;
}

/** Small poster for search / list rows (reduces bandwidth vs w500). */
export function posterThumbnailUrl(posterPath: string | null): string | null {
  const path = typeof posterPath === "string" ? posterPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w45${path}`;
}

export function providerLogoUrl(logoPath: string | null): string | null {
  const path = typeof logoPath === "string" ? logoPath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}

/** Small headshot for cast / crew on detail pages (keeps layout light). */
export function profileThumbUrl(profilePath: string | null): string | null {
  const path = typeof profilePath === "string" ? profilePath.trim() : "";
  if (!path) return null;
  return `${TMDB_IMAGE_BASE}/w92${path}`;
}
