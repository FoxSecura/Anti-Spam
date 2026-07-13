# Architecture

Anti-Spam is an installable security library. It intentionally separates detection from enforcement so consuming Discord projects retain control of moderation behavior and infrastructure.

## Layers

```text
src/
├── core/                 # Framework-independent engine and public contracts
├── modules/              # Independent spam detectors
├── presets/              # Curated module collections
├── adapters/
│   └── discordjs/        # discord.js event normalization and lifecycle
└── index.ts              # Framework-independent public API
```

## Core

`AntiSpamEngine` accepts normalized `MessageEvent` objects and evaluates all configured modules. It emits structured incidents through a consumer-owned callback.

The core does not import discord.js and can therefore be used with another Discord library, test harness, queue consumer, or replay system.

## Modules

Each module implements `AntiSpamModule` and owns its detection state. Modules can be configured, disabled, replaced, or composed without changing the engine.

A module must:

1. expose a unique stable ID;
2. evaluate one normalized message event at a time;
3. return either `null` or a structured incident;
4. avoid destructive moderation side effects;
5. support scoped reset when it stores temporal state.

## Presets

Presets are convenience functions that return module arrays. They are not global configuration and consumers remain free to build custom arrays.

## Adapters

Adapters normalize framework-specific events and manage listener lifecycle. The discord.js adapter listens to `messageCreate`, maps it to `MessageEvent`, applies ignore lists, and forwards it to the core engine.

## Safety boundary

Modules recommend actions such as deleting messages, warning, timeout, or moderator notification. The package never executes those actions automatically. This preserves auditability and allows each bot to implement its own permission checks, evidence retention, appeals, and failure handling.
