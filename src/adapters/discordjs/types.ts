import type { Client } from "discord.js";
import type {
  AntiSpamEngineOptions,
  AntiSpamIncident,
  MessageEvent,
  SpamSeverity,
} from "../../core/types.js";

export type DiscordJsAntiSpamEnforcementAction =
  | "delete-messages"
  | "warn-member"
  | "timeout-member"
  | "send-alert";

export type DiscordJsAntiSpamEnforcementStatus = "planned" | "applied" | "skipped" | "failed";

export interface DiscordJsAntiSpamEnforcementResult {
  readonly action: DiscordJsAntiSpamEnforcementAction;
  readonly status: DiscordJsAntiSpamEnforcementStatus;
  readonly incidentId: string;
  readonly detail?: string | undefined;
}

export interface DiscordJsAntiSpamEnforcementErrorContext {
  readonly action: DiscordJsAntiSpamEnforcementAction;
  readonly incident: AntiSpamIncident;
}

export interface DiscordJsAntiSpamEnforcementOptions {
  readonly enabled?: boolean | undefined;
  readonly dryRun?: boolean | undefined;
  readonly deleteMessages?: boolean | undefined;
  readonly timeout?:
    | {
        readonly enabled?: boolean | undefined;
        readonly durationMs?: number | undefined;
        readonly minimumSeverity?: SpamSeverity | undefined;
      }
    | undefined;
  readonly warnMember?:
    | {
        readonly enabled?: boolean | undefined;
        readonly message?: string | undefined;
      }
    | undefined;
  readonly alertChannelId?: string | undefined;
  readonly ignoredRoleIds?: readonly string[] | undefined;
  readonly reasonPrefix?: string | undefined;
  readonly onAction?:
    | ((result: DiscordJsAntiSpamEnforcementResult) => void | Promise<void>)
    | undefined;
  readonly onError?:
    | ((
        error: unknown,
        context: DiscordJsAntiSpamEnforcementErrorContext,
      ) => void | Promise<void>)
    | undefined;
}

export interface DiscordJsAntiSpamOptions
  extends Omit<AntiSpamEngineOptions, "shouldIgnore" | "onIncident"> {
  readonly onIncident?: AntiSpamEngineOptions["onIncident"] | undefined;
  readonly enforcement?: DiscordJsAntiSpamEnforcementOptions | undefined;
  readonly ignoreBots?: boolean | undefined;
  readonly ignoredGuildIds?: readonly string[] | undefined;
  readonly ignoredChannelIds?: readonly string[] | undefined;
  readonly ignoredAuthorIds?: readonly string[] | undefined;
  readonly shouldIgnore?: AntiSpamEngineOptions["shouldIgnore"] | undefined;
}

export interface DiscordJsAntiSpamAdapter {
  readonly client: Client;
  start(): void;
  stop(): void;
  handle(event: MessageEvent): Promise<readonly AntiSpamIncident[]>;
}
