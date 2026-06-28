import * as cheerio from "cheerio";
import type { HarmonyDocumentValue } from "./types";
import { generateHuaweiDocUrl } from "./url";

export function htmlToMarkdown(html: string): string {
  const $ = cheerio.load(html);
  $("script,style,noscript").remove();
  const lines: string[] = [];

  $("h1,h2,h3,p,li,pre,code,a").each((_, element) => {
    const node = $(element);
    const text = node.text().replace(/\s+/g, " ").trim();
    if (!text) return;
    switch (element.tagName.toLowerCase()) {
      case "h1":
        lines.push(`# ${text}`);
        break;
      case "h2":
        lines.push(`## ${text}`);
        break;
      case "h3":
        lines.push(`### ${text}`);
        break;
      case "li":
        lines.push(`- ${text}`);
        break;
      case "pre":
        lines.push(`\`\`\`\n${node.text().trim()}\n\`\`\``);
        break;
      case "code":
        lines.push(`\`${text}\``);
        break;
      case "a": {
        const href = node.attr("href");
        lines.push(href ? `[${text}](${href})` : text);
        break;
      }
      default:
        lines.push(text);
    }
  });

  return lines
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderDocumentMarkdown(
  value: HarmonyDocumentValue,
  path: string,
  category: string,
): string {
  const title = value.title || "Untitled";
  const sourceUrl = generateHuaweiDocUrl(path);
  const body = htmlToMarkdown(value.content?.content ?? "");
  return `---\ntitle: ${title}\nsource: ${sourceUrl}\ntimestamp: ${new Date().toISOString()}\ncategory: ${category}\nlanguage: en\n---\n\n# ${title}\n\n${body}\n\n---\n\n*Extracted by [hulistmi.ai](https://hulistmi.ai) - Making HarmonyOS docs AI-readable.*\n*This is unofficial content. Source documentation belongs to Huawei.*\n`;
}
