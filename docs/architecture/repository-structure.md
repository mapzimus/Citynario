# Repository structure and ownership

| Path | Owns | Must not own |
|---|---|---|
| `apps/web` | Next.js pages, MapLibre interaction, accessible results | Model formulas or local facts |
| `apps/api` | HTTP, configuration, persistence, composition | City-specific calculation branches |
| `packages/schemas` | Browser contracts and validated API responses | Business logic |
| `python/citynario_core` | Scenario contracts, engine protocol, orchestration | FastAPI, SQLAlchemy, Lynn imports |
| `python/citynario_models` | Deterministic reusable model modules | HTTP or vendor AI calls |
| `python/citynario_data` | Pack acquisition/validation/publishing tools | Request-time scenario behavior |
| `python/citynario_assistant` | Reviewable draft provider boundary | Simulation output generation |
| `city-packs/us-ma-lynn` | Lynn data, defaults, evidence, content, fixtures | Core application forks |
| `infra` | Reproducible runtime definitions | Product behavior |

Start as a modular monolith. Add a worker process when measured run or export latency requires it;
the worker should call the same core engine and write the same immutable result contract. Add Redis,
object storage, PMTiles, and vendor services only with an accepted ADR and a concrete use case.
