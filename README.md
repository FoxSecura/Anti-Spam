# Anti-Spam

[![CI](https://img.shields.io/github/actions/workflow/status/FoxSecura/Anti-Spam/ci.yml?branch=main&style=plastic&logo=githubactions&logoColor=white&label=CI)](https://github.com/FoxSecura/Anti-Spam/actions/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=plastic&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865F2?style=plastic&logo=discord&logoColor=white)](https://discord.js.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D20-339933?style=plastic&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Vitest](https://img.shields.io/badge/tests-Vitest-6E9F18?style=plastic&logo=vitest&logoColor=white)](https://vitest.dev/)
[![Biome](https://img.shields.io/badge/code_style-Biome-60A5FA?style=plastic&logo=biome&logoColor=white)](https://biomejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-3DA639?style=plastic&logo=opensourceinitiative&logoColor=white)](LICENSE)
[![Security](https://img.shields.io/badge/security-policy-181717?style=plastic&logo=githubsecuritylab&logoColor=white)](SECURITY.md)

A modular TypeScript anti-spam toolkit for Discord bots. It provides independent detection modules, configurable presets, and an optional discord.js v14 adapter without forcing moderation actions, persistence, commands, or deployment choices on the consuming project.

## Design goals

- **Installable package:** integrate it into an existing bot instead of running a separate bot.
- **Independent modules:** enable, disable, replace, or configure each protection separately.
- **Framework-agnostic core:** feed normalized message events from any Discord library.
- **Safe by default:** modules report incidents and recommended actions; they do not ban, timeout, or delete messages themselves.
- **Reusable FoxSecura standard:** follows the same `core → modules → presets → adapters` architecture as Anti-Raid.

## Included modules

| Module | Purpose |
| --- | --- |
| `message-burst` | Detects too many messages from one member in a short window. |
| `duplicate-messages` | Detects repeated normalized content. |
| `mention-spam` | Detects excessive user, role, and everyone mentions. |
| `link-spam` | Detects excessive or repeatedly posted URLs. |
| `emoji-spam` | Detects messages containing too many Unicode or custom emoji. |
| `caps-spam` | Detects repeated messages with an excessive uppercase ratio. |

## Installation

```bash
npm install @foxsecura/anti-spam discord.js
```

Until the package is published, install it from a GitHub release, npm tarball, workspace, or Git dependency.

## Discord.js integration

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
    await moderationService.handleSpamIncident(incident);
  },
});

antiSpam.start();
```

Call `antiSpam.stop()` during shutdown or hot reload.

## Select individual modules

```ts
import {
  createDuplicateMessageModule,
  createLinkSpamModule,
  createMessageBurstModule,
} from "@foxsecura/anti-spam/modules";

const modules = [
  createMessageBurstModule({ threshold: 7, windowMs: 4_000 }),
  createDuplicateMessageModule({ threshold: 3, windowMs: 12_000 }),
  createLinkSpamModule({ repeatedLinkThreshold: 2 }),
];
```

## Framework-agnostic core

```ts
import { AntiSpamEngine } from "@foxsecura/anti-spam";

const engine = new AntiSpamEngine({
  modules,
  onIncident: async (incident) => {
    await securityEvents.publish(incident);
  },
});

await engine.handle({
  guildId: "guild-id",
  channelId: "channel-id",
  messageId: "message-id",
  authorId: "member-id",
  content: "hello",
  createdAt: Date.now(),
  isBot: false,
  mentionCount: 0,
  roleMentionCount: 0,
  mentionsEveryone: false,
  attachmentCount: 0,
});
```

## Consumer responsibilities

The consuming project decides how to:

- delete messages or preserve evidence;
- warn, timeout, restrict, or escalate members;
- store incidents and per-guild configuration;
- exempt trusted roles, channels, bots, and webhooks;
- expose commands or dashboard settings;
- coordinate Anti-Spam with Anti-Raid and future FoxSecura packages.

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
