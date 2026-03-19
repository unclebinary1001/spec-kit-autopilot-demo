# Spec Kit Autopilot Demo Constitution

## Core Principles

### I. Simplicity First
Every design decision defaults to the simplest solution that satisfies requirements. Complexity must be explicitly justified. Avoid over-engineering, premature abstraction, and unnecessary dependencies. YAGNI (You Aren't Gonna Need It) is the default stance.

### II. Library-First & Ecosystem Alignment
Prefer well-maintained, idiomatic libraries and frameworks over custom implementations. Use the full capability of the chosen runtime ecosystem. Dependencies must have clear purpose and minimal overlap.

### III. Test-First (NON-NEGOTIABLE)
Tests are written before implementation. A feature is not complete until tests pass. The Red-Green-Refactor cycle is strictly enforced. Every user story must have at least one independently runnable test that validates it delivers value.

### IV. Observability
All services must emit structured logs. Errors must be surfaced with actionable context. HTTP APIs must return meaningful status codes and error bodies. Runtime behavior must be debuggable without modifying source code.

### V. Type Safety & Explicitness
Use static types wherever the language supports them. Avoid `any`/`unknown` escapes. Validate inputs at system boundaries. Be explicit about contracts between components.

## Technology Constraints

- **Language**: TypeScript (Node.js 20+)
- **Backend Framework**: Hono (for HTTP API services)
- **Testing**: Vitest
- **Storage**: SQLite (via Drizzle ORM or better-sqlite3) for local/demo workloads; PostgreSQL may be introduced for production scale
- **Deployment Target**: Node.js server (single-process, no orchestration required for initial phases)
- **Package Manager**: npm or bun
- **Formatting/Linting**: ESLint + Prettier (or Biome as a unified alternative)

## Quality Gates

- All pull requests must include passing tests for new or changed behavior
- No feature merges without a spec artifact in `.specify/features/<slug>/spec.md`
- No implementation without an approved plan in `.specify/features/<slug>/plan.md`
- All HTTP endpoints must have contract tests
- Code coverage must not regress below the baseline established at feature merge
- TypeScript `strict` mode must remain enabled; no suppressions without documented justification

## Governance

The constitution supersedes all other practices and guidelines. Any amendment requires:

1. A written rationale explaining what the current principle fails to address
2. Identification of which existing features would be affected
3. A migration note if existing code violates the amended principle

All PRs and code reviews must verify compliance with this constitution. Non-compliance must be flagged as a blocker. Justified exceptions must be documented in the `Complexity Tracking` section of the relevant `plan.md`.

**Version**: 1.0.0 | **Ratified**: 2026-03-19 | **Last Amended**: 2026-03-19
