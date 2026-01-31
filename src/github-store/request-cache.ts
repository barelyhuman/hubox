export class RequestCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  ttl: number;

  constructor(ttl: number) {
    this.ttl = ttl;
  }

  async get(key: string): Promise<any | undefined> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { data: value, expiry });
  }
}
