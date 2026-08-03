# ADR 0002: Make local knowledge a versioned City Pack

- Status: accepted
- Date: 2026-08-02

## Decision

Core platform code will remain jurisdiction-neutral. Local geography, data provenance, baselines,
defaults, and adapters live in independently versioned City Packs resolved at runtime.

## Consequences

Adding a city does not require a platform fork. Pack validation and version pinning become critical,
and Citynario must be honest that coverage and model quality can differ by jurisdiction.
