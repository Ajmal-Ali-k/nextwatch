const FALLBACK_LABELS: Record<string, string> = {
  en: "English",
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  ml: "Malayalam",
  kn: "Kannada",
  mr: "Marathi",
  bn: "Bengali",
  pa: "Punjabi",
  gu: "Gujarati",
  ur: "Urdu",
};

export function tmdbLanguageLabel(iso6391: string | null | undefined): string | null {
  const code = typeof iso6391 === "string" ? iso6391.trim().toLowerCase() : "";
  if (!code) return null;

  const known = FALLBACK_LABELS[code];
  if (known) return known;

  try {
    // Node/Browser support depends on ICU data; we fall back to ISO code if missing.
    const dn = new Intl.DisplayNames(undefined, { type: "language" });
    const label = dn.of(code);
    if (typeof label === "string" && label.trim()) return label;
  } catch {
    // ignore
  }

  return code.toUpperCase();
}

