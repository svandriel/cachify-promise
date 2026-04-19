# AGENTS

**For AI agents:** This TypeScript library implements promise caching and deduplication. Agents edit `src/` files, run tests with Jest, and validate via npm scripts. Output compiles to `dist/`. Always verify changes against the test suite before committing. Do NOT duplicate usage examples from README—point to it instead.

## Project Overview

| Aspect         | Detail                                           |
| -------------- | ------------------------------------------------ |
| **Language**   | TypeScript (strict mode)                         |
| **Runtime**    | Node.js 10+, browsers (with Promise/Map support) |
| **Source**     | `src/**/*.ts`                                    |
| **Output**     | `dist/` (CommonJS + declarations)                |
| **Tests**      | Jest, colocated as `src/**/*.spec.ts`            |
| **Main Entry** | [src/index.ts](src/index.ts)                     |
| **Core Logic** | [src/cache-promise.ts](src/cache-promise.ts)     |

## Build & Validation Commands

| Command            | Purpose                                      |
| ------------------ | -------------------------------------------- |
| `npm test`         | Run Jest unit tests                          |
| `npm run build`    | Compile TypeScript to `dist/`                |
| `npm run lint`     | Run Prettier & ESLint checks                 |
| `npm run lint:fix` | Auto-fix formatting and lint issues          |
| `npm run verify`   | Tests → lint → clean → build (pre-push hook) |
| `npm run watch`    | Watch-compile TypeScript during development  |
| `npm run clean`    | Remove `dist/` directory                     |

## Core Behavior & Semantics

The library wraps promise-returning functions to provide:

- **Deduplication**: Concurrent calls for the same key share one promise
- **Caching**: Resolved values stored per key with TTL expiration
- **Rejection Handling**: Failed promises are never cached (re-executed on retry)
- **Stale-while-Revalidate**: Optional policy for serving stale data while revalidating
- **Auto-Cleanup**: Periodic removal of expired cache entries
- **Customization**: TTL, storage backend, key generation, logging all configurable

See [README.md](README.md) for usage examples—**do not duplicate these in code comments or tests.**

## Repository Conventions

| Convention        | Details                                                       |
| ----------------- | ------------------------------------------------------------- |
| **TypeScript**    | Strict mode enabled; see [tsconfig.json](tsconfig.json)       |
| **Code Style**    | Prettier + ESLint (xo config, TypeScript rules)               |
| **Pre-commit**    | Runs lint-staged (format & fix changed files)                 |
| **Pre-push**      | Runs `npm run verify` (full validation)                       |
| **Test Location** | Alongside implementation: `src/**/*.spec.ts`                  |
| **Exports**       | Public API only; all exports via [src/index.ts](src/index.ts) |

## Key Files & Responsibilities

| File                                         | Purpose                                             |
| -------------------------------------------- | --------------------------------------------------- |
| [src/index.ts](src/index.ts)                 | Public API exports                                  |
| [src/cache-promise.ts](src/cache-promise.ts) | Main caching logic                                  |
| [src/defaults.ts](src/defaults.ts)           | Default configuration values                        |
| [src/types/](src/types/)                     | Type definitions for options, entries, stats        |
| [src/lib/](src/lib/)                         | Utility functions (execute, cleanup, expiry checks) |
| [src/test-util/](src/test-util/)             | Helpers for testing (delay, deferred, etc.)         |
| [package.json](package.json)                 | Dependencies, scripts, npm metadata                 |
| [tsconfig.json](tsconfig.json)               | Compiler settings (ES5 target, strict)              |

## Editing Guidance

- **Preserve semantics**: Keep deduplication, caching, and rejection-handling behavior intact
- **Update README only for public API changes**: Usage examples stay in [README.md](README.md)
- **Keep dist in sync**: Always run `npm run build` before committing
- **Test first**: Add tests for new behavior; run `npm test` before opening PRs
- **No fabrication**: Only document existing files and commands; verify paths and scripts exist
- **Pointer principle**: Link to files rather than duplicating their content
