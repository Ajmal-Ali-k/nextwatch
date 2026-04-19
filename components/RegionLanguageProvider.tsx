"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import {
  COOKIE_CONTENT_LANGUAGES,
  COOKIE_WATCH_REGION,
} from "@/lib/regionLanguageCookieNames";
import {
  isValidContentLanguage,
  MAX_LANGUAGES,
  migrateOldLanguageCode,
  type ContentLanguageCode,
  type WatchRegionCode,
  WATCH_REGIONS,
} from "@/lib/regionLanguagePrefs";

export {
  ALL_CONTENT_LANGUAGES,
  languageLabel,
  type ContentLanguageCode,
  type WatchRegionCode,
  WATCH_REGIONS,
} from "@/lib/regionLanguagePrefs";

const STORAGE_KEY = "nextwatch.watchRegionLanguage";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function persistToCookies(
  watchRegion: WatchRegionCode,
  languages: ContentLanguageCode[]
) {
  if (typeof document === "undefined") return;
  const base = `path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`;
  document.cookie = `${COOKIE_WATCH_REGION}=${watchRegion};${base}`;
  document.cookie = `${COOKIE_CONTENT_LANGUAGES}=${languages.join(",")};${base}`;
}

type Stored = {
  watchRegion: WatchRegionCode;
  languages: ContentLanguageCode[];
};

const DEFAULTS: Stored = {
  watchRegion: "IN",
  languages: ["hi", "en"],
};

type RegionLanguageContextValue = {
  watchRegion: WatchRegionCode;
  languages: ContentLanguageCode[];
  setWatchRegion: (code: WatchRegionCode) => void;
  setLanguages: (codes: ContentLanguageCode[]) => void;
  toggleLanguage: (code: ContentLanguageCode) => void;
};

const RegionLanguageContext =
  createContext<RegionLanguageContextValue | null>(null);

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Record<string, unknown>;

    const watchRegion = WATCH_REGIONS.some((r) => r.code === p.watchRegion)
      ? (p.watchRegion as WatchRegionCode)
      : null;
    if (!watchRegion) return null;

    // New format: languages array
    if (Array.isArray(p.languages)) {
      const langs = (p.languages as string[]).filter(isValidContentLanguage);
      if (langs.length > 0) return { watchRegion, languages: langs };
    }

    // Old format migration: single "language" field like "ml-IN"
    if (typeof p.language === "string") {
      const migrated = migrateOldLanguageCode(p.language);
      if (migrated) return { watchRegion, languages: [migrated] };
    }

    return null;
  } catch {
    return null;
  }
}

export function RegionLanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [watchRegion, setWatchRegionState] = useState<WatchRegionCode>(
    DEFAULTS.watchRegion
  );
  const [languages, setLanguagesState] = useState<ContentLanguageCode[]>(
    DEFAULTS.languages
  );
  const [hydrated, setHydrated] = useState(false);
  const skipRefreshAfterFirstPersist = useRef(true);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStored();
      if (stored) {
        setWatchRegionState(stored.watchRegion);
        setLanguagesState(stored.languages);
        persistToCookies(stored.watchRegion, stored.languages);
        router.refresh();
      }
      setHydrated(true);
    });
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Stored = { watchRegion, languages };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    persistToCookies(watchRegion, languages);
    if (skipRefreshAfterFirstPersist.current) {
      skipRefreshAfterFirstPersist.current = false;
      return;
    }
    router.refresh();
  }, [watchRegion, languages, hydrated, router]);

  const setWatchRegion = useCallback((code: WatchRegionCode) => {
    setWatchRegionState(code);
  }, []);

  const setLanguages = useCallback((codes: ContentLanguageCode[]) => {
    const valid = codes.filter(isValidContentLanguage).slice(0, MAX_LANGUAGES);
    if (valid.length > 0) setLanguagesState(valid);
  }, []);

  const toggleLanguage = useCallback((code: ContentLanguageCode) => {
    setLanguagesState((prev) => {
      if (prev.includes(code)) {
        if (prev.length <= 1) return prev;
        return prev.filter((c) => c !== code);
      }
      if (prev.length >= MAX_LANGUAGES) return prev;
      return [...prev, code];
    });
  }, []);

  const value = useMemo(
    () => ({
      watchRegion,
      languages,
      setWatchRegion,
      setLanguages,
      toggleLanguage,
    }),
    [watchRegion, languages, setWatchRegion, setLanguages, toggleLanguage]
  );

  return (
    <RegionLanguageContext.Provider value={value}>
      {children}
    </RegionLanguageContext.Provider>
  );
}

export function useRegionLanguage(): RegionLanguageContextValue {
  const ctx = useContext(RegionLanguageContext);
  if (!ctx) {
    throw new Error(
      "useRegionLanguage must be used within RegionLanguageProvider"
    );
  }
  return ctx;
}
