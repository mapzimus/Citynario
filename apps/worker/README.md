# Worker boundary

The MVP runs fast deterministic models in the API process. When measured latency requires queued
execution, this folder will become a separately runnable Python worker that imports the same core
engine, consumes a lightweight Redis-compatible queue, and writes immutable run results.

Do not introduce a queue until a real model, sensitivity job, pack build, or export exceeds the
request-time budget. Record that decision in an ADR.
