import { beforeEach, describe, expect, it } from "vitest";
import {
  configurePublicOrigin,
  DEFAULT_PUBLIC_ORIGIN,
  publicOrigin,
} from "../src/lib/origin";

describe("public origin", () => {
  beforeEach(() => {
    configurePublicOrigin(DEFAULT_PUBLIC_ORIGIN);
  });

  it("defaults to the published deployment", () => {
    expect(publicOrigin()).toBe(DEFAULT_PUBLIC_ORIGIN);
  });

  it("takes the configured origin and drops any path", () => {
    configurePublicOrigin("https://docs.example.com/ignored");
    expect(publicOrigin()).toBe("https://docs.example.com");
  });

  it("ignores empty and malformed values rather than advertising them", () => {
    configurePublicOrigin("https://docs.example.com");
    configurePublicOrigin("");
    configurePublicOrigin(undefined);
    configurePublicOrigin("not a url");
    expect(publicOrigin()).toBe("https://docs.example.com");
  });
});
