import { fetchHuaweiJson, ValidationError } from "./fetch";
import { LABELS } from "./labels";
import { DEFAULT_LANGUAGE, type Language } from "./language";
import { UPSTREAM_CONTRACT } from "./upstream-contract";
import { resolveHuaweiDocUrl } from "./url";

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  breadcrumbs: string[];
  tags: string[];
  type: string;
}

export interface SearchResponse {
  query: string;
  language: Language;
  results: SearchResult[];
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

function buildSearchBody(query: string, language: Language): unknown {
  // `developerVertical.language` is the docs-vertical selector; only the "en"
  // vertical is populated on the upstream, so it stays fixed at "en" regardless
  // of the requested result language. The top-level `language` field controls
  // the content language of returned results.
  const template = UPSTREAM_CONTRACT.search.searchBodyTemplate;
  return {
    ...template,
    language,
    keyWord: query,
    developerVertical: {
      ...template.developerVertical,
      language: "en",
    },
  };
}

export async function searchHarmonyOSDocs(
  query: string,
  language: Language = DEFAULT_LANGUAGE,
): Promise<SearchResponse> {
  const trimmed = query.trim();
  if (!trimmed) throw new ValidationError("Search query is required");
  if (trimmed.length > UPSTREAM_CONTRACT.search.maxQueryLength)
    throw new ValidationError("Search query is too long");
  const data = await fetchHuaweiJson<HuaweiSearchResponse>({
    url: UPSTREAM_CONTRACT.search.url,
    headers: UPSTREAM_CONTRACT.search.headers,
    body: buildSearchBody(trimmed, language),
  });
  return {
    query: trimmed,
    language,
    results: normalizeSearchResults(data, language).slice(
      0,
      UPSTREAM_CONTRACT.search.maxLength,
    ),
  };
}

function normalizeSearchResults(
  data: HuaweiSearchResponse,
  language: Language,
): SearchResult[] {
  return (data.searchResult ?? [])
    .flatMap((group) => group.developerInfos ?? [])
    .map((item) => ({
      title: item.name ?? LABELS[language].untitled,
      url: resolveHuaweiDocUrl(item.url),
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

export function renderSearchMarkdown(result: SearchResponse): string {
  const labels = LABELS[result.language];
  const lines = [`# ${labels.searchHeader(result.query)}`, ""];
  for (const item of result.results) {
    lines.push(`- [${item.title}](${item.url})`);
    if (item.description) lines.push(`  ${item.description}`);
  }
  return lines.join("\n");
}
