import type { Client } from "discord.js";
import type { AntiSpamEngineOptions, MessageEvent } from "../../core/types.js";

export interface DiscordJsAntiSpamOptions extends Omit<AntiSpamEngineOptions, "shouldIgnore"> {
  ignoreBots?: boolean;
  ignoredGuildIds?: readonly string[];
  ignoredChannelIds?: readonly string[];
  ignoredAuthorIds?: readonly string[];
  shouldIgnore?: AntiSpamEngineOptions["shouldIgnore"];
}

export interface DiscordJsAntiSpamAdapter {
  readonly client: Client;
  start(): void;
  stop(): void;
  handle(event: MessageEvent): Promise<void>;
}
