import { fetchMock } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../src/index";
import { SUPPORTED_CATALOGS } from "../src/lib/catalog-name";

const UPSTREAM = "https://svc-drcn.developer.huawei.com";
const PORTAL = "/community/servlet/consumer/cn/documentPortal";
const HUAWEI_DOCS = "https://developer.huawei.com/consumer";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => fetchMock.assertNoPendingInterceptors());

function huaweiServes(html: string) {
  const huawei = fetchMock.get(UPSTREAM);
  huawei
    .intercept({ method: "POST", path: `${PORTAL}/checkCenterGrayUser` })
    .reply(200, { code: 0, message: "success", value: { isGrayUser: 0 } });
  huawei
    .intercept({ method: "POST", path: `${PORTAL}/getDocumentById` })
    .reply(200, {
      code: 0,
      message: "success",
      value: { status: "4", title: "Page", content: { content: html } },
    });
}

// No rate limiter in this env, so the many calls below are not throttled.
const request = (path: string, init?: RequestInit) =>
  app.request(`https://hulistmi.test${path}`, init, {});

async function fetchTool(args: { path: string; language?: string }) {
  const body = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name: "fetchHarmonyOSDocumentation", arguments: args },
  });
  const res = await request("/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "Content-Length": String(new TextEncoder().encode(body).length),
    },
    body,
  });
  const data = (await res.text())
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5))
    .pop();
  const { result } = JSON.parse(data ?? "{}");
  return { isError: result?.isError, text: result?.content?.[0]?.text ?? "" };
}

describe("fetchHarmonyOSDocumentation", () => {
  // SKILL.md tells agents to name a page with the /consumer/{en|cn}/doc/ prefix; the
  // tool also takes the Huawei URL, and a bare <catalog>/<path> with `language`.
  for (const catalog of SUPPORTED_CATALOGS) {
    it(`fetches a ${catalog} page named in each documented form`, async () => {
      const page = `${catalog}/some-page`;
      const forms = [
        { args: { path: `/consumer/cn/doc/${page}` }, language: "cn" },
        { args: { path: `${HUAWEI_DOCS}/cn/doc/${page}` }, language: "cn" },
        { args: { path: `/consumer/en/doc/${page}` }, language: "en" },
        { args: { path: page, language: "cn" }, language: "cn" },
        { args: { path: page }, language: "en" },
      ];
      for (const { args, language } of forms) {
        huaweiServes("<p>Body</p>");
        const result = await fetchTool(args);
        expect(result.isError, `${args.path}: ${result.text}`).toBeFalsy();
        expect(result.text).toContain(
          `source: ${HUAWEI_DOCS}/${language}/doc/${page}`,
        );
        expect(result.text).toContain(`language: ${language}`);
      }
    });
  }
});
