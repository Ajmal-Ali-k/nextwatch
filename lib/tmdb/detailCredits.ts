import { profileThumbUrl } from "@/lib/tmdb/constants";

export type DetailCreditPerson = {
  name: string;
  role: string;
  profileUrl: string | null;
};

type TmdbCastMember = {
  name?: string;
  character?: string;
  profile_path?: string | null;
};

type TmdbCrewMember = {
  name?: string;
  job?: string;
  profile_path?: string | null;
};

const WRITING_AND_CREATOR_JOBS = new Set([
  "Screenplay",
  "Writer",
  "Story",
  "Teleplay",
  "Creator",
]);

export function buildCastCreditList(
  cast: TmdbCastMember[] | undefined,
  limit: number
): DetailCreditPerson[] {
  const out: DetailCreditPerson[] = [];
  for (const c of cast ?? []) {
    if (out.length >= limit) break;
    const name = typeof c.name === "string" ? c.name.trim() : "";
    if (!name) continue;
    const character = typeof c.character === "string" ? c.character.trim() : "";
    out.push({
      name,
      role: character || "—",
      profileUrl: profileThumbUrl(c.profile_path ?? null),
    });
  }
  return out;
}

/**
 * Directors first (API order), then writers / creators. Names deduped per phase so the
 * list stays readable on the detail page.
 */
export function buildCrewCreditList(
  crew: TmdbCrewMember[] | undefined,
  limit: number
): DetailCreditPerson[] {
  const out: DetailCreditPerson[] = [];
  const seenDirector = new Set<string>();
  const seenWriter = new Set<string>();

  for (const c of crew ?? []) {
    if (out.length >= limit) break;
    if (c.job !== "Director") continue;
    const name = typeof c.name === "string" ? c.name.trim() : "";
    if (!name || seenDirector.has(name)) continue;
    seenDirector.add(name);
    out.push({
      name,
      role: "Director",
      profileUrl: profileThumbUrl(c.profile_path ?? null),
    });
  }

  for (const c of crew ?? []) {
    if (out.length >= limit) break;
    const job = typeof c.job === "string" ? c.job.trim() : "";
    if (!WRITING_AND_CREATOR_JOBS.has(job)) continue;
    const name = typeof c.name === "string" ? c.name.trim() : "";
    if (!name || seenWriter.has(name)) continue;
    seenWriter.add(name);
    out.push({
      name,
      role: job,
      profileUrl: profileThumbUrl(c.profile_path ?? null),
    });
  }

  return out;
}
