# Citynario

<<<<<<< HEAD
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
=======
![Citynario social preview](public/og.png)

Citynario is a transparent municipal decision-support platform for exploring how residential development choices could affect a city. The first demonstration focuses on Lynn, Massachusetts.

**Live site:** [mapzimus.github.io/Citynario](https://mapzimus.github.io/Citynario/)

## What the demo includes

- Three guided Lynn demonstration sites
- Interactive street map with the official Census TIGERweb Lynn boundary
- Toggleable transit, school, and flood-screening context layers
- Two editable housing alternatives
- Low, central, and high estimate ranges
- Resident, school-enrollment, mobility, and site-context modules
- Inspectable formulas, source paths, and limitations
- Side-by-side comparison plus JSON and print exports
- Responsive, keyboard-accessible public interface

## Important limitation

The rates in this first build are clearly labeled demonstration proxies. They have not yet been calibrated or validated for local planning use.

> Citynario estimates plausible impacts under stated assumptions. Results are for exploration and decision support—not prediction, legal determination, permitting, or professional engineering certification.

## Run locally

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validate a production build

```bash
npm test
```

GitHub Actions exports the app as a static site and deploys it to GitHub Pages on updates to `main`.

The live map uses MapLibre GL JS with OpenFreeMap/OpenStreetMap tiles. It requires an internet connection for basemap tiles and the live Census boundary request.

## Modeling approach

Citynario favors inspectable rules, ranges, and calculation traces over opaque scores or false precision. Every public indicator is designed to expose its inputs, method, source tier, and key limitation.

The demonstration implements four modules:

1. Resident estimates using bedroom-specific occupancy rates and an explicit vacancy allowance.
2. Public-school enrollment using bedroom-specific student-yield assumptions.
3. Daily travel screening using person-trip rates, parking supply, and transit context.
4. Site context comparing proposed impervious surface with a demonstration baseline.

## License

Code is available under the [MIT License](LICENSE). Source datasets and future City Pack artifacts retain their own licenses and attribution requirements.
>>>>>>> origin/main
