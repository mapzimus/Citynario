# Citynario

**Explore the future of a city, one transparent scenario at a time.**

Citynario is an open civic decision-support platform. It lets residents, planners, and
researchers describe a local planning scenario, run documented simulation modules, and compare
estimated impacts on a map. The first reference implementation is the Lynn, Massachusetts City
Pack.

Citynario is not a forecasting oracle or a replacement for professional planning review. Every
result is an estimate with named assumptions, provenance, and uncertainty.

## Repository map

```text
apps/
  api/                    FastAPI application and persistence boundary
  web/                    React, TypeScript, and MapLibre product UI
packages/
  schemas/                Typed browser contracts and API client
python/
  citynario_core/         Scenario contracts and orchestration engine
  citynario_assistant/    Future natural-language provider interface
  citynario_data/         Data ingestion, validation, and publishing tools
  citynario_models/       Transparent population, mobility, school, and site modules
city-packs/
  us-ma-lynn/             Lynn manifest, source catalog, defaults, and tests
infra/
  docker/                 Development and production container definitions
  postgres/               PostGIS initialization
docs/                     Product, architecture, data, and development guides
```

The platform code does not know Lynn-specific facts. A **City Pack** provides geography,
datasets, baseline indicators, model defaults, and provenance. Simulation modules depend only on
the stable core contracts, so cities and models can evolve independently.

## Quick start

Prerequisites: Docker Desktop and Git. Copy `.env.example` to `.env`, then run:

```bash
docker compose up --build
```

Open the web app at `http://localhost:5173`, the API at `http://localhost:8000`, and interactive
API documentation at `http://localhost:8000/docs`.

For local development without containers, install Python 3.12+, `uv`, Node 22+, and `pnpm`, then:

```bash
uv sync --all-packages --group dev
pnpm install
uv run --package citynario-api uvicorn citynario_api.main:app --reload
pnpm dev
```

## First vertical slice

The starter supports a housing-development scenario. Users choose proposed units and assumptions;
the engine returns low, central, and high estimates for residents, public-school students, trips,
and site context. Every indicator includes a calculation trace. The UI calls the API and visualizes
the result alongside a Lynn-centered map.

See [the finalized product specification](docs/product/specification.md),
[architecture guide](docs/architecture/overview.md), [MVP boundary](docs/product/mvp.md), and
[developer setup](docs/development/getting-started.md) before extending the system.

## Project principles

- **Decision support, not prediction:** communicate ranges, assumptions, and limitations.
- **City Packs, not city forks:** add a city through a versioned data contract.
- **Deterministic models:** AI may structure a request, but never invent model outputs.
- **Privacy by design:** publish aggregate, licensed, non-sensitive data only.
- **Reproducibility:** source catalog + transform version + model version = traceable result.
- **Accessible public UX:** plain language, keyboard support, and non-map alternatives.

## Status

This is an initial production-oriented scaffold, not a validated planning model. Lynn defaults are
illustrative until reviewed against authoritative local sources.

Licensed under Apache-2.0. See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidance.
