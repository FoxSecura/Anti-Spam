# FoxSecura Package Standard

FoxSecura security repositories should expose compatible installable packages rather than complete standalone bots.

## Required structure

```text
src/
├── core/
├── modules/
├── presets/
├── adapters/
└── index.ts
```

## Required principles

1. The core must not depend on Discord framework classes.
2. Protections must be independent modules with stable IDs.
3. Presets must remain optional convenience layers.
4. Framework adapters must provide explicit lifecycle methods such as `start()` and `stop()`.
5. Detection must remain separate from destructive enforcement.
6. The public API must use structured events and incidents.
7. Packages must support strict TypeScript, automated tests, CI, CodeQL, and dependency auditing.

## Shared lifecycle

Projects should be able to compose packages consistently:

```ts
antiRaid.start();
antiSpam.start();
antiNuke.start();
```

## Consumer-owned services

The consuming application owns:

- Discord client creation and authentication;
- database and cache selection;
- per-guild configuration;
- logs, metrics, and dashboards;
- permissions and moderation actions;
- deployment, process lifecycle, and incident escalation.

## Naming

- npm package: `@foxsecura/<security-domain>`
- module IDs: stable lowercase kebab-case
- adapter exports: explicit framework suffixes or subpath exports
- incidents: domain-specific, serializable objects
