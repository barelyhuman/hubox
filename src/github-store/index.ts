import { Octokit } from "@octokit/rest";
import { RequestCache } from "./request-cache.js";
import _fetchCached from "fetch-cached";
import type { Fetcher } from "../types.js";

const fetchCached = "default" in _fetchCached ? _fetchCached.default : _fetchCached;

const ttl = 5 * 60 * 1000;
const cacheStore = new RequestCache(ttl);
const request: Fetcher = fetchCached({
  fetch: fetch,
  cache: cacheStore,
});

export type HuBoxNotification = {
  id: string;
  reason: string;
};

export class NotificationManager {
  private okit: Octokit;
  private inProgressNotifications: HuBoxNotification[] = [];

  constructor(
    token: string,
    private maxActive: number,
  ) {
    this.okit = new Octokit({
      auth: token,
      request: {
        fetch: request,
      },
    });
  }

  async getInProgress() {
    if (this.inProgressNotifications.length === this.maxActive) {
      return this.inProgressNotifications;
    }

    await this.refreshInProgressNotifications();

    return this.inProgressNotifications;
  }

  async refreshInProgressNotifications() {
    const data = await this.okit.activity.listNotificationsForAuthenticatedUser(
      {
        all: true,
        page: 0,
        per_page: 10,
      },
    );

    const items = data.data;
    this.inProgressNotifications = this.inProgressNotifications
      .concat(
        items.map((d) => {
          return {
            id: d.id,
            reason: d.reason,
          };
        }),
      )
      .slice(0, this.maxActive);
  }
}
