import * as cheerio from "cheerio";
import { LABELS } from "./labels";
import { DEFAULT_LANGUAGE, type Language } from "./language";
import { PUBLIC_ORIGIN } from "./origin";
import type { HarmonyDocumentValue } from "./types";
import { generateHuaweiDocUrl } from "./url";

interface NodeLike {
  type?: string;
  tagName?: string;
  name?: string;
  data?: string;
  children?: NodeLike[];
}

export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  // Strip anchor name elements (Huawei doc ID anchors)
  $("a[name]").remove();

  // Remove h1 — it's already rendered as the document title by renderDocumentMarkdown
  $("h1").remove();
  const root = $("body").length ? $("body") : $.root();
  return renderChildren(root.get(0) as NodeLike, $)
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function renderChildren(node: NodeLike, $: cheerio.CheerioAPI): string {
  return (node.children ?? [])
    .map((child) => renderBlock(child, $))
    .filter(Boolean)
    .join("\n\n");
}

function renderBlock(node: NodeLike, $: cheerio.CheerioAPI): string {
  if (node.type === "text") return normalizeText(node.data ?? "");
  if (node.type !== "tag") return "";

  const tag = (node.tagName ?? node.name ?? "").toLowerCase();
  const element = $(node);
  switch (tag) {
    case "h1":
    case "h2":
    case "h3":
    case "h4":
    case "h5":
    case "h6": {
      const depth = Number(tag.slice(1));
      let text = inlineText(node, $);
      // Strip [hX] artifacts from headings
      text = text.replace(/\[h[1-6]\]/gi, "");
      return `${"#".repeat(depth)} ${text}`;
    }
    case "p":
      return inlineText(node, $);
    case "pre": {
      const cls = $(node).attr("class");
      const text = element.text();
      const langMatch = cls
        ? cls.match(
            /\b(ts|json|html|xml|bash|sh|css|js|java|python|cpp|kotlin|swift|go|rust|ruby)\b/,
          )
        : null;
      const codeLang = langMatch ? langMatch[1] : "";
      const fence = codeLang ? `\`\`\`${codeLang}\n` : `\`\`\`\n`;
      return `${fence}${text.trim()}\n\`\`\``;
    }
    case "code":
      return `\`${normalizeText(element.text())}\``;
    case "dl":
      return renderDefinitionList(node, $);
    case "ul":
      return renderList(node, $, false);
    case "ol":
      return renderList(node, $, true);
    case "table":
      return renderTable(node, $);
    case "br":
      return "\n";
    case "hr":
      return "---";
    case "blockquote":
      return renderChildren(node, $)
        .split("\n")
        .map((line) => (line ? `> ${line}` : ">"))
        .join("\n");
    case "div":
    case "section":
    case "article":
    case "main":
    case "body":
    case "thead":
    case "tbody":
    case "tfoot":
      return renderChildren(node, $);
    case "strong":
      return `**${inlineText(node, $)}**`;
    case "em":
    case "i":
      return `*${inlineText(node, $)}*`;
    case "sup":
      return `^{${inlineText(node, $)}}`;
    case "sub":
      return `_{${inlineText(node, $)}}`;
    case "span":
      // span is often used for image wrappers or styling — recurse
      return renderChildren(node, $);
    default:
      return hasBlockChildren(node)
        ? renderChildren(node, $)
        : inlineText(node, $);
  }
}

function renderList(
  node: NodeLike,
  $: cheerio.CheerioAPI,
  ordered: boolean,
): string {
  return (node.children ?? [])
    .filter((child) => child.type === "tag" && tagName(child) === "li")
    .map((item, index) => {
      const marker = ordered ? `${index + 1}.` : "-";
      // Inline children (text, <strong>, <code>, <a>) belong on the marker line;
      // only genuine blocks like <pre> or <table> become their own paragraph.
      // Rendering everything through renderChildren joined each of them with a
      // blank line, which split one sentence across four blocks and dropped the
      // backticks around <code>, since renderBlock had no code case.
      const allChildren = item.children ?? [];
      const nestedChildren = allChildren.filter((c) =>
        ["ul", "ol"].includes(tagName(c)),
      );
      const nonNested = allChildren.filter(
        (c) => !["ul", "ol"].includes(tagName(c)),
      );
      const blocks = renderItemBlocks(nonNested, $);
      const [first = "", ...rest] = blocks;
      const text = rest.length
        ? `${first}\n\n${rest.map((block) => indent(block)).join("\n\n")}`
        : first;
      const nested = nestedChildren
        .map((child) =>
          renderList(child, $, tagName(child) === "ol")
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n"),
        )
        .filter(Boolean)
        .join("\n");
      return nested ? `${marker} ${text}\n${nested}` : `${marker} ${text}`;
    })
    .join("\n");
}

const INLINE_TAGS = [
  "a",
  "abbr",
  "b",
  "br",
  "code",
  "em",
  "i",
  "img",
  "kbd",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "u",
];

function isInlineNode(node: NodeLike): boolean {
  if (node.type === "text") return true;
  if (node.type !== "tag") return false;
  const tag = tagName(node);
  // A <span> wrapping real blocks is a block in disguise.
  if (tag === "span" && hasBlockChildren(node)) return false;
  return INLINE_TAGS.includes(tag);
}

