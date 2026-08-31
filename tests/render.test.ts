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

  it("adds source metadata and footer (en default)", () => {
    const markdown = renderDocumentMarkdown(
      { status: "4", title: "Start", content: { content: "<p>Body</p>" } },
      "harmonyos-guides/start-overview",
      "HarmonyOS Guides",
    );
    expect(markdown).toContain("title: Start");
    expect(markdown).toContain("language: en");
    expect(markdown).toContain(
      "source: https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
    );
    expect(markdown).toContain("Extracted by [hulistmi.ai]");
  });

  it("emits cn frontmatter and cn source URL when language=cn", () => {
    const markdown = renderDocumentMarkdown(
      { status: "4", title: "Start", content: { content: "<p>Body</p>" } },
      "harmonyos-guides/start-overview",
      "HarmonyOS 指南",
      "cn",
    );
    expect(markdown).toContain("language: cn");
    expect(markdown).toContain(
      "source: https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview",
    );
    expect(markdown).toContain("category: HarmonyOS 指南");
  });

  it("falls back to localized Untitled when title is missing", () => {
    const en = renderDocumentMarkdown(
      { status: "4", title: "", content: { content: "<p>x</p>" } },
      "harmonyos-guides/x",
      "HarmonyOS Guides",
    );
    expect(en).toContain("title: Untitled");
    const cn = renderDocumentMarkdown(
      { status: "4", title: "", content: { content: "<p>x</p>" } },
      "harmonyos-guides/x",
      "HarmonyOS 指南",
      "cn",
    );
    expect(cn).toContain("title: 未命名");
  });
});

describe("list rendering", () => {
  it("keeps a list item's inline content on one line and preserves code spans", () => {
    expect(
      htmlToMarkdown(
        "<ul><li><strong>Create</strong>: A UIAbility instance has been created. The system triggers the <code>onCreate</code> callback.</li></ul>",
      ),
    ).toBe(
      "- **Create**: A UIAbility instance has been created. The system triggers the `onCreate` callback.",
    );
  });

  it("indents real blocks inside a list item instead of flattening them", () => {
    expect(
      htmlToMarkdown(
        "<ul><li>Outer <code>x</code><pre>const a = 1;</pre><ul><li>inner</li></ul></li></ul>",
      ),
    ).toBe("- Outer `x`\n\n  ```\n  const a = 1;\n  ```\n  - inner");
  });

  it("keeps a definition list's term and definition apart", () => {
    expect(
      htmlToMarkdown("<dl><dt>Term</dt><dd>Definition text</dd></dl>"),
    ).toBe("**Term**\n\nDefinition text");
  });
});
