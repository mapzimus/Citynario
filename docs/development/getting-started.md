# Development setup

## Container workflow

1. Install Docker Desktop and Git.
2. Copy `.env.example` to `.env`.
3. Run `docker compose up --build`.
4. Visit `http://localhost:5173` and `http://localhost:8000/docs`.

The database volume persists between runs. Use `docker compose down` to stop the stack. Adding `-v`
deletes the local database and should only be used intentionally.

## Native workflow

Install Python 3.12+, uv, Node 22+, pnpm 10+, and PostgreSQL 16 with PostGIS 3.4. Then run:

```bash
uv sync --all-packages --group dev
pnpm install
uv run --package citynario-api alembic upgrade head
uv run --package citynario-api uvicorn citynario_api.main:app --reload
pnpm dev
```

Set `DATABASE_URL` to the host-accessible database URL when the API runs outside Docker.

## Quality checks

```bash
uv run ruff check .
uv run ruff format --check .
uv run pytest --cov
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Adding a simulation

Implement the `SimulationModule` protocol, declare a stable slug and semantic version, document all
inputs and units, and add the module at the API composition root. Modules must be deterministic for
the same scenario, City Pack version, and code version.

## Adding a city

Copy `city-packs/us-ma-lynn` as a structural reference, not as a data reference. Provide a manifest, source
catalog, model defaults, bounding box, version, maintainers, and tests. Validate redistribution
rights before committing any derived data.
