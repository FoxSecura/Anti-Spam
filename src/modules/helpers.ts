import type { MessageEvent } from "../core/types.js";

export const scopeKey = (event: MessageEvent): string =>
  `${event.guildId}:${event.channelId}:${event.authorId}`;

export const matchesScope = (
  key: string,
  scope?: { guildId?: string; channelId?: string; authorId?: string },
): boolean => {
  if (!scope) {
    return true;
  }

  const [guildId, channelId, authorId] = key.split(":");
  return (
    (!scope.guildId || scope.guildId === guildId) &&
    (!scope.channelId || scope.channelId === channelId) &&
    (!scope.authorId || scope.authorId === authorId)
  );
};

export const assertPositive = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${name} must be a positive number.`);
  }
};

export const assertRatio = (name: string, value: number): void => {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new Error(`${name} must be between 0 and 1.`);
  }
};

export const extractUrls = (content: string): readonly string[] =>
  content.match(/https?:\/\/[^\s<>()]+/giu) ?? [];

export const countEmoji = (content: string): number => {
  const customEmoji = content.match(/<a?:\w{2,32}:\d{17,20}>/g) ?? [];
  const unicodeEmoji = content.match(/\p{Extended_Pictographic}/gu) ?? [];
  return customEmoji.length + unicodeEmoji.length;
};
