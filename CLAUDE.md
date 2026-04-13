# golazo — Claude Code Instructions

## Project Overview

Golazo is a gamified football development app built with React, TypeScript, and Vite.

## Architecture

- `src/` — app UI, game mechanics, and state
- `tests/` — test suites and quality checks
- `api/` — backend endpoints for app features
- `infrastructure/` — Azure deployment assets

## Key Rules

- Keep gameplay logic deterministic and easy to test.
- Use i18n keys for user-facing text.
- Maintain responsive behavior on mobile-first layouts.

## Validation

- `npm run lint`
- `npm run build`
- `npm run test`
