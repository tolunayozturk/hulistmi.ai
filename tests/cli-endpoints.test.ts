import { describe, expect, it } from "vitest";
import {
  parseCliArgs,
  resolveFetchEndpoint,
  resolveSearchEndpoint,
} from "../src/lib/cli-endpoints";

describe("CLI endpoint mapping", () => {
  it("maps fetch and search inputs", () => {
    expect(
      resolveFetchEndpoint(
        "https://developer.huawei.com/consumer/en/doc/harmonyos-guides/start-overview",
      ),
    ).toBe("/consumer/en/doc/harmonyos-guides/start-overview");
    expect(resolveFetchEndpoint("harmonyos-guides/start-overview")).toBe(
      "/consumer/en/doc/harmonyos-guides/start-overview",
    );
    expect(
      resolveFetchEndpoint(
        "/consumer/en/doc/harmonyos-guides/start-overview",
      ),
    ).toBe("/consumer/en/doc/harmonyos-guides/start-overview");
    expect(resolveSearchEndpoint("UIAbility")).toBe("/search?q=UIAbility");
  });

  it("parses commands", () => {
    expect(
      parseCliArgs(["fetch", "/harmonyos-guides/start-overview", "--json"]),
    ).toMatchObject({ command: "fetch", json: true });
    expect(parseCliArgs(["search", "UIAbility", "--json"])).toMatchObject({
      command: "search",
      query: "UIAbility",
      json: true,
    });
  });
});
