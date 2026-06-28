import { beforeEach, describe, expect, it, vi } from "vitest";
import { fetchHuaweiJson } from "../src/lib/fetch";
import { fetchGuidePageData } from "../src/lib/guides";

vi.mock("../src/lib/fetch", () => ({
  fetchHuaweiJson: vi.fn(),
  NotFoundError: class NotFoundError extends Error {},
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
});
