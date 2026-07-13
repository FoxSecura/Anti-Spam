import { type Client, Events, type Message } from "discord.js";
import { AntiSpamEngine } from "../../core/AntiSpamEngine.js";
import type { MessageEvent } from "../../core/types.js";
import { toMessageEvent } from "./toMessageEvent.js";
import type { DiscordJsAntiSpamOptions } from "./types.js";

export class DiscordJsAntiSpam {
  readonly #engine: AntiSpamEngine;
  #started = false;

  constructor(
    readonly client: Client,
    options: DiscordJsAntiSpamOptions,
  ) {
    const ignoredGuildIds = new Set(options.ignoredGuildIds ?? []);
    const ignoredChannelIds = new Set(options.ignoredChannelIds ?? []);
    const ignoredAuthorIds = new Set(options.ignoredAuthorIds ?? []);

    this.#engine = new AntiSpamEngine({
      modules: options.modules,
      onIncident: options.onIncident,
      shouldIgnore: async (event) => {
        if ((options.ignoreBots ?? true) && event.isBot) return true;
        if (ignoredGuildIds.has(event.guildId)) return true;
        if (ignoredChannelIds.has(event.channelId)) return true;
        if (ignoredAuthorIds.has(event.authorId)) return true;
        return (await options.shouldIgnore?.(event)) ?? false;
      },
    });
  }

  start(): void {
    if (this.#started) return;
    this.client.on(Events.MessageCreate, this.#onMessageCreate);
    this.#started = true;
  }

  stop(): void {
    if (!this.#started) return;
    this.client.off(Events.MessageCreate, this.#onMessageCreate);
    this.#started = false;
  }

  async handle(event: MessageEvent): Promise<void> {
    await this.#engine.handle(event);
  }

  readonly #onMessageCreate = async (message: Message): Promise<void> => {
    const event = toMessageEvent(message);
    if (event) await this.#engine.handle(event);
  };
}
