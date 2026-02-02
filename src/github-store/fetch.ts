/*
 * Returns a fetch function wrapped with cache to be used as normal fetch
 */

export type Fetcher = (
  url: RequestInfo,
  options?: RequestInit,
) => Promise<Response>;

export type CacheStore = {
  get: (k: string) => undefined | Response | Promise<Response | undefined>;
  set: (k: string, value: Response) => void | Promise<void>;
};

export type Options = {
  fetch: Fetcher;
  cache: CacheStore;
};

export function fetchCached(options: Options): Fetcher {
  if (!options || !options.fetch) throw Error("fetch is a required option");
  if (!options || !options.cache) throw Error("cache is a required option");

  const { fetch, cache } = options;

  return async function (url: RequestInfo, init?: RequestInit) {
    const cachedValue = cache.get(url.toString());

    function makeCachedRequest(url: RequestInfo, init?: RequestInit) {
      return fetch(url, init).then(async (response) => {
        if (!response.ok) return response;
        cache.set(url.toString(), response.clone());
        return response;
      });
    }

    if (!cachedValue) {
      return makeCachedRequest(url, init);
    }

    if (cachedValue && cachedValue instanceof Promise) {
      return cachedValue.then((resp) => {
        if (!resp) {
          return makeCachedRequest(url, init);
        }
        if ("clone" in resp) {
          return Promise.resolve(resp.clone());
        }
        return makeCachedRequest(url, init);
      });
    } else {
      if (cachedValue instanceof Response) {
        return Promise.resolve(cachedValue.clone());
      } else {
        const resp = await cachedValue;
        if (resp) {
          return Promise.resolve(resp.clone());
        }
      }
    }
  };
}