// Group an <li>'s children into rendered blocks, keeping runs of inline nodes
// together so a sentence stays a sentence.
function renderItemBlocks(
  children: NodeLike[],
  $: cheerio.CheerioAPI,
): string[] {
  const blocks: string[] = [];
  let run: NodeLike[] = [];
  const flush = () => {
    if (run.length === 0) return;
    const text = inlineText({ type: "tag", children: run } as NodeLike, $);
    if (text) blocks.push(text);
    run = [];
  };
  for (const child of children) {
    if (isInlineNode(child)) {
      run.push(child);
      continue;
    }
    flush();
    const block = renderBlock(child, $).trim();
    if (block) blocks.push(block);
  }
  flush();
  return blocks;
}

function indent(block: string): string {
  return block
    .split("\n")
    .map((line) => (line ? `  ${line}` : line))
    .join("\n");
}

// Markdown has no definition list, so a term and its definition are rendered as a
// bold line and a paragraph. Rendering the <dl>'s children as one run concatenated
// them into "TermDefinition text".
function renderDefinitionList(node: NodeLike, $: cheerio.CheerioAPI): string {
  return (node.children ?? [])
    .filter((child) => ["dt", "dd"].includes(tagName(child)))
    .map((child) => {
      const text = renderItemBlocks(child.children ?? [], $)
        .filter(Boolean)
        .join("\n\n")
        .trim();
      if (!text) return "";
      return tagName(child) === "dt" ? `**${text}**` : text;
    })
    .filter(Boolean)
    .join("\n\n");
}

function renderTable(node: NodeLike, $: cheerio.CheerioAPI): string {
  const rows = $(node)
    .find("tr")
    .toArray()
    .map((row) =>
      $(row)
        .children("th,td")
        .toArray()
        .map((cell) => escapeTableCell(inlineText(cell as NodeLike, $))),
    )
    .filter((cells) => cells.length > 0);
  if (rows.length === 0) return "";

  const columnCount = Math.max(...rows.map((row) => row.length));
  const normalized = rows.map((row) =>
    Array.from({ length: columnCount }, (_, index) => row[index] ?? ""),
  );
  const [header, ...body] = normalized;
  return [
    tableRow(header),
    tableRow(header.map(() => "---")),
    ...body.map(tableRow),
  ].join("\n");
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(" | ")} |`;
}

function escapeTableCell(text: string): string {
  return text.replace(/\|/g, "\\|").replace(/\n+/g, "<br>");
}

function inlineText(node: NodeLike, $: cheerio.CheerioAPI): string {
  return (node.children ?? [])
    .map((child) => inlineNode(child, $))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

function inlineNode(node: NodeLike, $: cheerio.CheerioAPI): string {
  if (node.type === "text") return node.data ?? "";
  if (node.type !== "tag") return "";

  const tag = tagName(node);
  if (tag === "br") return "\n";
  if (tag === "code") return `\`${normalizeText($(node).text())}\``;
  if (tag === "a") {
    const text = inlineText(node, $);
    const href = $(node).attr("href");
    return href && text ? `[${text}](${href})` : text;
  }
  if (tag === "img") {
    const src = $(node).attr("src") ?? "";
    const alt = $(node).attr("alt") ?? $(node).attr("title") ?? "";
    // Use a short filename from the URL as alt when none is provided
    const fallbackAlt =
      alt || (src ? (src.split("/").pop()?.split("?")[0] ?? "") : "");
    return `![${fallbackAlt}](${src})`;
  }
  if (tag === "strong") return `**${inlineText(node, $)}**`;
  if (tag === "em" || tag === "i") return `*${inlineText(node, $)}*`;
  if (tag === "sup") return `^{${inlineText(node, $)}}`;
  if (tag === "sub") return `_{${inlineText(node, $)}}`;
  return inlineText(node, $);
}

function hasBlockChildren(node: NodeLike): boolean {
  return (node.children ?? []).some((child) =>
    [
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "p",
      "ul",
      "ol",
      "table",
      "pre",
      "div",
      "section",
      "article",
    ].includes(tagName(child)),
  );
}

function tagName(node: NodeLike): string {
  return (node.tagName ?? node.name ?? "").toLowerCase();
}

function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function renderDocumentMarkdown(
  value: HarmonyDocumentValue,
  path: string,
  category: string,
  language: Language = DEFAULT_LANGUAGE,
): string {
  const title = value.title || LABELS[language].untitled;
  const sourceUrl = generateHuaweiDocUrl(path, language);
  const body = htmlToMarkdown(value.content?.content ?? "");
  return `---\ntitle: ${title}\nsource: ${sourceUrl}\ntimestamp: ${new Date().toISOString()}\ncategory: ${category}\nlanguage: ${language}\n---\n\n# ${title}\n\n${body}\n\n---\n\n*Extracted by [hulistmi.ai](${PUBLIC_ORIGIN}) - Making HarmonyOS docs AI-readable.*\n*This is unofficial content. Source documentation belongs to Huawei.*\n`;
}
