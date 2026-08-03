# Lynn-specific pipelines

Local source adapters and field mappings belong here. Shared acquisition, validation, checksum,
and publishing utilities belong in `python/citynario_data`. Every pipeline must be idempotent and
must register its source, license, retrieval time, checksum, CRS, and known limitations.
