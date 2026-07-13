import type { MessageEvent } from "../src/core/types.js";

export const messageEvent = (overrides: Partial<MessageEvent> = {}): MessageEvent => ({
  guildId: "guild-1",
  channelId: "channel-1",
  messageId: "message-1",
  authorId: "author-1",
  content: "hello",
  createdAt: 1_000,
  isBot: false,
  mentionCount: 0,
  roleMentionCount: 0,
  mentionsEveryone: false,
  attachmentCount: 0,
  ...overrides,
});
