import * as fs from "fs/promises";
import * as path from "path";

export class RequestCache {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  ttl: number;
  private storageFile: string;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(ttl: number, storagePath: string) {
    this.ttl = ttl;
    this.storageFile = path.join(storagePath, "request-cache.json");
    this.loadFromDisk().catch(console.error);
  }

  private async loadFromDisk(): Promise<void> {
    try {
      const data = await fs.readFile(this.storageFile, "utf-8");
      const parsed = JSON.parse(data);

      // Filter out expired entries
      const now = Date.now();
      Object.entries(parsed).forEach(([key, value]: [string, any]) => {
        if (value.expiry > now) {
          this.cache.set(key, value);
        }
      });
    } catch (error) {
      // File doesn't exist or is invalid, start with empty cache
    }
  }

  private async saveToDisk(): Promise<void> {
    // Debounce saves to avoid excessive writes
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(async () => {
      try {
        const data = Object.fromEntries(this.cache);
        await fs.writeFile(this.storageFile, JSON.stringify(data), "utf-8");
      } catch (error) {
        console.error("Failed to save request cache:", error);
      }
      this.saveTimeout = null;
    }, 1000);
  }

  async get(key: string): Promise<any | undefined> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    // Remove expired entry
    if (cached) {
      this.cache.delete(key);
    }
    return undefined;
  }

  async set(key: string, value: any): Promise<void> {
    const expiry = Date.now() + this.ttl;
    this.cache.set(key, { data: value, expiry });
    await this.saveToDisk();
  }

  async clear(): Promise<void> {
    this.cache.clear();
    try {
      await fs.unlink(this.storageFile);
    } catch (error) {
      // File may not exist
    }
  }
}
