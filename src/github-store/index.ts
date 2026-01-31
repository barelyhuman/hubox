import { Octokit } from "@octokit/rest";
import fetchCached from "fetch-cached";

const cacheStore = new Map();

const request: Fetcher = fetchCached({
  fetch: fetch,
  cache: {
    get: async (k) => cacheStore.get(k),
    set: async (k, v) => cacheStore.set(k, v),
  },
});

type HuBoxNotification = {
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
