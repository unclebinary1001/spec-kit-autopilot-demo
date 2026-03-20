# Project Constitution

## Core Principles

1. **Simplicity First**: Prefer the simplest solution that fully satisfies the requirement. Avoid over-engineering, premature abstractions, and features not explicitly requested.

2. **Test-First**: Write tests before implementation. Every user-facing behaviour must have a corresponding automated test. Tests serve as executable documentation.

3. **Library-First**: Leverage well-maintained, community-standard libraries rather than writing custom infrastructure. Evaluate libraries against project constraints before adopting them (see research artifacts).

4. **Type Safety**: Use TypeScript throughout. No `any` types except in justified, narrowly scoped escape hatches documented with a comment.

5. **Observability**: Every API surface must return structured errors. Backend services must log requests and errors in a machine-readable format.

## Technology Constraints

| Concern | Choice | Rationale |
|---|---|---|
| Frontend framework | Next.js (App Router) | React-based, SSR/SSG support, file-based routing |
| Backend framework | Hono | Lightweight, edge-compatible, standards-based Web APIs |
| Language | TypeScript (strict mode) | Type safety, ecosystem alignment |
| Runtime | Node.js ≥ 20 | LTS, native fetch, compatible with both Next.js and Hono |
| Package manager | npm | Ubiquitous, no special tooling required |
| Database | SQLite (via better-sqlite3) for dev; pluggable for prod | Zero-config for demo/development |
| Testing | Vitest (backend unit/integration), Playwright (E2E) | Fast, native ESM, TypeScript-native |
| Deployment target | Local development / Vercel-compatible | Serverless-ready Hono adapter if deployed |

## Quality Gates

- **Code Review**: All changes require at least one approval from a codeowner before merge.
- **Tests**: All tests must pass on CI before merge. Coverage must not regress below 80% on business logic.
- **Type Check**: `tsc --noEmit` must pass with zero errors.
- **Lint**: ESLint with `@typescript-eslint/recommended` must report zero errors.
- **Documentation**: Every public API endpoint must be described in `contracts/api.yaml`. Every user story must have a corresponding entry in `specs/`.

## Governance

- **Amendment process**: Any team member may propose a change to this constitution via pull request. Changes require discussion and at least two approvals.
- **Enforcement**: CI pipelines enforce quality gates automatically. Reviewers are responsible for enforcing principles not covered by automated checks.
- **Conflict resolution**: When a principle conflicts with a deadline, the conflict must be documented in the relevant spec under a "Complexity Tracking" section with explicit justification.
- **Version**: This constitution is version-controlled alongside the codebase. The git history is the source of truth.
