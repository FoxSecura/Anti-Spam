# Contributing

Thank you for helping improve FoxSecura Anti-Spam.

## Before opening a change

- Search existing issues and pull requests.
- Keep each change focused on one problem.
- Preserve the detection/enforcement boundary.
- Add or update tests for behavior changes.
- Avoid breaking module IDs and public contracts without a migration plan.

## Development setup

```bash
npm install
npm run check
npm test
npm run build
npm pack --dry-run
```

## Adding a module

A new module should:

1. implement `AntiSpamModule`;
2. use a stable kebab-case ID;
3. validate configuration values;
4. avoid direct Discord moderation actions;
5. return structured evidence and recommended actions;
6. clear scoped state through `reset` when applicable;
7. include unit tests and README documentation.

## Pull requests

Describe the problem, solution, public API impact, validation performed, and security considerations. Keep commits intentional and avoid generated build output.
