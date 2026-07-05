import type { CatalogName } from "./catalog-name";
import {
  fetchHuaweiJson,
  NotFoundError,
  type VerifiedHuaweiRequest,
} from "./fetch";
import { DEFAULT_LANGUAGE, type Language } from "./language";
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
  value?: {
    isGrayUser?: number | boolean;
    centerPrefix?: string;
    level2NodeAlias?: string;
    isApi?: number | boolean;
    filename?: string;
  };
}

type BodyWithLanguage = Record<string, unknown> & { language: Language };

const DOCUMENTS = UPSTREAM_CONTRACT.documents as Record<
  string,
  DocumentContractEntry
>;
const DOCUMENT_SLUG_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
const GRAY_ID = "11111111111111111111111111111111";
const CHECK_CENTER_GRAY_USER_URL =
  "https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/checkCenterGrayUser";
const GET_DOCUMENT_BY_ID_URL =
  "https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getDocumentById";
const GET_CENTER_ROOT_NODE_TREE_URL =
  "https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getCenterRootNodeTree";
const GET_CENTER_DOCUMENT_URL =
  "https://svc-drcn.developer.huawei.com/community/servlet/consumer/cn/documentPortal/getCenterDocument";

export async function fetchHarmonyDocumentPageData(
  catalogName: CatalogName,
  path: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<HarmonyDocumentValue> {
  const pinned = DOCUMENTS[documentKey(catalogName, path)];
  const entry = withLanguage(
    pinned ?? buildEntry(catalogName, path, language),
    language,
  );

  const grayResponse = await fetchHuaweiJson<GrayUserResponse>(
    entry.checkCenterGrayUser,
  );
  if (isCenterDocument(grayResponse)) {
    const centerRequests =
      entry.getCenterRootNodeTree && entry.getCenterDocument
        ? {
            getCenterRootNodeTree: entry.getCenterRootNodeTree,
            getCenterDocument: entry.getCenterDocument,
          }
        : buildCenterRequests(grayResponse, path, language);
    await fetchHuaweiJson(centerRequests.getCenterRootNodeTree);
    return fetchAndValidateDocument(centerRequests.getCenterDocument);
  }

  return fetchAndValidateDocument(entry.getDocumentById);
}

function withLanguage(
  entry: DocumentContractEntry,
  language: Language,
): DocumentContractEntry {
  const stamp = (request: VerifiedHuaweiRequest): VerifiedHuaweiRequest => ({
    ...request,
    body: { ...request.body, language } as BodyWithLanguage,
  });
  const stampOptional = (
    request: VerifiedHuaweiRequest | undefined,
  ): VerifiedHuaweiRequest | undefined =>
    request ? stamp(request) : undefined;
  return {
    checkCenterGrayUser: stamp(entry.checkCenterGrayUser),
    getDocumentById: stamp(entry.getDocumentById),
    getCenterRootNodeTree: stampOptional(entry.getCenterRootNodeTree),
    getCenterDocument: stampOptional(entry.getCenterDocument),
  };
}

function documentKey(catalogName: CatalogName, path: string): string {
  return `${catalogName}/${normalizeDocumentSlug(path)}`;
}

function buildEntry(
  catalogName: CatalogName,
  path: string,
  language: Language,
): DocumentContractEntry {
  const slug = normalizeDocumentSlug(path);
  if (!DOCUMENT_SLUG_PATTERN.test(slug))
    throw new NotFoundError(`Unknown HarmonyOS document: ${path}`);

  return {
    checkCenterGrayUser: {
      url: CHECK_CENTER_GRAY_USER_URL,
      headers: {},
      body: {
        catalogName,
        language,
        fileName: slug,
        grayId: GRAY_ID,
      },
    },
    getDocumentById: {
      url: GET_DOCUMENT_BY_ID_URL,
      headers: {},
      body: {
        objectId: slug,
        nodeAlias: null,
        catalogName,
        language,
      },
    },
  };
}

function normalizeDocumentSlug(path: string): string {
  return path.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();
}

function isCenterDocument(response: GrayUserResponse): boolean {
  return (
    (response.code === 0 || response.code === "0") &&
    Boolean(response.value?.isGrayUser)
  );
}

function buildCenterRequests(
  response: GrayUserResponse,
  path: string,
  language: Language,
): Pick<DocumentContractEntry, "getCenterRootNodeTree" | "getCenterDocument"> {
  const value = response.value;
  const fileName = value?.filename ?? normalizeDocumentSlug(path);
  if (
    !value?.centerPrefix ||
    !value.level2NodeAlias ||
    !DOCUMENT_SLUG_PATTERN.test(fileName)
  )
    throw new Error("HarmonyOS center document response changed shape");

  const body = {
    centerPrefix: value.centerPrefix,
    language,
    level2NodeAlias: value.level2NodeAlias,
    isApi: value.isApi ? 1 : 0,
    fileName,
  };
  return {
    getCenterRootNodeTree: {
      url: GET_CENTER_ROOT_NODE_TREE_URL,
      headers: {},
      body,
    },
    getCenterDocument: {
      url: GET_CENTER_DOCUMENT_URL,
      headers: {},
      body,
    },
  };
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
