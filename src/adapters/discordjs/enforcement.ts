import type { Client, GuildMember, GuildTextBasedChannel } from "discord.js";
import type { AntiSpamIncident, SpamSeverity } from "../../core/types.js";
import type {
  DiscordJsAntiSpamEnforcementAction,
  DiscordJsAntiSpamEnforcementErrorContext,
  DiscordJsAntiSpamEnforcementOptions,
  DiscordJsAntiSpamEnforcementResult,
} from "./types.js";

const severityOrder: Readonly<Record<SpamSeverity, number>> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

function hasMinimumSeverity(current: SpamSeverity, minimum: SpamSeverity): boolean {
  return severityOrder[current] >= severityOrder[minimum];
}

function reasonFor(incident: AntiSpamIncident, options: DiscordJsAntiSpamEnforcementOptions): string {
  const prefix = options.reasonPrefix ?? "FoxSecura Anti-Spam";
  return `${prefix}: ${incident.moduleId} (${incident.id})`.slice(0, 512);
}

function plannedActions(
  incident: AntiSpamIncident,
  options: DiscordJsAntiSpamEnforcementOptions,
): readonly DiscordJsAntiSpamEnforcementAction[] {
  const recommended = new Set(incident.recommendedActions);
  const actions: DiscordJsAntiSpamEnforcementAction[] = [];

  if (
    (options.deleteMessages ?? true) &&
    (recommended.has("delete-message") || recommended.has("delete-recent-messages"))
  ) {
    actions.push("delete-messages");
  }

  if ((options.warnMember?.enabled ?? false) && recommended.has("warn-member")) {
    actions.push("warn-member");
  }

  if (
    (options.timeout?.enabled ?? true) &&
    recommended.has("timeout-member") &&
    hasMinimumSeverity(incident.severity, options.timeout?.minimumSeverity ?? "high")
  ) {
    actions.push("timeout-member");
  }

  if (options.alertChannelId && recommended.has("notify-moderators")) {
    actions.push("send-alert");
  }

  return actions;
}

async function resolveMember(
  client: Client,
  incident: AntiSpamIncident,
): Promise<GuildMember | null> {
  const guild = client.guilds.cache.get(incident.guildId) ?? (await client.guilds.fetch(incident.guildId));
  return guild.members.cache.get(incident.authorId) ?? (await guild.members.fetch(incident.authorId).catch(() => null));
}

function isProtectedMember(
  client: Client,
  member: GuildMember,
  options: DiscordJsAntiSpamEnforcementOptions,
): boolean {
  if (member.id === member.guild.ownerId) return true;
  if (member.id === client.user?.id) return true;
  return (options.ignoredRoleIds ?? []).some((roleId) => member.roles.cache.has(roleId));
}

async function report(
  result: DiscordJsAntiSpamEnforcementResult,
  options: DiscordJsAntiSpamEnforcementOptions,
  results: DiscordJsAntiSpamEnforcementResult[],
): Promise<void> {
  results.push(result);
  await options.onAction?.(result);
}

async function reportError(
  error: unknown,
  context: DiscordJsAntiSpamEnforcementErrorContext,
  options: DiscordJsAntiSpamEnforcementOptions,
  results: DiscordJsAntiSpamEnforcementResult[],
): Promise<void> {
  const result: DiscordJsAntiSpamEnforcementResult = {
    action: context.action,
    status: "failed",
    incidentId: context.incident.id,
    detail: error instanceof Error ? error.message : String(error),
  };
  results.push(result);
  await options.onError?.(error, context);
  await options.onAction?.(result);
}

export async function enforceAntiSpamIncident(
  client: Client,
  incident: AntiSpamIncident,
  options: DiscordJsAntiSpamEnforcementOptions = {},
): Promise<readonly DiscordJsAntiSpamEnforcementResult[]> {
  if (options.enabled !== true) return [];

  const actions = plannedActions(incident, options);
  if (actions.length === 0) return [];

  if (options.dryRun === true) {
    const results = actions.map<DiscordJsAntiSpamEnforcementResult>((action) => ({
      action,
      status: "planned",
      incidentId: incident.id,
    }));
    for (const result of results) await options.onAction?.(result);
    return results;
  }

  const results: DiscordJsAntiSpamEnforcementResult[] = [];
  const guild = client.guilds.cache.get(incident.guildId) ?? (await client.guilds.fetch(incident.guildId));
  let member: GuildMember | null | undefined;

  for (const action of actions) {
    try {
      if (action === "delete-messages") {
        const channel = await guild.channels.fetch(incident.channelId);
        if (!channel?.isTextBased()) {
          await report(
            {
              action,
              status: "skipped",
              incidentId: incident.id,
              detail: "Incident channel is unavailable or is not text based.",
            },
            options,
            results,
          );
          continue;
        }

        const textChannel = channel as GuildTextBasedChannel;
        let deleted = 0;
        for (const messageId of incident.messageIds) {
          const message = await textChannel.messages.fetch(messageId).catch(() => null);
          if (!message?.deletable) continue;
          await message.delete();
          deleted += 1;
        }

        await report(
          {
            action,
            status: deleted > 0 ? "applied" : "skipped",
            incidentId: incident.id,
            detail: `${deleted} message(s) deleted.`,
          },
          options,
          results,
        );
        continue;
      }

      member ??= await resolveMember(client, incident);
      if (!member) {
        await report(
          {
            action,
            status: "skipped",
            incidentId: incident.id,
            detail: "Member is no longer available in the guild.",
          },
          options,
          results,
        );
        continue;
      }

      if (isProtectedMember(client, member, options)) {
        await report(
          {
            action,
            status: "skipped",
            incidentId: incident.id,
            detail: "Member is protected by owner, self, or role safeguards.",
          },
          options,
          results,
        );
        continue;
      }

      if (action === "warn-member") {
        const warning =
          options.warnMember?.message ??
          `Your activity in ${guild.name} triggered the FoxSecura anti-spam protection.`;
        await member.send(warning);
        await report({ action, status: "applied", incidentId: incident.id }, options, results);
        continue;
      }

      if (action === "timeout-member") {
        if (!member.moderatable) {
          await report(
            {
              action,
              status: "skipped",
              incidentId: incident.id,
              detail: "Discord role hierarchy prevents this timeout.",
            },
            options,
            results,
          );
          continue;
        }

        const durationMs = Math.min(
          Math.max(options.timeout?.durationMs ?? 10 * 60 * 1000, 1_000),
          MAX_TIMEOUT_MS,
        );
        await member.timeout(durationMs, reasonFor(incident, options));
        await report(
          {
            action,
            status: "applied",
            incidentId: incident.id,
            detail: `Timeout applied for ${durationMs}ms.`,
          },
          options,
          results,
        );
        continue;
      }

      const alertChannel = await guild.channels.fetch(options.alertChannelId ?? "");
      if (!alertChannel?.isTextBased()) {
        await report(
          {
            action,
            status: "skipped",
            incidentId: incident.id,
            detail: "Alert channel is unavailable or is not text based.",
          },
          options,
          results,
        );
        continue;
      }

      await (alertChannel as GuildTextBasedChannel).send({
        content: [
          `**FoxSecura Anti-Spam** — ${incident.severity.toUpperCase()}`,
          incident.summary,
          `Member: <@${incident.authorId}>`,
          `Module: \`${incident.moduleId}\``,
          `Incident: \`${incident.id}\``,
        ].join("\n"),
        allowedMentions: { users: [] },
      });
      await report({ action, status: "applied", incidentId: incident.id }, options, results);
    } catch (error) {
      await reportError(error, { action, incident }, options, results);
    }
  }

  return results;
}
