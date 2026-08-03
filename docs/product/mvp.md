# Lynn MVP boundary

## Product promise

A user can explore one question: **What might change if a proposed housing development were added
at a location in Lynn?** The system returns transparent first-order estimates and lets the user see
and edit every assumption.

## Included

- Lynn-centered map and a location marker
- Housing units, occupancy, household size, school-age share, trip rate, and available-seat inputs
- Estimated households, residents, school-age children, daily vehicle trips, and seat pressure
- Named assumptions, module versions, warnings, and non-map result presentation
- A deterministic natural-language parser as the safe assistant baseline
- City Pack manifest and source catalog validation
- PostGIS-ready API and Docker development environment

## Explicitly excluded

- Parcel-level development feasibility or zoning determinations
- Traffic assignment, intersection operations, or travel-time prediction
- Student assignment to individual schools
- Tax revenue or municipal cost claims
- Property value, displacement, or demographic predictions
- A national dataset, 3D digital twin, real-time sensors, or autonomous policy recommendations
- Unreviewed AI-generated assumptions or results

## Definition of a credible beta

Before calling the model decision-ready, replace illustrative defaults with cited values, validate
calculations with Lynn planners or domain experts, add uncertainty ranges, publish methodology, run
accessibility testing, and label all known limitations in the interface.
