import { ScenarioStudio } from "@/components/scenario-studio";

export default function HomePage() {
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Citynario home">
          Citynario
        </a>
        <div className="location-badge">Lynn, Massachusetts · Experimental pack</div>
        <a className="methods-link" href="#method-note">
          Methods &amp; limits
        </a>
      </header>
      <section className="intro" id="top">
        <p className="eyebrow">Municipal decision support</p>
        <h1>What could happen if new housing were built here?</h1>
        <p>
          Compare plausible impacts under visible assumptions. This engineering demo uses
          illustrative values that still require Lynn-specific review.
        </p>
      </section>
      <ScenarioStudio />
      <section className="method-note" id="method-note">
        <p className="eyebrow">Read this first</p>
        <h2>Useful estimates, not authoritative predictions.</h2>
        <p>
          Citynario is for exploration and decision support. It is not a zoning determination,
          traffic-impact study, enrollment forecast, or professional certification. Every result
          exposes its range, formula, assumptions, and excluded effects.
        </p>
      </section>
    </main>
  );
}
