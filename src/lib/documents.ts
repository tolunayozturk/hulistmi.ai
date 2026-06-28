import {
  fetchHuaweiJson,
  NotFoundError,
  type VerifiedHuaweiRequest,
} from "./fetch";
import type { HarmonyDocumentResponse, HarmonyDocumentValue } from "./types";
import { UPSTREAM_CONTRACT } from "./upstream-contract";

interface DocumentContractEntry {
  checkCenterGrayUser: VerifiedHuaweiRequest;
  getDocumentById: VerifiedHuaweiRequest;
  getCenterRootNodeTree?: VerifiedHuaweiRequest;
  getCenterDocument?: VerifiedHuaweiRequest;
}

interface GrayUserResponse {
  code: number | string;
  value?: { isGrayUser?: number | boolean };
}

const DOCUMENTS = UPSTREAM_CONTRACT.documents as Record<
  string,
  DocumentContractEntry
>;

export async function fetchHarmonyDocumentPageData(
  catalogName: "harmonyos-guides" | "harmonyos-references",
  path: string,
): Promise<HarmonyDocumentValue> {
  const entry = DOCUMENTS[documentKey(catalogName, path)];
  if (!entry) throw new NotFoundError(`Unknown HarmonyOS document: ${path}`);

  const grayResponse = await fetchHuaweiJson<GrayUserResponse>(
    entry.checkCenterGrayUser,
  );
  if (isCenterDocument(grayResponse)) {
    if (!entry.getCenterRootNodeTree || !entry.getCenterDocument)
      throw new Error("HarmonyOS document contract is missing center requests");
    await fetchHuaweiJson(entry.getCenterRootNodeTree);
    return fetchAndValidateDocument(entry.getCenterDocument);
  }

  return fetchAndValidateDocument(entry.getDocumentById);
}

function documentKey(
  catalogName: "harmonyos-guides" | "harmonyos-references",
  path: string,
): string {
  return `${catalogName}/${path.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase()}`;
}

function isCenterDocument(response: GrayUserResponse): boolean {
  return (
    (response.code === 0 || response.code === "0") &&
    Boolean(response.value?.isGrayUser)
  );
}

async function fetchAndValidateDocument(
  request: VerifiedHuaweiRequest,
): Promise<HarmonyDocumentValue> {
  const response = await fetchHuaweiJson<HarmonyDocumentResponse>(request);
  if (response.code !== 0 && response.code !== "0")
    throw new Error("HarmonyOS document response changed shape");
  if (
    !response.value ||
    response.value.status !== "4" ||
    !response.value.content?.content
  )
    throw new Error("HarmonyOS document content is unavailable");
  return response.value;
}
