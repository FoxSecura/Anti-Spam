import type { AntiSpamModule } from "../core/types.js";
import {
  createCapsSpamModule,
  createDuplicateMessageModule,
  createEmojiSpamModule,
  createLinkSpamModule,
  createMentionSpamModule,
  createMessageBurstModule,
} from "../modules/index.js";

export interface DefaultPresetOptions {
  disabledModules?: readonly string[];
}

export const createDefaultAntiSpamPreset = (
  options: DefaultPresetOptions = {},
): readonly AntiSpamModule[] => {
  const disabled = new Set(options.disabledModules ?? []);
  return [
    createMessageBurstModule(),
    createDuplicateMessageModule(),
    createMentionSpamModule(),
    createLinkSpamModule(),
    createEmojiSpamModule(),
    createCapsSpamModule(),
  ].filter((module) => !disabled.has(module.id));
};
