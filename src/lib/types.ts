export interface HarmonyContentBlock {
  content: string;
}

export interface HarmonyDocumentValue {
  status: string;
  title: string;
  content: HarmonyContentBlock | null;
  anchorList?: Array<{ title?: string; anchorId?: string }>;
  docId?: string | number;
  updatedDate?: string;
}

export interface HarmonyDocumentResponse {
  code: number | string;
  message?: string;
  value?: HarmonyDocumentValue;
}
