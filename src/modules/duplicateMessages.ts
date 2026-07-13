import { SlidingWindowStore } from "../core/SlidingWindowStore.js";
import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, matchesScope, scopeKey } from "./helpers.js";
import type { DuplicateMessageOptions } from "./types.js";

interface DuplicateRecord {
  messageId: string;
  normalized: string;
}

export const createDuplicateMessageModule = (
  options: DuplicateMessageOptions = {},
): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 4;
  const windowMs = options.windowMs ?? 15_000;
  const cooldownMs = options.cooldownMs ?? 15_000;
  const minimumLength = options.minimumLength ?? 3;
  const normalizeWhitespace = options.normalizeWhitespace ?? true;
  const ignoreCase = options.ignoreCase ?? true;
  const severity = options.severity ?? "high";
  const actions = options.recommendedActions ?? [
    "delete-recent-messages",
    "warn-member",
    "timeout-member",
  ];

  assertPositive("threshold", threshold);
  assertPositive("windowMs", windowMs);
  assertPositive("minimumLength", minimumLength);

  const records = new SlidingWindowStore<DuplicateRecord>();
  const cooldowns = new Map<string, number>();

  const normalize = (content: string): string => {
    let result = content.trim();
    if (normalizeWhitespace) result = result.replace(/\s+/g, " ");
    if (ignoreCase) result = result.toLocaleLowerCase();
    return result;
  };

  return {
    id: "duplicate-messages",
    name: "Duplicate messages",
    evaluate(event, context) {
      if (!enabled) return null;
      const normalized = normalize(event.content);
      if (normalized.length < minimumLength) return null;
      const key = scopeKey(event);
      records.add(key, event.createdAt, { messageId: event.messageId, normalized });
      const duplicates = records
        .values(key, event.createdAt - windowMs)
        .filter((record) => record.normalized === normalized);
      if (duplicates.length < threshold || (cooldowns.get(key) ?? 0) > event.createdAt) return null;
      cooldowns.set(key, event.createdAt + cooldownMs);
      return context.createIncident({
        moduleId: "duplicate-messages",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: duplicates.map((record) => record.messageId),
        severity,
        detectedAt: event.createdAt,
        summary: `${duplicates.length} duplicate messages were detected.`,
        evidence: { duplicateCount: duplicates.length, normalizedContent: normalized, windowMs },
        recommendedActions: actions,
      });
    },
    reset(scope) {
      records.clear((key) => matchesScope(key, scope));
      for (const key of cooldowns.keys()) if (matchesScope(key, scope)) cooldowns.delete(key);
    },
  };
};
