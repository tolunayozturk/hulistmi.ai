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

describe("document ETag", () => {
  // Huawei signs each image URL anew on every request. Seen live on 2026-10-08 for
  // harmonyos-guides/start-overview: two fetches two minutes apart differed only here.
  const page = (date: string, sign: string, text: string) =>
    `<p>${text}</p><p><img src="https://contentcenter-vali-drcn.dbankcdn.cn/pvt_2/DeveloperAlliance_scene_100_1/6c/v3/zDM-pmO8RwqVGrwwFuu1uQ/en-us_image_0000002750162136.png?HW-CC-KV=V1&HW-CC-Date=${date}&HW-CC-Expire=86400&HW-CC-Sign=${sign}"></p>`;
  const etag = async (html: string) => {
    huaweiServes(html);
    const res = await request(
      "/consumer/en/doc/harmonyos-guides/start-overview",
    );
    expect(res.status).toBe(200);
    return res.headers.get("ETag");
  };

  it("stays the same when only the image signatures change, and changes with the text", async () => {
    const first = await etag(
      page(
        "20261008T183215Z",
        "D52EA2FEF02A9EE01F1339C20FFDCB52546643E0505FC1FB1E02F05E4313CD90",
        "Body",
      ),
    );
    const resigned = await etag(
      page(
        "20261008T183550Z",
        "783C62D8581F05BADFDF6B31C84950E3D7D98E54E96BB3742A291F3B0DD79EF5",
        "Body",
      ),
    );
    const edited = await etag(
      page(
        "20261008T183550Z",
        "783C62D8581F05BADFDF6B31C84950E3D7D98E54E96BB3742A291F3B0DD79EF5",
        "Edited body",
      ),
    );

    expect(first).toBeTruthy();
    expect(resigned).toBe(first);
    expect(edited).not.toBe(first);
  });
});
