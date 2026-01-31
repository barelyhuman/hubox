export type Fetcher = (url: URL | string, options?: RequestInit) => Promise<Response>;
