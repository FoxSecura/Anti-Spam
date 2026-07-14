import type { Client } from "discord.js";
import { describe, expect, it, vi } from "vitest";
import { enforceAntiSpamIncident } from "../src/adapters/discordjs/enforcement.js";
import type { AntiSpamIncident } from "../src/core/types.js";

const incident: AntiSpamIncident = {
  id: "incident-1",
  moduleId: "message-burst",
  guildId: "guild-1",
  channelId: "channel-1",
  authorId: "member-1",
  messageIds: ["message-1", "message-2"],
  severity: "high",
  detectedAt: 1,
  summary: "Message burst detected.",
  evidence: { messageCount: 2 },
  recommendedActions: ["delete-recent-messages", "timeout-member", "notify-moderators"],
};

const client = {} as Client;

describe("enforceAntiSpamIncident", () => {
  it("does nothing until enforcement is explicitly enabled", async () => {
    await expect(enforceAntiSpamIncident(client, incident)).resolves.toEqual([]);
  });

  it("plans native Discord actions without mutating Discord in dry-run mode", async () => {
    const onAction = vi.fn();
    const results = await enforceAntiSpamIncident(client, incident, {
      enabled: true,
      dryRun: true,
      alertChannelId: "alerts",
      onAction,
    });

    expect(results).toEqual([
      { action: "delete-messages", status: "planned", incidentId: "incident-1" },
      { action: "timeout-member", status: "planned", incidentId: "incident-1" },
      { action: "send-alert", status: "planned", incidentId: "incident-1" },
    ]);
    expect(onAction).toHaveBeenCalledTimes(3);
  });
});
