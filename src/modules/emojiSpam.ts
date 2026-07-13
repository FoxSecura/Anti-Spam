import type { AntiSpamModule } from "../core/types.js";
import { assertPositive, countEmoji } from "./helpers.js";
import type { EmojiSpamOptions } from "./types.js";

export const createEmojiSpamModule = (options: EmojiSpamOptions = {}): AntiSpamModule => {
  const enabled = options.enabled ?? true;
  const threshold = options.threshold ?? 12;
  const severity = options.severity ?? "medium";
  const actions = options.recommendedActions ?? ["delete-message", "warn-member"];

  assertPositive("threshold", threshold);

  return {
    id: "emoji-spam",
    name: "Emoji spam",
    evaluate(event, context) {
      if (!enabled) return null;
      const emojiCount = countEmoji(event.content);
      if (emojiCount < threshold) return null;
      return context.createIncident({
        moduleId: "emoji-spam",
        guildId: event.guildId,
        channelId: event.channelId,
        authorId: event.authorId,
        messageIds: [event.messageId],
        severity,
        detectedAt: event.createdAt,
        summary: `${emojiCount} emoji were detected in one message.`,
        evidence: { emojiCount, threshold },
        recommendedActions: actions,
      });
    },
  };
};
