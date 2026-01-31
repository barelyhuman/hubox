import { describe, it, expect } from "vitest";
import { NotificationManager } from "./index";
import * as os from "os";
import * as path from "path";

describe("NotificationManager", () => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
  const TEST_STORAGE = path.join(os.tmpdir(), "hubox-test");

  it("respects maxActive limit for in-progress notifications", async function () {
    if (!GITHUB_TOKEN) {
      console.log("Skipping test: GITHUB_TOKEN not set");
      return;
    }

    const maxActive = 3;
    const manager = new NotificationManager(
      GITHUB_TOKEN,
      maxActive,
      TEST_STORAGE,
    );
    const notifications = await manager.getInProgress();

    expect(notifications.length).to.be.at.most(maxActive);
  });

  it("marks notifications as read", async function () {
    if (!GITHUB_TOKEN) {
      console.log("Skipping test: GITHUB_TOKEN not set");
      return;
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, TEST_STORAGE);
    const notifications = await manager.getInProgress();

    if (notifications.length === 0) {
      this.skip();
    }

    const notifId = notifications[0].id;

    await manager.markAsRead(notifId);
    const updated = await manager.getAll();
    const updatedNotif = updated.find((n) => n.id === notifId);

    expect(updatedNotif?.isRead).to.be.true;
  });

  it("marks notifications as done", async function () {
    if (!GITHUB_TOKEN) {
      console.log("Skipping test: GITHUB_TOKEN not set");
      return;
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, TEST_STORAGE);
    const notifications = await manager.getInProgress();

    if (notifications.length === 0) {
      this.skip();
    }

    const notifId = notifications[0].id;

    await manager.markAsDone(notifId);
    const updated = await manager.getAll();
    const updatedNotif = updated.find((n) => n.id === notifId);

    expect(updatedNotif?.isDone).to.be.true;
  });

  it("excludes done notifications from in-progress list", async function () {
    if (!GITHUB_TOKEN) {
      console.log("Skipping test: GITHUB_TOKEN not set");
      return;
    }

    const manager = new NotificationManager(GITHUB_TOKEN, 10, TEST_STORAGE);
    const inProgress = await manager.getInProgress();

    if (inProgress.length === 0) {
      this.skip();
    }

    const notifId = inProgress[0].id;
    await manager.markAsDone(notifId);

    const updatedInProgress = await manager.getInProgress();
    const isDoneStillInProgress = updatedInProgress.some(
      (n) => n.id === notifId,
    );

    expect(isDoneStillInProgress).to.be.false;
  });
});
