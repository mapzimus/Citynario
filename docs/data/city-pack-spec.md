# City Pack contract

A City Pack is the versioned adapter between the generic platform and local facts. It contains:

- identity: slug, name, jurisdiction, version, and maintainers;
- geography: center point, bounding box, coordinate reference systems, and boundary sources;
- baselines: named values consumed by simulations, including units and effective dates;
- defaults: editable model assumptions with citations and confidence notes;
- source catalog: retrieval URL, publisher, license, cadence, and processing status;
- processed releases: checksummed, schema-versioned artifacts produced by pipelines.

Pack code may load and normalize local information but must not contain HTTP routes or UI code.
Core and simulations must not branch on a pack slug.

Raw and intermediate datasets are ignored by Git. Small redistributable processed fixtures may be
committed for tests; production artifacts should be published to versioned object storage with a
manifest and checksum.
