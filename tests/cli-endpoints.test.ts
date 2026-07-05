import { describe, expect, it } from "vitest";
import {
  parseCliArgs,
  resolveFetchEndpoint,
  resolveSearchEndpoint,
} from "../src/lib/cli-endpoints";

describe("CLI endpoint mapping", () => {
  it("maps fetch URLs and prefixed paths to { path, language } (en)", () => {
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
      ),
    ).toEqual({
      path: "harmonyos-guides/start-overview",
      language: "en",
    });
    expect(
      resolveFetchEndpoint("/consumer/en/doc/harmonyos-guides/start-overview"),
    ).toEqual({
      path: "harmonyos-guides/start-overview",
      language: "en",
    });
    expect(
      resolveFetchEndpoint("consumer/en/doc/harmonyos-guides/start-overview"),
    ).toEqual({
      path: "harmonyos-guides/start-overview",
      language: "en",
    });
  });

  it("maps fetch cn URLs to { path, language: 'cn' }", () => {
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview",
      ),
    ).toEqual({
      path: "harmonyos-guides/start-overview",
      language: "cn",
    });
    expect(
      resolveFetchEndpoint("/consumer/cn/doc/harmonyos-guides/start-overview"),
    ).toEqual({
      path: "harmonyos-guides/start-overview",
      language: "cn",
    });
  });

  it("rejects bare-path shorthand inputs", () => {
    expect(() =>
      resolveFetchEndpoint("harmonyos-guides/start-overview"),
    ).toThrow(/must be a full Huawei doc URL/);
    expect(() =>
      resolveFetchEndpoint("/harmonyos-guides/start-overview"),
    ).toThrow(/must be a full Huawei doc URL/);
  });

  it("maps fetch URLs for each of the 5 supported catalogs (en)", () => {
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/en/doc/harmonyos-releases/overview-allversion",
      ),
    ).toEqual({
      path: "harmonyos-releases/overview-allversion",
      language: "en",
    });
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/en/doc/design-guides/design-concepts-0000001795698445",
      ),
    ).toEqual({
      path: "design-guides/design-concepts-0000001795698445",
      language: "en",
    });
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/en/doc/best-practices/bpta-app-architecture-overview",
      ),
    ).toEqual({
      path: "best-practices/bpta-app-architecture-overview",
      language: "en",
    });
  });

  it("maps fetch /consumer/en/doc/ prefixed paths for the releases catalog", () => {
    expect(
      resolveFetchEndpoint(
        "/consumer/en/doc/harmonyos-releases/overview-allversion",
      ),
    ).toEqual({
      path: "harmonyos-releases/overview-allversion",
      language: "en",
    });
  });

  it("resolves search endpoint with default en language", () => {
    expect(resolveSearchEndpoint("UIAbility", "en")).toBe(
      "/search?q=UIAbility&language=en",
    );
    expect(resolveSearchEndpoint("UIAbility", "cn")).toBe(
      "/search?q=UIAbility&language=cn",
    );
  });

  it("parses fetch commands deriving language from the URL prefix", () => {
    expect(
      parseCliArgs([
        "fetch",
        "https://developer.huawei.com/consumer/cn/doc/harmonyos-guides/start-overview",
        "--json",
      ]),
    ).toMatchObject({
      command: "fetch",
      language: "cn",
      json: true,
    });
    expect(
      parseCliArgs([
        "fetch",
        "/consumer/en/doc/harmonyos-guides/start-overview",
        "--json",
      ]),
    ).toMatchObject({
      command: "fetch",
      language: "en",
      json: true,
    });
  });

  it("rejects --language flag on fetch", () => {
    expect(() =>
      parseCliArgs([
        "fetch",
        "/consumer/en/doc/harmonyos-guides/start-overview",
        "--language",
        "cn",
      ]),
    ).toThrow(/not supported for `fetch`/);
  });

  it("rejects bare-path shorthand in parseCliArgs", () => {
    expect(() =>
      parseCliArgs(["fetch", "/harmonyos-guides/start-overview", "--json"]),
    ).toThrow(/must be a full Huawei doc URL/);
  });

  it("parses search commands with --language flag (all 4 forms)", () => {
    expect(
      parseCliArgs(["search", "UIAbility", "--language", "cn"]),
    ).toMatchObject({ command: "search", query: "UIAbility", language: "cn" });
    expect(
      parseCliArgs(["search", "UIAbility", "--language=cn"]),
    ).toMatchObject({ command: "search", query: "UIAbility", language: "cn" });
    expect(parseCliArgs(["search", "UIAbility", "-l", "cn"])).toMatchObject({
      command: "search",
      query: "UIAbility",
      language: "cn",
    });
    expect(parseCliArgs(["search", "UIAbility", "-l=cn"])).toMatchObject({
      command: "search",
      query: "UIAbility",
      language: "cn",
    });
  });

  it("defaults search language to en when no flag is provided", () => {
    expect(parseCliArgs(["search", "UIAbility", "--json"])).toMatchObject({
      command: "search",
      query: "UIAbility",
      language: "en",
      json: true,
    });
  });

  it("errors on invalid --language value", () => {
    expect(() =>
      parseCliArgs(["search", "UIAbility", "--language", "fr"]),
    ).toThrow(/Unsupported language/);
  });

  it("errors when --language has no value", () => {
    expect(() => parseCliArgs(["search", "UIAbility", "--language"])).toThrow(
      /requires a value/,
    );
    expect(() =>
      parseCliArgs(["search", "UIAbility", "--language", "--json"]),
    ).toThrow(/requires a value/);
  });
});
