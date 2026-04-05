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
  COOKIE_UI_LANGUAGE,
  COOKIE_WATCH_REGION,
} from "@/lib/regionLanguageCookieNames";
import {
  defaultLanguageForRegion,
  isValidLanguageForRegion,
  type UiLanguageCode,
  type WatchRegionCode,
  WATCH_REGIONS,
} from "@/lib/regionLanguagePrefs";

export {
  defaultLanguageForRegion,
  languageLabelFor,
  LANGUAGES_BY_REGION,
  type UiLanguageCode,
  type WatchRegionCode,
  WATCH_REGIONS,
} from "@/lib/regionLanguagePrefs";

const STORAGE_KEY = "nextwatch.watchRegionLanguage";
const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

function persistRegionLanguageToCookies(watchRegion: WatchRegionCode, language: UiLanguageCode) {
  if (typeof document === "undefined") return;
  const base = `path=/;max-age=${COOKIE_MAX_AGE_SEC};SameSite=Lax`;
  document.cookie = `${COOKIE_WATCH_REGION}=${watchRegion};${base}`;
  document.cookie = `${COOKIE_UI_LANGUAGE}=${encodeURIComponent(language)};${base}`;
}

type Stored = {
  watchRegion: WatchRegionCode;
  language: UiLanguageCode;
};

const DEFAULTS: Stored = {
  watchRegion: "IN",
  language: "hi-IN",
};

type RegionLanguageContextValue = {
  watchRegion: WatchRegionCode;
  language: UiLanguageCode;
  setWatchRegion: (code: WatchRegionCode) => void;
  setLanguage: (code: UiLanguageCode) => void;
};

const RegionLanguageContext = createContext<RegionLanguageContextValue | null>(null);

function readStored(): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<Stored>;
    const watchRegion = WATCH_REGIONS.some((r) => r.code === p.watchRegion)
      ? (p.watchRegion as WatchRegionCode)
      : null;
    if (!watchRegion || !p.language || !isValidLanguageForRegion(watchRegion, p.language)) {
      return null;
    }
    return { watchRegion, language: p.language };
  } catch {
    return null;
  }
}

export function RegionLanguageProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [watchRegion, setWatchRegionState] = useState<WatchRegionCode>(DEFAULTS.watchRegion);
  const [language, setLanguageState] = useState<UiLanguageCode>(DEFAULTS.language);
  const [hydrated, setHydrated] = useState(false);
  const skipRefreshAfterFirstPersist = useRef(true);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStored();
      if (stored) {
        setWatchRegionState(stored.watchRegion);
        setLanguageState(stored.language);
        persistRegionLanguageToCookies(stored.watchRegion, stored.language);
        router.refresh();
      }
      setHydrated(true);
    });
  }, [router]);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Stored = { watchRegion, language };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    persistRegionLanguageToCookies(watchRegion, language);
    if (skipRefreshAfterFirstPersist.current) {
      skipRefreshAfterFirstPersist.current = false;
      return;
    }
    router.refresh();
  }, [watchRegion, language, hydrated, router]);

  const setWatchRegion = useCallback((code: WatchRegionCode) => {
    setWatchRegionState(code);
    setLanguageState((prev) =>
      isValidLanguageForRegion(code, prev) ? prev : defaultLanguageForRegion(code)
    );
  }, []);

  const setLanguage = useCallback((code: UiLanguageCode) => {
    setLanguageState(code);
  }, []);

  const value = useMemo(
    () => ({
      watchRegion,
      language,
      setWatchRegion,
      setLanguage,
    }),
    [watchRegion, language, setWatchRegion, setLanguage]
  );

  return (
    <RegionLanguageContext.Provider value={value}>{children}</RegionLanguageContext.Provider>
  );
}

export function useRegionLanguage(): RegionLanguageContextValue {
  const ctx = useContext(RegionLanguageContext);
  if (!ctx) {
    throw new Error("useRegionLanguage must be used within RegionLanguageProvider");
  }
  return ctx;
}
