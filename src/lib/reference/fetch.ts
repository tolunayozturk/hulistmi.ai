import { fetchHarmonyDocumentPageData } from "../documents";
import type { HarmonyDocumentValue } from "../types";

export async function fetchReferencePageData(
  path: string,
): Promise<HarmonyDocumentValue> {
  return fetchHarmonyDocumentPageData("harmonyos-references", path);
}
