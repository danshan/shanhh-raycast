export type Language = {
  code: string;
  name: string;
};

export const LANGUAGES: readonly Language[] = [
  { code: "zh-CN", name: "Simplified Chinese" },
  { code: "zh-TW", name: "Traditional Chinese" },
  { code: "en", name: "English" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "es", name: "Spanish" },
  { code: "pt", name: "Portuguese" },
  { code: "it", name: "Italian" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
  { code: "th", name: "Thai" },
  { code: "vi", name: "Vietnamese" },
  { code: "id", name: "Indonesian" },
];

export function resolveLanguages(codes: readonly (string | undefined)[]): Language[] {
  const seen = new Set<string>();
  const languages: Language[] = [];

  for (const code of codes) {
    if (!code || seen.has(code)) continue;
    const language = LANGUAGES.find((candidate) => candidate.code === code);
    if (!language) continue;
    seen.add(code);
    languages.push(language);
  }

  return languages.slice(0, 3);
}
