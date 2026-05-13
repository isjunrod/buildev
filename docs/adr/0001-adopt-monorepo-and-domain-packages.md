# ADR 0001: Adopt pnpm Monorepo and Domain Packages

## Status

Accepted

## Context

The current repository is a single Next.js application with domain logic, UI components, AI providers, and export code mixed together. That structure makes it difficult to evolve the editor, vision pipeline, and exporters independently.

## Decision

Restructure the project as a pnpm monorepo with:

- `apps/web` for application composition
- `packages/*` for domain modules and shared tooling

## Consequences

### Positive

- clearer ownership boundaries
- easier testing and reuse
- exporter and provider plugins become first-class modules

### Negative

- short-term migration cost
- more workspace configuration overhead
