import { renderDocumentMarkdown } from "../render";
import type { HarmonyDocumentValue } from "../types";

export function renderReferenceMarkdown(
  value: HarmonyDocumentValue,
  path: string,
): string {
  return renderDocumentMarkdown(
    value,
    `harmonyos-references/${path}`,
    "HarmonyOS References",
  );
}
