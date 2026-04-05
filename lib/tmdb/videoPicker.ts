export type TmdbVideo = {
  key?: string;
  type?: string;
  site?: string;
  official?: boolean;
  /** Audio / title language for the clip (TMDB ISO 639-1). */
  iso_639_1?: string | null;
};

const VIDEO_TYPE_ORDER: Record<string, number> = {
  Trailer: 0,
  Teaser: 1,
  Clip: 2,
  Featurette: 3,
  "Behind the Scenes": 4,
};

export function pickYoutubeTrailer(videos: TmdbVideo[] | undefined): string | null {
  if (!videos?.length) return null;
  const youtube = videos.filter(
    (v) =>
      v.site === "YouTube" &&
      typeof v.key === "string" &&
      v.key.length > 0
  );
  if (!youtube.length) return null;
  const ranked = [...youtube].sort((a, b) => {
    const ta = VIDEO_TYPE_ORDER[a.type ?? ""] ?? 50;
    const tb = VIDEO_TYPE_ORDER[b.type ?? ""] ?? 50;
    if (ta !== tb) return ta - tb;
    if (a.official !== b.official) return a.official ? -1 : 1;
    return 0;
  });
  return ranked[0]?.key ?? null;
}

/** ISO 639-1 codes in preference order (e.g. user UI language, then English). */
export function pickYoutubeTrailerForLocale(
  videos: TmdbVideo[] | undefined,
  preferredIso6391: readonly string[]
): string | null {
  if (!videos?.length) return null;
  const youtube = videos.filter(
    (v) =>
      v.site === "YouTube" &&
      typeof v.key === "string" &&
      v.key.length > 0
  );
  if (!youtube.length) return null;

  const langRank = (iso: string | null | undefined): number => {
    const code = (iso ?? "").trim().toLowerCase();
    if (!code) return 500;
    const idx = preferredIso6391.findIndex((p) => p.toLowerCase() === code);
    return idx === -1 ? 300 : idx;
  };

  const ranked = [...youtube].sort((a, b) => {
    const ta = VIDEO_TYPE_ORDER[a.type ?? ""] ?? 50;
    const tb = VIDEO_TYPE_ORDER[b.type ?? ""] ?? 50;
    if (ta !== tb) return ta - tb;
    if (a.official !== b.official) return a.official ? -1 : 1;
    const ra = langRank(a.iso_639_1);
    const rb = langRank(b.iso_639_1);
    if (ra !== rb) return ra - rb;
    return 0;
  });
  return ranked[0]?.key ?? null;
}

