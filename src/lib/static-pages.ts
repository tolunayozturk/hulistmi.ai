import { selfHostedNote } from "./origin";

/**
 * Static pages name the deployment through placeholders, so each deployment serves
 * its own address: {{ORIGIN}}. {{HOSTED_NOTE}} adds a paragraph that points a
 * self-hosted instance to the hosted version, and is empty on the hosted version.
 */
export function fillPlaceholders(
  text: string,
  origin: string,
  format: "html" | "text",
): string {
  const note =
    format === "html"
      ? selfHostedNote(origin, (url) => `<a href="${url}">${url}</a>`)
      : selfHostedNote(origin);
  const paragraph = !note
    ? ""
    : format === "html"
      ? `\n<p>${note}</p>`
      : `\n\n${note}`;
  return text
    .replaceAll("{{ORIGIN}}", origin)
    .replaceAll("{{HOSTED_NOTE}}", paragraph);
}
