import { describe, expect, it } from "vitest";
import { terminalSafe, terminalSafeJson } from "../src/lib/terminal";

// The CLI writes Huawei's text to a terminal. ECMA-48 control characters (C0
// except newline and tab, DEL, C1) must not reach it raw.
const ESC = "\u001b";
const BEL = "\u0007";
const CSI8 = "\u009b";
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching controls is the point
const CONTROLS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/;

describe("terminalSafe", () => {
  it("makes escape sequences inert and keeps the text around them", () => {
    const title = `Guide${ESC}]0;TITLE${BEL} ${CSI8}31m red ${ESC}[8mhidden\u007f`;
    const safe = terminalSafe(title);
    expect(safe).not.toMatch(CONTROLS);
    expect(safe).toBe("Guide�]0;TITLE� �31m red �[8mhidden�");
  });

  it("keeps newlines, tabs, CRLF line ends and non-ASCII text", () => {
    expect(terminalSafe("a\tb\r\nc\n指南 é ✓")).toBe("a\tb\nc\n指南 é ✓");
    expect(terminalSafe("echo ok\recho safe")).toBe("echo ok�echo safe");
  });
});

describe("terminalSafeJson", () => {
  it("emits valid JSON without raw controls that parses to the same value", () => {
    const value = { content: `x${ESC}[2J ${CSI8}2J \u007f 指南\n` };
    const json = terminalSafeJson(value);
    expect(json).not.toMatch(CONTROLS);
    expect(JSON.parse(json)).toEqual(value);
  });
});
