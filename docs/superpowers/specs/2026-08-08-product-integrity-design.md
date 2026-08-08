# Citynario Product Integrity Sprint — Design

**Date:** 2026-08-08  
**Branch:** `cursor/product-integrity-855f`  
**Status:** Approved for implementation pending final user review of this document  
**Approach:** Surgical honesty (keep single-page demo; make every control tell the truth)

## Goal

Close trust leaks in the Lynn demo so Share, Local draft, Affordable homes, and the city chip behave as labeled. No brand redesign, no real City Pack ingestion, no charts/sensitivity in this sprint.

## Non-goals

- Server-side short links, accounts, or multi-device sync
- Effects of affordability on residents, students, or site/impervious modules
- Multi-city pack switching
- Hero/brand redesign, fan charts, meeting mode
- Migrating Leaflet → MapLibre (README will be corrected to match current code)

## Architecture

Keep the static GitHub Pages export and existing page shell. Extract only the pure helpers this sprint needs:

| File | Responsibility |
|------|----------------|
| `app/lib/scenario-model.ts` | Types used by the model, `unitMix`, `calculate`, affordable auto-share factor, short run-id hash |
| `app/lib/scenario-state.ts` | URL `s` encode/decode + validation, `localStorage` draft read/write |
| `app/page.tsx` | UI, load-order wiring, notices, Inspect traces |
| `app/components/CityMap.tsx` | Unchanged |

## Canonical state

```ts
type ScenarioKey = "a" | "b";

type Scenario = {
  name: string;
  siteId: string;
  units: number;
  mix: "compact" | "balanced" | "family";
  affordable: number; // 0–60 percent
  parking: number;
  impervious: number;
  assumption: "low" | "central" | "high";
};

type AppState = {
  scenarios: Record<ScenarioKey, Scenario>;
  activeScenario: ScenarioKey;
};
```

This matches the existing editable UI. Results remain derived via `calculate(scenario)`.

## §1 — State, share, and restore

### Boot load order

1. If the URL has a valid `s` payload (`v=1`) → hydrate `AppState` from URL
2. Else if `localStorage` has a valid draft → hydrate from draft
3. Else → current hardcoded `initialScenarios` defaults

### Share URL

- Query shape: `?s=<base64url-json>&v=1`
- Payload is the full `AppState` (both scenarios + active tab)
- Share button copies a restorable absolute link for the current origin + `basePath` pathname
- Short **Run ID** (existing FNV-style hash of a single scenario) remains a human label in results/notice chrome only — not the share payload
- Invalid or corrupt `s` / unsupported `v` → ignore quietly, fall back to draft/defaults, show a brief notice (e.g. “Couldn’t restore shared scenario”)

### Local draft

- Storage key: `citynario:lynn:draft:v1`
- Debounced autosave (~300ms) after any change to persisted `AppState` (either scenario or active tab)
- Draft label is truthful:
  - `Saved just now` / `Saved 2m ago` (relative; refresh on save and about once per minute while visible)
  - On write failure: `Couldn’t save draft`
- Opening a valid share link does **not** overwrite local draft until the user edits; the first edit then writes the shared state as the new draft

### Encode / validate rules

- Decode must verify: exact expected object shape (hard-reject on schema failure or unknown keys), both `a` and `b` present, `activeScenario` in `{a,b}`, `mix` / `assumption` / `siteId` from known enums / the three demo site ids
- Numeric ranges must match the UI controls: `units` 25–350, `affordable` 0–60, `parking` 0–1.5, `impervious` 15000–75000; all finite numbers
- Scenario `name` must be a non-empty string ≤ 80 characters
- Use `base64url` without padding so links stay copy-friendly

## §2 — Affordable homes in the model

Affordable % influences **mobility only** (Tier 4 proxy).

### Formula

1. `baseAutoShare = clamp(0.38 + parking * 0.28, 0.34, 0.72)` (existing parking-driven band)
2. `affordableShare = clamp(affordable / 100, 0, 0.6)`
3. `autoShare = clamp(baseAutoShare * (1 - affordableShare * 0.15), 0.34, 0.72)`
4. Vehicle trips continue to use `autoShare` (with existing low/high offsets and transit adjustment)
5. Person trips, residents, students, and site modules unchanged

### Trust UI

- Affordable slider stays enabled
- Short helper under the control: adjusts vehicle-trip screening only
- Mobility Inspect trace adds an explicit step naming the 15% Tier 4 affordable factor and a caveat that local calibration is still required
- Exported JSON already includes `affordable` in inputs; trip results reflect the new logic

## §3 — Honest chrome

- City control: static chip `Lynn, MA · demo pack` — not a dropdown button (no chevron, no implied city picker)
- Share notice: “Scenario link copied” on success (restorable link)
- Draft label: live status from §1
- README: document Leaflet + OSM tiles (not MapLibre/OpenFreeMap)

## Testing

Add focused unit tests (lightweight Node assert or equivalent; no new heavy framework required):

1. URL encode → decode round-trip preserves `AppState`
2. Invalid / truncated / wrong-version payloads are rejected
3. Increasing `affordable` weakly decreases `autoShare` / central vehicle trips when other inputs are fixed
4. `npm test` continues to run lint + production build, and also runs these unit tests

## Error handling

| Case | Behavior |
|------|----------|
| Bad share URL | Fall back to draft/defaults + notice |
| `localStorage` quota / blocked | Keep in-memory state; draft label shows save failure |
| Clipboard API unavailable | Show Run ID and/or raw link in notice as fallback |
| Unknown site id in payload | Reject payload (site must be one of the three demo sites) |

## Implementation notes

- Prefer small pure functions with no React imports in `app/lib/*`
- Preserve existing visual language and section order; only change chrome copy/behavior called out above
- Keep `output: "export"` / GitHub Pages compatibility; no server APIs

## Success criteria

- Pasting a Share link into a fresh browser session restores both scenarios and active tab
- Editing after load updates Local draft status truthfully
- Moving the Affordable homes slider changes mobility Inspect numbers and vehicle-trip outputs
- No UI control implies a capability the app does not have
- README matches the shipped map stack
