import { renderDocumentMarkdown } from "../render";
import type { HarmonyDocumentValue } from "../types";

export function renderGuideMarkdown(
  value: HarmonyDocumentValue,
  path: string,
): string {
  return renderDocumentMarkdown(
    value,
    `harmonyos-guides/${path}`,
    "HarmonyOS Guides",
  );
}
