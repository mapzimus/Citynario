# ADR 0001: Use a polyglot monorepo

- Status: accepted
- Date: 2026-08-02

## Decision

Keep web, API, domain packages, simulations, City Packs, pipelines, infrastructure, and docs in one
repository. Use pnpm workspaces for TypeScript and uv workspaces for Python.

## Rationale

The first team needs atomic changes across scenario contracts, API behavior, model code, and UI.
Shared CI and documentation reduce coordination cost while deployable applications remain isolated.
If ownership or release cadence later diverges materially, packages can be extracted behind the
existing contracts.
