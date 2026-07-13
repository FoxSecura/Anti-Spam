import type { RecommendedAction, SpamSeverity } from "../core/types.js";

export interface WindowModuleOptions {
  enabled?: boolean;
  threshold?: number;
  windowMs?: number;
  cooldownMs?: number;
  severity?: SpamSeverity;
  recommendedActions?: readonly RecommendedAction[];
}

export interface DuplicateMessageOptions extends WindowModuleOptions {
  minimumLength?: number;
  normalizeWhitespace?: boolean;
  ignoreCase?: boolean;
}

export interface MentionSpamOptions extends WindowModuleOptions {
  perMessageThreshold?: number;
  includeRoleMentions?: boolean;
  countEveryoneMentionAs?: number;
}

export interface LinkSpamOptions extends WindowModuleOptions {
  perMessageThreshold?: number;
  repeatedLinkThreshold?: number;
}

export interface EmojiSpamOptions {
  enabled?: boolean;
  threshold?: number;
  severity?: SpamSeverity;
  recommendedActions?: readonly RecommendedAction[];
}

export interface CapsSpamOptions extends WindowModuleOptions {
  minimumLetters?: number;
  uppercaseRatio?: number;
}
