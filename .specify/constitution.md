# Todo List App Constitution

## Core Principles

### I. Simplicity First
Build the simplest solution that satisfies the requirements. Avoid over-engineering; do not add abstractions, layers, or features unless they are explicitly required. YAGNI (You Aren't Gonna Need It) is enforced.

### II. Full-Stack Separation of Concerns
The frontend (Next.js) and backend (Hono API) are cleanly separated. The API is the single source of truth for data; the frontend only renders and interacts through well-defined HTTP contracts. No business logic lives in the frontend.

### III. Test-First
Unit and integration tests are written before implementation. Tests must fail before implementation begins (Red-Green-Refactor). Untested code is considered incomplete.

### IV. Library-First Dependencies
Prefer established, well-maintained libraries over custom implementations. Evaluate options based on compatibility with the tech stack, community support, and simplicity of integration.

### V. Observability
All API errors must return structured, consistent JSON error responses. Backend operations must log meaningful events to stdout/stderr. Frontend displays user-friendly error states.

## Technology Constraints

- **Frontend**: Next.js (App Router), React, TypeScript
- **Backend**: Hono (Node.js runtime), TypeScript
- **Database**: SQLite (via better-sqlite3 or Drizzle ORM) for local development simplicity
- **Package Manager**: npm or pnpm
- **Testing**: Vitest for unit/integration tests; Playwright optional for E2E
- **Deployment Target**: Local development / Node.js server
- **Node.js Version**: 18+

## Quality Gates

- All PRs must include passing tests for new functionality
- No `any` TypeScript types without explicit justification comment
- API contracts (OpenAPI YAML) must be updated before implementation
- Every new endpoint must have at least one integration test
- Frontend components must handle loading and error states

## Governance

This constitution governs all feature development in this repository. Amendments require:
1. A written justification documenting the need for the change
2. Update to this file with a new version and amendment date
3. Review and approval via pull request

All feature plans must include a **Constitution Check** section verifying compliance with each principle above.

**Version**: 1.0.0 | **Ratified**: 2026-03-20 | **Last Amended**: 2026-03-20
