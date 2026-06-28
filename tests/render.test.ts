import { describe, expect, it } from "vitest";
import { htmlToMarkdown, renderDocumentMarkdown } from "../src/lib/render";

describe("HarmonyOS Markdown rendering", () => {
  it("sanitizes scripts and renders common HTML elements", () => {
    const markdown = htmlToMarkdown(
      '<h2>Title</h2><p>Hello <a href="/doc">doc</a></p><script>alert(1)</script>',
    );
    expect(markdown).toContain("## Title");
    expect(markdown).toContain("Hello doc");
    expect(markdown).not.toContain("alert");
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
