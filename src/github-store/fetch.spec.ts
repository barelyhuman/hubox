import { describe, it , expect } from "vitest";
import { CacheStore, fetchCached } from "./fetch.js";

const createMockFetch = () => {
  const mockFetch = (url: string, options?: RequestInit) => {
    mockFetch.called = true;
    return Promise.resolve(
      new Response(`Response for ${url}`, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      }),
    );
  };
  mockFetch.called = false;
  return mockFetch as any;
};

describe("fetchCached", () => {
  it("should call if there's no cached value", async () => {
    const mockFetch = createMockFetch();
    const cache: CacheStore = {
      get: () => undefined,
      set: () => {
        return;
      },
    };

    const fetcher = fetchCached({ fetch: mockFetch, cache });

    await fetcher("https://example.com/data");

    expect(mockFetch.called).to.be.true;
  });

  it("should return cached value if present", async () => {
    const mockFetch = createMockFetch();
    const cachedResponse = new Response("Cached Response", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
    const cache: CacheStore = {
      get: () => cachedResponse,
      set: () => {
        return;
      },
    };

    const fetcher = fetchCached({ fetch: mockFetch, cache });

    const response = await fetcher("https://example.com/data");
    const text = await response.text();

    expect(text).to.equal("Cached Response");
    expect(mockFetch.called).to.be.false;
  });
});
