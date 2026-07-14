<div align="center">

# FoxSecura Anti-Spam

**Discord Security Modules · Message Protection**

[![CI](https://img.shields.io/github/actions/workflow/status/FoxSecura/Anti-Spam/ci.yml?branch=main&style=flat-square&logo=githubactions&logoColor=white&label=CI)](https://github.com/FoxSecura/Anti-Spam/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/FoxSecura/Anti-Spam/codeql.yml?branch=main&style=flat-square&logo=github&logoColor=white&label=CodeQL)](https://github.com/FoxSecura/Anti-Spam/actions/workflows/codeql.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=flat-square&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20%2B-5FA04E?style=flat-square&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-22C55E?style=flat-square)](LICENSE)

</div>

`@foxsecura/anti-spam` is the **message-protection category** of the FoxSecura Security Modules suite. It is an installable TypeScript package for existing Discord bots, not a standalone bot.

It detects abusive message patterns and can apply first-party Discord.js responses directly. Enforcement remains opt-in, while the framework-independent core stays detection-only.

## FoxSecura security suite

| Package | Security category | Responsibility |
| --- | --- | --- |
| [`@foxsecura/anti-raid`](https://github.com/FoxSecura/Anti-Raid) | Raid protection | Detect coordinated or abnormal member joins. |
| [`@foxsecura/anti-spam`](https://github.com/FoxSecura/Anti-Spam) | Message protection | Detect abusive message patterns and repeated content. |
| [`@foxsecura/anti-nuke`](https://github.com/FoxSecura/Anti-Nuke) | Guild integrity | Detect destructive administrative actions from audit-log events. |
| [`@foxsecura/automod`](https://github.com/FoxSecura/Automod) | Native AutoMod | Configure and synchronize Discord server-side moderation rules. |

Each repository owns one security category while following the same package structure and integration contract.

## Category scope

Anti-Spam processes normalized message events and correlates abusive content or activity patterns over configurable time windows.

It does not analyze member-join raids, audit-log destruction, or configure Discord native AutoMod rules.

## Included modules

| Module | Detects |
| --- | --- |
| `message-burst` | Too many messages from one member in a short period. |
| `duplicate-messages` | Repeated normalized message content. |
| `mention-spam` | Excessive user, role, or everyone mentions. |
| `link-spam` | Excessive or repeatedly posted URLs. |
| `emoji-spam` | Too many Unicode or custom emoji in a message. |
| `caps-spam` | Repeated messages with an excessive uppercase ratio. |

Every module can be enabled, disabled, configured, replaced, or combined with project-specific modules.

## Shared package contract

- framework-independent core contracts;
- independent and composable modules;
- configurable default presets;
- Discord.js v14 adapter;
- explicit `start()` and `stop()` lifecycle;
- structured, serializable incidents;
- project-level ignore lists;
- no required database, command framework, logger, environment loader, or external policy service;
- optional first-party Discord.js enforcement;
- sanctions disabled until `enforcement.enabled` is explicitly set.

## Architecture

```text
src/
├── core/                 # Framework-independent contracts and orchestration
├── modules/              # Independent modules for this security category
├── presets/              # Ready-to-use module collections
├── adapters/
│   └── discordjs/        # Discord.js v14 integration and enforcement
└── index.ts              # Public package exports
```

## Installation

```bash
npm install @foxsecura/anti-spam discord.js
```

Before npm publication:

```bash
npm install github:FoxSecura/Anti-Spam
```

## Quick start

Enable the guild-members, guild-messages, and message-content intents. Grant **Manage Messages** and **Moderate Members** to the bot.

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { DiscordJsAntiSpam } from "@foxsecura/anti-spam/discordjs";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const antiSpam = new DiscordJsAntiSpam(client, {
  modules: createDefaultAntiSpamPreset(),
  enforcement: {
    enabled: true,
    deleteMessages: true,
    timeout: {
      enabled: true,
      durationMs: 10 * 60 * 1000,
      minimumSeverity: "high",
    },
    warnMember: {
      enabled: true,
    },
    onAction: (result) => {
      console.info("[FoxSecura Anti-Spam]", result);
    },
  },
  onIncident: (incident) => {
    console.warn(incident.summary);
  },
});

antiSpam.start();
await client.login(process.env.DISCORD_TOKEN);
```

Call `antiSpam.stop()` during shutdown, hot reload, or plugin unload.

## Native enforcement

When `enforcement.enabled` is `true`, the Discord.js adapter follows each incident's recommended actions and can:

- delete the current or recent messages referenced by the incident;
- warn the member by direct message;
- timeout high-severity members;
- send an alert to a configured moderation channel.

The adapter protects the guild owner, the bot itself, configured ignored roles, and members above the bot in Discord's role hierarchy. Use `dryRun: true` to inspect planned actions without mutating Discord.

## Framework-independent usage

```ts
import { AntiSpamEngine } from "@foxsecura/anti-spam";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";

const engine = new AntiSpamEngine({
  modules: createDefaultAntiSpamPreset(),
  onIncident: (incident) => console.warn(incident),
});

await engine.handle(normalizedMessageEvent);
```

Projects using another Discord library only need to map their message events to the public core contracts.

## Public entry points

| Entry point | Purpose |
| --- | --- |
| `@foxsecura/anti-spam` | Engine, contracts, modules, and presets. |
| `@foxsecura/anti-spam/modules` | Individual message-protection modules. |
| `@foxsecura/anti-spam/presets` | Ready-to-use module collections. |
| `@foxsecura/anti-spam/discordjs` | Discord.js event mapping and lifecycle. |

## Consuming bot responsibilities

The consuming bot still decides how to:

- configure thresholds, timeout duration, alert channels, and ignored roles;
- store incidents and per-guild configuration;
- coordinate Anti-Spam with Anti-Raid, Anti-Nuke, and Automod;
- grant the Discord permissions required by the enabled actions;
- keep operational logs and review failed or skipped actions.

## Safety model

The framework-independent core never mutates Discord. The Discord.js adapter sanctions only when `enforcement.enabled` is explicitly enabled.

Destructive escalation is limited to the configured actions. The adapter checks ownership, ignored roles, role hierarchy, message deletability, and member moderatability before applying a response. Every result is exposed through `onAction`, and `dryRun` can validate a policy before deployment.

## Development

```bash
npm install
npm run check
npm test
npm run build
npm pack --dry-run
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [FoxSecura package standard](docs/PACKAGE_STANDARD.md)
- [Contributing](CONTRIBUTING.md)
- [Security policy](SECURITY.md)
- [Support](SUPPORT.md)

## License

Released under the [MIT License](LICENSE).
