"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const STORAGE_KEY = "nextwatch.watchRegionLanguage";

export const WATCH_REGIONS = [
  { code: "IN", label: "India" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom (UK)" },
] as const;

export type WatchRegionCode = (typeof WATCH_REGIONS)[number]["code"];

export type UiLanguageCode = "hi-IN" | "ta-IN" | "te-IN" | "ml-IN" | "en-US" | "en-GB";

export const LANGUAGES_BY_REGION: Record<
  WatchRegionCode,
  readonly { code: UiLanguageCode; label: string }[]
> = {
  IN: [
    { code: "hi-IN", label: "Hindi" },
    { code: "ta-IN", label: "Tamil" },
    { code: "te-IN", label: "Telugu" },
    { code: "ml-IN", label: "Malayalam" },
  ],
  US: [{ code: "en-US", label: "English (US)" }],
  GB: [{ code: "en-GB", label: "English (UK)" }],
};

export function defaultLanguageForRegion(region: WatchRegionCode): UiLanguageCode {
  return LANGUAGES_BY_REGION[region][0].code;
}

function isValidLanguageForRegion(region: WatchRegionCode, lang: string): lang is UiLanguageCode {
  return LANGUAGES_BY_REGION[region].some((l) => l.code === lang);
}

export function languageLabelFor(region: WatchRegionCode, code: UiLanguageCode): string {
  return LANGUAGES_BY_REGION[region].find((l) => l.code === code)?.label ?? code;
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
  const [watchRegion, setWatchRegionState] = useState<WatchRegionCode>(DEFAULTS.watchRegion);
  const [language, setLanguageState] = useState<UiLanguageCode>(DEFAULTS.language);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      const stored = readStored();
      if (stored) {
        setWatchRegionState(stored.watchRegion);
        setLanguageState(stored.language);
      }
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const payload: Stored = { watchRegion, language };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [watchRegion, language, hydrated]);

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
