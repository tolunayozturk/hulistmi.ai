import { fetchHuaweiJson } from "./fetch";
import { UPSTREAM_CONTRACT } from "./upstream-contract";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  breadcrumbs: string[];
  tags: string[];
  type: string;
}

interface HuaweiSearchResponse {
  searchResult?: Array<{ developerInfos?: HuaweiDeveloperInfo[] }>;
}

interface HuaweiDeveloperInfo {
  name?: string;
  url?: string;
  description?: string;
  highlightInfos?: string[];
  ext?: string;
}

export async function searchHarmonyOSDocs(
  query: string,
): Promise<{ query: string; results: SearchResult[] }> {
  const trimmed = query.trim();
  if (!trimmed) throw new Error("Search query is required");
  if (trimmed.length > UPSTREAM_CONTRACT.search.maxQueryLength)
    throw new Error("Search query is too long");
  const data = await fetchHuaweiJson<HuaweiSearchResponse>({
    url: UPSTREAM_CONTRACT.search.url,
    headers: UPSTREAM_CONTRACT.search.headers,
    body: { ...UPSTREAM_CONTRACT.search.bodyForUIAbility, keyWord: trimmed },
  });
  return {
    query: trimmed,
    results: normalizeSearchResults(data).slice(
      0,
      UPSTREAM_CONTRACT.search.maxLength,
    ),
  };
}

function normalizeSearchResults(data: HuaweiSearchResponse): SearchResult[] {
  return (data.searchResult ?? [])
    .flatMap((group) => group.developerInfos ?? [])
    .map((item) => ({
      title: item.name ?? "Untitled",
      url: item.url?.startsWith("http")
        ? item.url
        : `https://developer.huawei.com${item.url ?? ""}`,
      description: item.description ?? item.highlightInfos?.join(" ") ?? "",
      breadcrumbs: [],
      tags: parseTags(item.ext),
      type: "documentation",
    }));
}

function parseTags(ext: string | undefined): string[] {
  if (!ext) return [];
  try {
    const parsed = JSON.parse(ext) as { domain?: string; nextSubType?: string };
    return [parsed.domain, parsed.nextSubType].filter(Boolean) as string[];
  } catch {
    return [];
  }
}

export function renderSearchMarkdown(result: {
  query: string;
  results: SearchResult[];
}): string {
  const lines = [`# HarmonyOS search: ${result.query}`, ""];
  for (const item of result.results) {
    lines.push(`- [${item.title}](${item.url})`);
    if (item.description) lines.push(`  ${item.description}`);
  }
  return lines.join("\n");
}
