import { SlidingWindowStore } from "../core/SlidingWindowStore.js";
import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, matchesScope, scopeKey } from "./helpers.js";
import type { MentionSpamOptions } from "./types.js";

interface MentionRecord {
  messageId: string;
  mentions: number;
}

export const createMentionSpamModule = (options: MentionSpamOptions = {}): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 12;
  const perMessageThreshold = options.perMessageThreshold ?? 7;
  const windowMs = options.windowMs ?? 10_000;
  const cooldownMs = options.cooldownMs ?? 15_000;
  const includeRoleMentions = options.includeRoleMentions ?? true;
  const everyoneWeight = options.countEveryoneMentionAs ?? 5;
  const severity = options.severity ?? "high";
  const actions = options.recommendedActions ?? [
    "delete-message",
    "timeout-member",
    "notify-moderators",
  ];

  assertPositive("threshold", threshold);
  assertPositive("perMessageThreshold", perMessageThreshold);
  assertPositive("windowMs", windowMs);

  const records = new SlidingWindowStore<MentionRecord>();
  const cooldowns = new Map<string, number>();

  return {
    id: "mention-spam",
    name: "Mention spam",
    evaluate(event, context) {
      if (!enabled) return null;
      const mentions =
        event.mentionCount +
        (includeRoleMentions ? event.roleMentionCount : 0) +
        (event.mentionsEveryone ? everyoneWeight : 0);
      if (mentions === 0) return null;
      const key = scopeKey(event);
      records.add(key, event.createdAt, { messageId: event.messageId, mentions });
      const active = records.values(key, event.createdAt - windowMs);
      const total = active.reduce((sum, record) => sum + record.mentions, 0);
      if (
        (mentions < perMessageThreshold && total < threshold) ||
        (cooldowns.get(key) ?? 0) > event.createdAt
      ) {
        return null;
      }
      cooldowns.set(key, event.createdAt + cooldownMs);
      return context.createIncident({
        moduleId: "mention-spam",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: active.map((record) => record.messageId),
        severity,
        detectedAt: event.createdAt,
        summary: `${total} weighted mentions were detected within ${windowMs}ms.`,
        evidence: { currentMessageMentions: mentions, totalMentions: total, windowMs },
        recommendedActions: actions,
      });
    },
    reset(scope) {
      records.clear((key) => matchesScope(key, scope));
      for (const key of cooldowns.keys()) if (matchesScope(key, scope)) cooldowns.delete(key);
    },
  };
};
