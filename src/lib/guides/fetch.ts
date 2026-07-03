import { fetchHarmonyDocumentPageData } from "../documents";
import type { HarmonyDocumentValue } from "../types";

export async function fetchGuidePageData(
  path: string,
): Promise<HarmonyDocumentValue> {
  return fetchHarmonyDocumentPageData("harmonyos-guides", path);
}
