declare module "fetch-cached" {
  type Fetcher = (url: URL | string, options?: RequestInit) => Promise<Response>;

  type CacheStore = {
    get: (k: string) => Promise<string | null | undefined>;
    set: (k: string, value: string) => Promise<void>;
  };

  type Options = {
    fetch: Fetcher;
    cache: CacheStore;
  };

  interface FetchCachedModule {
    (options: Options): Fetcher;
    default: (options: Options) => Fetcher;
  }

  const fetchCached: FetchCachedModule;
  export default fetchCached;
}
