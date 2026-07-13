import { SlidingWindowStore } from "../core/SlidingWindowStore.js";
import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, matchesScope, scopeKey } from "./helpers.js";
import type { WindowModuleOptions } from "./types.js";

export const createMessageBurstModule = (options: WindowModuleOptions = {}): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 8;
  const windowMs = options.windowMs ?? 5_000;
  const cooldownMs = options.cooldownMs ?? 10_000;
  const severity = options.severity ?? "high";
  const actions = options.recommendedActions ?? [
    "delete-recent-messages",
    "timeout-member",
    "notify-moderators",
  ];

  assertPositive("threshold", threshold);
  assertPositive("windowMs", windowMs);
  assertPositive("cooldownMs", cooldownMs);

  const messages = new SlidingWindowStore<string>();
  const cooldowns = new Map<string, number>();

  return {
    id: "message-burst",
    name: "Message burst",
    evaluate(event, context) {
      if (!enabled) return null;
      const key = scopeKey(event);
      messages.add(key, event.createdAt, event.messageId);
      const ids = messages.values(key, event.createdAt - windowMs);
      if (ids.length < threshold || (cooldowns.get(key) ?? 0) > event.createdAt) return null;
      cooldowns.set(key, event.createdAt + cooldownMs);
      return context.createIncident({
        moduleId: "message-burst",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: ids,
        severity,
        detectedAt: event.createdAt,
        summary: `${ids.length} messages were sent within ${windowMs}ms.`,
        evidence: { messageCount: ids.length, windowMs },
        recommendedActions: actions,
      });
    },
    reset(scope) {
      messages.clear((key) => matchesScope(key, scope));
      for (const key of cooldowns.keys()) if (matchesScope(key, scope)) cooldowns.delete(key);
    },
  };
};
