import { describe, it } from "mocha";
import { NotificationManager } from "./index";
import { expect } from "chai";

describe("NotificationManager", () => {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
  it("always has maxActive length when `getInProgress` is called", async () => {
    const maxActive = 5;
    const manager = new NotificationManager(GITHUB_TOKEN, maxActive);
    const count = (await manager.getInProgress()).length;
    expect(count).to.be.equal(maxActive);
  });
});
