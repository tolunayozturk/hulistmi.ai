import { fetchMock, SELF } from "cloudflare:test";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import app from "../src/index";

// A deployment identifies itself, to readers and to Huawei, by its own origin. Only
// the maintainer's deployment presents the hosted origin; every other one links to it
// as the hosted version instead.
const HOSTED = "https://hulistmi-ai.y6vd2dkjgb.workers.dev";
const UPSTREAM = "https://svc-drcn.developer.huawei.com";
const PORTAL = "/community/servlet/consumer/cn/documentPortal";
const DOC = "/consumer/en/doc/harmonyos-guides/start-overview";

beforeAll(() => {
  fetchMock.activate();
  fetchMock.disableNetConnect();
});

afterEach(() => fetchMock.assertNoPendingInterceptors());

// Huawei answers only when the User-Agent names `origin`; any other agent finds no
// interceptor, and the document request fails.
function huaweiServesTo(origin: string) {
  const agent = new RegExp(
    `^hulistmi-ai/\\S+ \\(\\+${origin.replaceAll(".", "\\.")}/bot\\)$`,
  );
  const huawei = fetchMock.get(UPSTREAM);
  huawei
    .intercept({
      method: "POST",
      path: `${PORTAL}/checkCenterGrayUser`,
      headers: { "user-agent": agent },
    })
    .reply(200, { code: 0, message: "success", value: { isGrayUser: 0 } });
  huawei
    .intercept({
      method: "POST",
      path: `${PORTAL}/getDocumentById`,
      headers: { "user-agent": agent },
    })
    .reply(200, {
      code: 0,
      message: "success",
      value: {
        status: "4",
        title: "Start",
        content: { content: "<p>Body</p>" },
      },
    });
}

describe("deployment identity", () => {
  it("leaves the hosted deployment's output as it was", async () => {
    huaweiServesTo(HOSTED);

    const res = await SELF.fetch(`${HOSTED}${DOC}`);

    expect(res.status).toBe(200);
    // The footer from before self-hosted origins existed, byte for byte.
    expect(await res.text()).toMatch(
      new RegExp(
        `\\n---\\n\\n\\*Extracted by \\[hulistmi\\.ai\\]\\(${HOSTED.replaceAll(".", "\\.")}\\) - Making HarmonyOS docs AI-readable\\.\\*\\n\\*This is unofficial content\\. Source documentation belongs to Huawei\\.\\*\\n$`,
      ),
    );
  });

  it("identifies each self-hosted hostname as itself, even when requests overlap", async () => {
    huaweiServesTo("https://a.example.com");
    huaweiServesTo("https://b.example.com");

    const [a, b] = await Promise.all(
      ["https://a.example.com", "https://b.example.com"].map((origin) =>
        SELF.fetch(`${origin}${DOC}`),
      ),
    );

    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    const [aBody, bBody] = await Promise.all([a.text(), b.text()]);
    expect(aBody).toContain("[hulistmi.ai](https://a.example.com)");
    expect(aBody).not.toContain("b.example.com");
    expect(bBody).toContain("[hulistmi.ai](https://b.example.com)");
    expect(bBody).not.toContain("a.example.com");
    for (const body of [aBody, bBody])
      expect(body).toContain(`[hulistmi.ai](${HOSTED})`);
  });

  it("presents the PUBLIC_ORIGIN binding instead of the hostname behind a proxy", async () => {
    huaweiServesTo("https://docs.example.com");
    const env = { PUBLIC_ORIGIN: "https://docs.example.com/any/path" };

    const doc = await app.request(`http://10.0.0.5:8080${DOC}`, {}, env);
    const bot = await app.request("http://10.0.0.5:8080/bot", {}, env);

    expect(doc.status).toBe(200);
    expect(await doc.text()).toContain(
      "[hulistmi.ai](https://docs.example.com)",
    );
    const botText = await bot.text();
    expect(botText).toContain("(+https://docs.example.com/bot)");
    expect(botText).toContain(HOSTED);
    expect(botText).not.toContain("10.0.0.5");
  });

  it("refuses to serve, without calling Huawei, when the binding is not an http(s) URL", async () => {
    // "localhost:8787" parses as a URL with the origin "null".
    const env = { PUBLIC_ORIGIN: "localhost:8787" };

    const responses = await Promise.all([
      app.request(`https://docs.example.com${DOC}`, {}, env),
      app.request("https://docs.example.com/bot", {}, env),
    ]);

    for (const res of responses) {
      expect(res.status).toBe(500);
      const text = await res.text();
      expect(text).not.toContain("null");
      expect(text).not.toContain("docs.example.com");
    }
  });
});

describe("static pages", () => {
  const PAGES = ["/", "/llms.txt", "/sitemap.xml", "/SKILL.md"];
  const read = async (origin: string, path: string) => {
    const res = await SELF.fetch(`${origin}${path}`);
    expect(res.status).toBe(200);
    return res.text();
  };

  it("name the deployment that serves them, and link the hosted one only from a self-hosted copy", async () => {
    const self = "https://a.example.com";
    const lines = (text: string) => text.split("\n").filter((l) => l.trim());
    for (const path of PAGES) {
      const hosted = await read(HOSTED, path);
      const copy = await read(self, path);
      expect(`${hosted}${copy}`).not.toContain("{{");
      // The copy is the hosted page with its own origin in place of the hosted one,
      // plus lines that link to the hosted version. A note on the hosted page, or a
      // hosted address left anywhere else in the copy, breaks the equality.
      expect(lines(copy).filter((l) => !l.includes(HOSTED))).toEqual(
        lines(hosted.replaceAll(HOSTED, self)),
      );
      // Crawlers read the sitemap; it does not advertise.
      expect(copy.includes(HOSTED)).toBe(path !== "/sitemap.xml");
    }
    expect(await read(self, "/llms.txt")).toContain(`\`${self}/mcp\``);
  });

  it("publishes a skill digest that matches the skill a self-hosted deployment serves", async () => {
    const self = "https://a.example.com";
    const index = await (
      await SELF.fetch(`${self}/.well-known/agent-skills/index.json`)
    ).json<{ skills: { url: string; digest: string }[] }>();
    const skill = await (
      await SELF.fetch(`${self}${index.skills[0].url}`)
    ).arrayBuffer();
    const digest = [
      ...new Uint8Array(await crypto.subtle.digest("SHA-256", skill)),
    ]
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");

    expect(new TextDecoder().decode(skill)).toContain(HOSTED);
    expect(index.skills[0].digest).toBe(`sha256:${digest}`);
  });
});
