type Fetcher = (url: URL | string, options: RequestInit) => Promise<Response>;

declare module "fetch-cached" {
  type CacheStore = {
    get: (k: string) => Promise<unknown>;
    set: (k: string, value: unknown) => Promise<unknown>;
  };

  type Options = {
    fetch: Fetcher;
    cache: CacheStore;
  };

  export default function (options: Options): Fetcher;
}
