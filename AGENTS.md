# AGENTS.md

## Cursor Cloud specific instructions

Citynario is a single, self-contained **Next.js 16 (App Router) static-export** frontend app. There is no backend, database, or other service to run.

- Dev server: `npm run dev` (Next.js + Turbopack, serves on http://localhost:3000). This is the only service.
- Lint: `npm run lint` (ESLint over `app` and `next.config.ts`).
- Build: `npm run build` (static export via `output: "export"`; artifacts go to `out/`).
- Combined check: `npm test` runs `lint` then `build:pages` (`next build`).
- Requires Node.js `>=22.13.0` (see `package.json` engines); the VM's default Node satisfies this.

Non-obvious caveats:
- The interactive map uses MapLibre/Leaflet with OpenFreeMap/OpenStreetMap tiles plus a live Census TIGERweb boundary request, so basemap tiles and the Lynn outline **require outbound internet**. If tiles are blocked the map area may render empty, but the scenario-modeling UI (unit/mix edits and impact estimates) still works fully client-side.
- `next.config.ts` switches on `GITHUB_ACTIONS=true` to add a `/Citynario` `basePath`/`assetPrefix` for GitHub Pages. Do **not** set `GITHUB_ACTIONS` locally or asset URLs will 404. Deployment is handled by `.github/workflows/deploy-pages.yml`.
