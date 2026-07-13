import type { Message } from "discord.js";
import type { MessageEvent } from "../../core/types.js";

export const toMessageEvent = (message: Message): MessageEvent | null => {
  if (!message.inGuild()) {
    return null;
  }

  return {
    guildId: message.guildId,
    channelId: message.channelId,
    messageId: message.id,
    authorId: message.author.id,
    content: message.content,
    createdAt: message.createdTimestamp,
    isBot: message.author.bot,
    mentionCount: message.mentions.users.size,
    roleMentionCount: message.mentions.roles.size,
    mentionsEveryone: message.mentions.everyone,
    attachmentCount: message.attachments.size,
  };
};
