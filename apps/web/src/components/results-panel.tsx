import type { RunResult } from "@citynario/schemas";

export function ResultsPanel({ result }: { result: RunResult }) {
  const traceById = new Map(result.traces.map((trace) => [trace.id, trace]));
  return (
    <section className="results" aria-live="polite" aria-labelledby="results-title">
      <div className="results-heading">
        <div>
          <p className="eyebrow">Scenario result</p>
          <h2 id="results-title">{result.scenario_name}</h2>
        </div>
        <code>{result.run_id}</code>
      </div>
      <div className="indicator-grid">
        {result.indicators.map((indicator) => {
          const trace = traceById.get(indicator.trace_root);
          return (
            <article className="indicator-card" key={indicator.id}>
              <p>{indicator.label}</p>
              <strong>{Math.round(indicator.estimate.central).toLocaleString()}</strong>
              <span>{indicator.unit}</span>
              <div className="range">
                {Math.round(indicator.estimate.low).toLocaleString()}–
                {Math.round(indicator.estimate.high).toLocaleString()} plausible range
              </div>
              <details>
                <summary>How this was calculated</summary>
                <p>{indicator.interpretation}</p>
                {trace ? (
                  <>
                    <p className="formula">{trace.formula}</p>
                    <p className="trace-meta">
                      Module {indicator.module} · Sources {trace.source_ids.join(", ") || "user input"}
                    </p>
                  </>
                ) : null}
              </details>
            </article>
          );
        })}
      </div>
      <details className="limitations">
        <summary>What this run does not include</summary>
        <ul>
          {result.excluded_effects.map((effect) => (
            <li key={effect}>{effect}</li>
          ))}
        </ul>
      </details>
      <p className="disclaimer">{result.disclaimer}</p>
    </section>
  );
}
