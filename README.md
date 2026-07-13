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

It detects abusive message patterns and returns structured incidents. The consuming bot remains responsible for message deletion, warnings, timeouts, logging, persistence, permissions, and deployment.

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
- no required database, command framework, logger, or environment loader;
- no automatic sanctions.

## Architecture

```text
src/
├── core/                 # Framework-independent contracts and orchestration
├── modules/              # Independent modules for this security category
├── presets/              # Ready-to-use module collections
├── adapters/
│   └── discordjs/        # Discord.js v14 integration
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

Enable the guild message and message-content intents required by your bot.

```ts
import { Client, GatewayIntentBits } from "discord.js";
import { DiscordJsAntiSpam } from "@foxsecura/anti-spam/discordjs";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const antiSpam = new DiscordJsAntiSpam(client, {
  modules: createDefaultAntiSpamPreset(),
  onIncident: async (incident) => {
    await securityBus.publish(incident);
  },
});

antiSpam.start();
await client.login(process.env.DISCORD_TOKEN);
```

Call `antiSpam.stop()` during shutdown, hot reload, or plugin unload.

## Framework-independent usage

```ts
import { AntiSpamEngine } from "@foxsecura/anti-spam";
import { createDefaultAntiSpamPreset } from "@foxsecura/anti-spam/presets";

const engine = new AntiSpamEngine({
  modules: createDefaultAntiSpamPreset(),
  onIncident: (incident) => securityBus.publish(incident),
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

The consuming bot decides how to:

- delete messages or preserve evidence;
- warn, timeout, restrict, or escalate members;
- store incidents and guild configuration;
- exempt trusted roles, channels, bots, or webhooks;
- coordinate Anti-Spam with Anti-Raid, Anti-Nuke, and Automod;
- apply permissions, approval rules, and operational safeguards.

## Safety model

Anti-Spam only detects and reports. It does not automatically delete messages, warn members, apply timeouts, or change channel permissions.

Recommended actions are advisory. The consuming bot must validate context and apply its own exemptions, escalation policy, cooldowns, and audit logging.

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
