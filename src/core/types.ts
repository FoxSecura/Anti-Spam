export type SpamSeverity = "low" | "medium" | "high" | "critical";

export type RecommendedAction =
  | "delete-message"
  | "delete-recent-messages"
  | "warn-member"
  | "timeout-member"
  | "restrict-channel"
  | "notify-moderators";

export interface MessageEvent {
  guildId: string;
  channelId: string;
  messageId: string;
  authorId: string;
  content: string;
  createdAt: number;
  isBot: boolean;
  mentionCount: number;
  roleMentionCount: number;
  mentionsEveryone: boolean;
  attachmentCount: number;
}

export interface SpamEvidence {
  readonly [key: string]: string | number | boolean | readonly string[];
}

export interface AntiSpamIncident {
  id: string;
  moduleId: string;
  guildId: string;
  channelId: string;
  authorId: string;
  messageIds: readonly string[];
  severity: SpamSeverity;
  detectedAt: number;
  summary: string;
  evidence: SpamEvidence;
  recommendedActions: readonly RecommendedAction[];
}

export interface ModuleContext {
  createIncident(input: Omit<AntiSpamIncident, "id">): AntiSpamIncident;
}

export interface AntiSpamModule {
  readonly id: string;
  readonly name: string;
  evaluate(event: MessageEvent, context: ModuleContext): AntiSpamIncident | null;
  reset?(scope?: { guildId?: string; channelId?: string; authorId?: string }): void;
}

export interface AntiSpamEngineOptions {
  modules: readonly AntiSpamModule[];
  onIncident: (incident: AntiSpamIncident) => void | Promise<void>;
  shouldIgnore?: (event: MessageEvent) => boolean | Promise<boolean>;
}
