import { SlidingWindowStore } from "../core/SlidingWindowStore.js";
import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, assertRatio, matchesScope, scopeKey } from "./helpers.js";
import type { CapsSpamOptions } from "./types.js";

export const createCapsSpamModule = (options: CapsSpamOptions = {}): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 3;
  const windowMs = options.windowMs ?? 20_000;
  const cooldownMs = options.cooldownMs ?? 20_000;
  const minimumLetters = options.minimumLetters ?? 12;
  const uppercaseRatio = options.uppercaseRatio ?? 0.75;
  const severity = options.severity ?? "medium";
  const actions = options.recommendedActions ?? ["delete-recent-messages", "warn-member"];

  assertPositive("threshold", threshold);
  assertPositive("minimumLetters", minimumLetters);
  assertRatio("uppercaseRatio", uppercaseRatio);

  const messages = new SlidingWindowStore<string>();
  const cooldowns = new Map<string, number>();

  return {
    id: "caps-spam",
    name: "Caps spam",
    evaluate(event, context) {
      if (!enabled) return null;
      const letters = [...event.content].filter((character) => /\p{L}/u.test(character));
      if (letters.length < minimumLetters) return null;
      const uppercase = letters.filter(
        (character) => character === character.toLocaleUpperCase(),
      ).length;
      const ratio = uppercase / letters.length;
      if (ratio < uppercaseRatio) return null;
      const key = scopeKey(event);
      messages.add(key, event.createdAt, event.messageId);
      const ids = messages.values(key, event.createdAt - windowMs);
      if (ids.length < threshold || (cooldowns.get(key) ?? 0) > event.createdAt) return null;
      cooldowns.set(key, event.createdAt + cooldownMs);
      return context.createIncident({
        moduleId: "caps-spam",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: ids,
        severity,
        detectedAt: event.createdAt,
        summary: `${ids.length} mostly-uppercase messages were detected.`,
        evidence: { uppercaseRatio: ratio, messageCount: ids.length, windowMs },
        recommendedActions: actions,
      });
    },
    reset(scope) {
      messages.clear((key) => matchesScope(key, scope));
      for (const key of cooldowns.keys()) if (matchesScope(key, scope)) cooldowns.delete(key);
    },
  };
};
