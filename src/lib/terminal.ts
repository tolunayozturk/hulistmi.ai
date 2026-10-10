// The CLI writes Huawei's text to a terminal, where ECMA-48 control characters
// act: they can set the clipboard, hide lines or disguise links. Newline and tab
// stay; every other C0 control, DEL and C1 control shows as U+FFFD.
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching controls is the point
const CONTROLS = /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/g;

export function terminalSafe(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(CONTROLS, "�");
}

// JSON.stringify escapes C0 controls but writes DEL and C1 raw. Escaped, they
// keep the parsed value.
export function terminalSafeJson(value: unknown): string {
  return JSON.stringify(value, null, 2).replace(
    /[\u007f-\u009f]/g,
    (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`,
  );
}
