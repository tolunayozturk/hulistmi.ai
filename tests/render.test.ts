import { describe, expect, it } from "vitest";
import { htmlToMarkdown, renderDocumentMarkdown } from "../src/lib/render";

describe("HarmonyOS Markdown rendering", () => {
  it("sanitizes scripts and renders common HTML elements", () => {
    const markdown = htmlToMarkdown(
      '<h2>Title</h2><p>Hello <a href="/doc">doc</a></p><script>alert(1)</script>',
    );
    expect(markdown).toContain("## Title");
    expect(markdown).toContain("Hello [doc](/doc)");
    expect(markdown).not.toContain("alert");
  });

  it("renders section headings and tables without duplicating child text", () => {
    const markdown = htmlToMarkdown(`
      <h2>Available APIs</h2>
      <p>Common ArkTS APIs are listed below.</p>
      <table>
        <tr><th>API</th><th>Description</th></tr>
        <tr>
          <td><code>startPiP(): Promise&lt;void&gt;</code></td>
          <td>Starts a PiP window.</td>
        </tr>
        <tr>
          <td><code>stopPiP(): Promise&lt;void&gt;</code></td>
          <td>Stops a PiP window.</td>
        </tr>
      </table>
      <ul>
        <li>Video playback</li>
      </ul>
    `);

    expect(markdown).toContain("## Available APIs");
    expect(markdown).toContain("| API | Description |");
    expect(markdown).toContain(
      "| `startPiP(): Promise<void>` | Starts a PiP window. |",
    );
    expect(markdown.match(/Video playback/g)).toHaveLength(1);
  });

  it("adds source metadata and footer", () => {
    const markdown = renderDocumentMarkdown(
      { status: "4", title: "Start", content: { content: "<p>Body</p>" } },
      "harmonyos-guides/start-overview",
      "HarmonyOS Guides",
    );
    expect(markdown).toContain("title: Start");
    expect(markdown).toContain(
      "source: https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
    );
    expect(markdown).toContain("Extracted by [hulistmi.ai]");
  });
});
