import { fetchHuaweiJson, NotFoundError } from "../fetch";
import type { HarmonyDocumentResponse, HarmonyDocumentValue } from "../types";
import { UPSTREAM_CONTRACT } from "../upstream-contract";

function documentKey(path: string): string {
  return `harmonyos-references/${path.replace(/^\/+/, "").replace(/\/+$/, "")}`;
}

export async function fetchReferencePageData(
  path: string,
): Promise<HarmonyDocumentValue> {
  const entry =
    UPSTREAM_CONTRACT.documents[
      documentKey(path) as keyof typeof UPSTREAM_CONTRACT.documents
    ];
  if (!entry) throw new NotFoundError(`Unknown HarmonyOS reference: ${path}`);
  await fetchHuaweiJson(entry.checkCenterGrayUser);
  await fetchHuaweiJson(entry.getCenterRootNodeTree);
  const response = await fetchHuaweiJson<HarmonyDocumentResponse>(
    entry.getCenterDocument,
  );
  if (response.code !== 0 && response.code !== "0")
    throw new Error("Huawei document response changed shape");
  if (
    !response.value ||
    response.value.status !== "4" ||
    !response.value.content?.content
  )
    throw new Error("Huawei document content is unavailable");
  return response.value;
}
