import { LABELS } from "../labels";
import { DEFAULT_LANGUAGE, type Language } from "../language";
import { renderDocumentMarkdown } from "../render";
import type { HarmonyDocumentValue } from "../types";

export function renderGuideMarkdown(
  value: HarmonyDocumentValue,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): string {
  return renderDocumentMarkdown(
    value,
    `harmonyos-guides/${path}`,
    LABELS[language].guidesCategory,
    language,
  );
}
