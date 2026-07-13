import { SlidingWindowStore } from "../core/SlidingWindowStore.js";
import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, extractUrls, matchesScope, scopeKey } from "./helpers.js";
import type { LinkSpamOptions } from "./types.js";

interface LinkRecord {
  messageId: string;
  urls: readonly string[];
}

export const createLinkSpamModule = (options: LinkSpamOptions = {}): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 6;
  const perMessageThreshold = options.perMessageThreshold ?? 4;
  const repeatedLinkThreshold = options.repeatedLinkThreshold ?? 3;
  const windowMs = options.windowMs ?? 20_000;
  const cooldownMs = options.cooldownMs ?? 20_000;
  const severity = options.severity ?? "high";
  const actions = options.recommendedActions ?? ["delete-recent-messages", "timeout-member"];

  assertPositive("threshold", threshold);
  assertPositive("perMessageThreshold", perMessageThreshold);
  assertPositive("repeatedLinkThreshold", repeatedLinkThreshold);

  const records = new SlidingWindowStore<LinkRecord>();
  const cooldowns = new Map<string, number>();

  return {
    id: "link-spam",
    name: "Link spam",
    evaluate(event, context) {
      if (!enabled) return null;
      const urls = extractUrls(event.content).map((url) => url.toLocaleLowerCase());
      if (urls.length === 0) return null;
      const key = scopeKey(event);
      records.add(key, event.createdAt, { messageId: event.messageId, urls });
      const active = records.values(key, event.createdAt - windowMs);
      const allUrls = active.flatMap((record) => record.urls);
      const frequency = new Map<string, number>();
      for (const url of allUrls) frequency.set(url, (frequency.get(url) ?? 0) + 1);
      const maximumRepeat = Math.max(...frequency.values());
      if (
        (urls.length < perMessageThreshold &&
          allUrls.length < threshold &&
          maximumRepeat < repeatedLinkThreshold) ||
        (cooldowns.get(key) ?? 0) > event.createdAt
      ) {
        return null;
      }
      cooldowns.set(key, event.createdAt + cooldownMs);
      return context.createIncident({
        moduleId: "link-spam",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: active.map((record) => record.messageId),
        severity,
        detectedAt: event.createdAt,
        summary: `${allUrls.length} links were detected within ${windowMs}ms.`,
        evidence: {
          linkCount: allUrls.length,
          maximumRepeat,
          windowMs,
          urls: [...frequency.keys()],
        },
        recommendedActions: actions,
      });
    },
    reset(scope) {
      records.clear((key) => matchesScope(key, scope));
      for (const key of cooldowns.keys()) if (matchesScope(key, scope)) cooldowns.delete(key);
    },
  };
};
