import { createModuleContext } from "./incident.js";
import type { AntiSpamEngineOptions, AntiSpamIncident, MessageEvent } from "./types.js";

export class AntiSpamEngine {
  readonly #options: AntiSpamEngineOptions;
  readonly #context = createModuleContext();

  constructor(options: AntiSpamEngineOptions) {
    if (options.modules.length === 0) {
      throw new Error("AntiSpamEngine requires at least one module.");
    }

    const ids = new Set<string>();
    for (const module of options.modules) {
      if (ids.has(module.id)) {
        throw new Error(`Duplicate anti-spam module id: ${module.id}`);
      }
      ids.add(module.id);
    }

    this.#options = options;
  }

  async handle(event: MessageEvent): Promise<readonly AntiSpamIncident[]> {
    if (await this.#options.shouldIgnore?.(event)) {
      return [];
    }

    const incidents: AntiSpamIncident[] = [];
    for (const module of this.#options.modules) {
      const incident = module.evaluate(event, this.#context);
      if (!incident) {
        continue;
      }

      incidents.push(incident);
      await this.#options.onIncident(incident);
    }

    return incidents;
  }

  reset(scope?: { guildId?: string; channelId?: string; authorId?: string }): void {
    for (const module of this.#options.modules) {
      module.reset?.(scope);
    }
  }
}
