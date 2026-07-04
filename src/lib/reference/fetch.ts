import { fetchHarmonyDocumentPageData } from "../documents";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import type { HarmonyDocumentValue } from "../types";

export async function fetchReferencePageData(
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<HarmonyDocumentValue> {
  return fetchHarmonyDocumentPageData("harmonyos-references", path, language);
}
