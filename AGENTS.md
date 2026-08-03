# Instructions for coding agents

## Product guardrails

- Citynario provides transparent decision support, never authoritative predictions.
- Keep Lynn-specific logic inside `city-packs/us-ma-lynn`; do not branch core behavior by city slug.
- AI providers may translate natural language into a typed scenario. They must not calculate or
  overwrite simulation results.
- Every new model output must include units, model version, assumptions, and a plain-language note.
- Do not commit restricted, personally identifiable, or raw source data.

## Architecture guardrails

- Domain contracts and engine interfaces belong in `python/citynario_core`.
- Simulation implementations belong in `python/citynario_models` and must remain deterministic.
- HTTP and database concerns belong in `apps/api`; React concerns belong in `apps/web`.
- Shared browser contracts belong in `packages/schemas` until code generation is introduced.
- A City Pack must pass its manifest and source-catalog validation before use.

## Required checks

Run the smallest relevant checks while working and all checks before handoff:

```bash
uv run ruff check .
uv run ruff format --check .
uv run mypy apps/api/src python/citynario_core/src python/citynario_assistant/src python/citynario_data/src python/citynario_models/src city-packs/us-ma-lynn/src
uv run pytest --cov
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add or update tests whenever behavior changes. Record a new architecture decision in `docs/adr`
when changing a major boundary, data contract, or dependency direction.
