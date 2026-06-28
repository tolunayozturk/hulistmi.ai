import { HTTPException } from "hono/http-exception";

export const SKILL_NAME = "hulistmi";

export const skillHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=600",
  "Content-Type": "text/markdown; charset=utf-8",
};

export const skillIndexHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=600",
  "Content-Type": "application/json; charset=utf-8",
};

export interface SkillArtifact {
  bytes: ArrayBuffer;
  description: string;
  name: string;
}

export async function loadSkill(
  assets: Fetcher,
  baseUrl: string,
): Promise<SkillArtifact> {
  const skillResponse = await assets.fetch(
    new Request(new URL("/SKILL.md", baseUrl).toString()),
  );
  if (!skillResponse.ok)
    throw new HTTPException(500, { message: "Failed to load SKILL.md" });
  const bytes = await skillResponse.arrayBuffer();
  const frontmatter = parseSkillFrontmatter(new TextDecoder().decode(bytes));
  if (frontmatter.name !== SKILL_NAME)
    throw new HTTPException(500, {
      message: `Expected skill name "${SKILL_NAME}".`,
    });
  if (!frontmatter.description)
    throw new HTTPException(500, { message: "Skill description is required." });
  return {
    bytes,
    description: frontmatter.description,
    name: frontmatter.name,
  };
}

export async function skillExists(
  assets: Fetcher,
  baseUrl: string,
): Promise<boolean> {
  const response = await assets.fetch(
    new Request(new URL("/SKILL.md", baseUrl).toString(), { method: "HEAD" }),
  );
  return response.ok;
}

export async function createSkillIndex(skill: SkillArtifact) {
  return {
    $schema: "https://schemas.agentskills.io/discovery/0.2.0/schema.json",
    skills: [
      {
        name: skill.name,
        type: "skill-md",
        description: skill.description,
        url: `/.well-known/agent-skills/${skill.name}/SKILL.md`,
        digest: `sha256:${await sha256Hex(skill.bytes)}`,
        files: ["SKILL.md"],
      },
    ],
  };
}

function parseSkillFrontmatter(markdown: string): Record<string, string> {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match)
    throw new HTTPException(500, {
      message: "SKILL.md must start with YAML frontmatter.",
    });
  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const separator = line.indexOf(":");
    if (separator === -1)
      throw new HTTPException(500, {
        message: `Invalid SKILL.md frontmatter line: ${line}`,
      });
    fields[line.slice(0, separator).trim()] = line
      .slice(separator + 1)
      .trim()
      .replace(/^['"]|['"]$/g, "");
  }
  return fields;
}

async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
