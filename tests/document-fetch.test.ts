import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHuaweiJson, NotFoundError } from "../src/lib/fetch";
import { fetchGuidePageData } from "../src/lib/guides";

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
  UpstreamSizeError: class UpstreamSizeError extends Error {},
  UpstreamTimeoutError: class UpstreamTimeoutError extends Error {},
  UpstreamPolicyError: class UpstreamPolicyError extends Error {},
}));

const mockedFetchHuaweiJson = vi.mocked(fetchHuaweiJson);

describe("HarmonyOS document fetch", () => {
  beforeEach(() => {
    mockedFetchHuaweiJson.mockReset();
  });

  it("fetches a public guide by document slug after the gray check", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Preparations for Development",
          content: { content: "<p>Build a HarmonyOS app.</p>" },
        },
      });

    const page = await fetchGuidePageData("start-overview");

    expect(page.title).toBe("Preparations for Development");
    expect(mockedFetchHuaweiJson).toHaveBeenCalledTimes(2);
    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      fileName: "start-overview",
      language: "en",
    });
    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      objectId: "start-overview",
      catalogName: "harmonyos-guides",
      language: "en",
    });
  });

  it("reports an unknown slug as not found rather than a bad gateway", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({ code: 500, message: "fail" });

    await expect(fetchGuidePageData("does-not-exist-xyz")).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it("still reports a payload with no code at all as a contract change", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({ message: "surprise" });

    await expect(fetchGuidePageData("start-overview")).rejects.toThrowError(
      "HarmonyOS document response changed shape",
    );
  });

  it("builds verified requests for valid guide slugs that are not prelisted", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Window Rotation",
          content: { content: "<p>Rotate the window.</p>" },
        },
      });

    const page = await fetchGuidePageData("window-rotation");

    expect(page.title).toBe("Window Rotation");
    expect(mockedFetchHuaweiJson).toHaveBeenCalledTimes(2);
    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      fileName: "window-rotation",
      language: "en",
    });
    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      objectId: "window-rotation",
      catalogName: "harmonyos-guides",
      language: "en",
    });
  });

  it("uses center document requests when the gray check returns center metadata", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          isGrayUser: 1,
          centerPrefix: "hmos",
          level2NodeAlias: "hmos-ui",
          isApi: 0,
          filename: "window-rotation",
        },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { catalogTreeList: [] },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Window Rotation",
          content: { content: "<p>Rotate the window.</p>" },
        },
      });

    const page = await fetchGuidePageData("window-rotation");

    expect(page.title).toBe("Window Rotation");
    expect(mockedFetchHuaweiJson).toHaveBeenCalledTimes(3);
    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      centerPrefix: "hmos",
      level2NodeAlias: "hmos-ui",
      isApi: 0,
      fileName: "window-rotation",
    });
  });

  it("stamps language=cn on the canary contract-file entry (harmonyos-guides/start-overview)", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Preparations for Development",
          content: { content: "<p>Build a HarmonyOS app.</p>" },
        },
      });

    await fetchGuidePageData("start-overview", "cn");

    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      fileName: "start-overview",
      language: "cn",
    });
    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      objectId: "start-overview",
      catalogName: "harmonyos-guides",
      language: "cn",
    });
  });

  it("stamps language=cn on built entries that bypass the contract file", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { isGrayUser: 0 },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Window Rotation",
          content: { content: "<p>Rotate the window.</p>" },
        },
      });

    await fetchGuidePageData("window-rotation", "cn");

    expect(mockedFetchHuaweiJson.mock.calls[0][0].body).toMatchObject({
      catalogName: "harmonyos-guides",
      fileName: "window-rotation",
      language: "cn",
    });
    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      objectId: "window-rotation",
      catalogName: "harmonyos-guides",
      language: "cn",
    });
  });

  it("stamps language=cn on the center-document branch bodies", async () => {
    mockedFetchHuaweiJson
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          isGrayUser: 1,
          centerPrefix: "hmos",
          level2NodeAlias: "hmos-ui",
          isApi: 0,
          filename: "window-rotation",
        },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: { catalogTreeList: [] },
      })
      .mockResolvedValueOnce({
        code: 0,
        message: "success",
        value: {
          status: "4",
          title: "Window Rotation",
          content: { content: "<p>Rotate the window.</p>" },
        },
      });

    await fetchGuidePageData("window-rotation", "cn");

    expect(mockedFetchHuaweiJson.mock.calls[1][0].body).toMatchObject({
      centerPrefix: "hmos",
      level2NodeAlias: "hmos-ui",
      language: "cn",
      fileName: "window-rotation",
    });
    expect(mockedFetchHuaweiJson.mock.calls[2][0].body).toMatchObject({
      centerPrefix: "hmos",
      level2NodeAlias: "hmos-ui",
      language: "cn",
      fileName: "window-rotation",
    });
  });
});
