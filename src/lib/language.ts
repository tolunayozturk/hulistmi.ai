export type Language = "en" | "cn";

export const DEFAULT_LANGUAGE: Language = "en";

export const SUPPORTED_LANGUAGES: readonly Language[] = ["en", "cn"];

export function isLanguage(value: string): value is Language {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(value);
}

export function docPrefix(language: Language): string {
  return `/consumer/${language}/doc/`;
}
