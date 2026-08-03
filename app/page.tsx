"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CityMap } from "./components/CityMap";

type ScenarioKey = "a" | "b";
type AssumptionKey = "low" | "central" | "high";
type MixKey = "compact" | "balanced" | "family";
type IndicatorKey = "residents" | "students" | "mobility" | "site";

type Scenario = {
  name: string;
  siteId: string;
  units: number;
  mix: MixKey;
  affordable: number;
  parking: number;
  impervious: number;
  assumption: AssumptionKey;
};

type Range = { low: number; central: number; high: number };

type Result = {
  residents: Range;
  students: Range;
  personTrips: Range;
  vehicleTrips: Range;
  occupiedUnits: Range;
  imperviousDelta: number;
  imperviousShare: number;
  autoShare: number;
  unitMix: Record<"studio" | "one" | "two" | "three", number>;
};

const sites = [
  {
    id: "downtown",
    name: "Downtown Gateway",
    short: "Downtown",
    detail: "1.8 acres · CBD zoning",
    acres: 1.8,
    existingImpervious: 0.68,
    transitMiles: 0.2,
    floodOverlap: 0,
    center: [-70.9472, 42.4632] as [number, number],
  },
  {
    id: "waterfront",
    name: "Waterfront Edge",
    short: "Waterfront",
    detail: "2.4 acres · Waterfront zoning",
    acres: 2.4,
    existingImpervious: 0.57,
    transitMiles: 0.45,
    floodOverlap: 34,
    center: [-70.9437, 42.4588] as [number, number],
  },
  {
    id: "central",
    name: "Central Square",
    short: "Central Sq.",
    detail: "1.2 acres · CBD zoning",
    acres: 1.2,
    existingImpervious: 0.82,
    transitMiles: 0.1,
    floodOverlap: 0,
    center: [-70.944, 42.46435] as [number, number],
  },
];

const mixLabels: Record<MixKey, { label: string; note: string }> = {
  compact: { label: "Compact", note: "70% studio / 1BR" },
  balanced: { label: "Balanced", note: "Mixed bedroom sizes" },
  family: { label: "Family", note: "75% 2BR / 3BR+" },
};

const initialScenarios: Record<ScenarioKey, Scenario> = {
  a: {
    name: "Compact homes",
    siteId: "downtown",
    units: 200,
    mix: "compact",
    affordable: 20,
    parking: 0.6,
    impervious: 52000,
    assumption: "central",
  },
  b: {
    name: "More open space",
    siteId: "downtown",
    units: 150,
    mix: "balanced",
    affordable: 35,
    parking: 0.35,
    impervious: 39000,
    assumption: "central",
  },
};

const occupancy = {
  low: { studio: 0.85, one: 1.2, two: 1.8, three: 2.45, vacancy: 0.08 },
  central: { studio: 1.0, one: 1.4, two: 2.15, three: 2.85, vacancy: 0.05 },
  high: { studio: 1.15, one: 1.6, two: 2.5, three: 3.3, vacancy: 0.03 },
};

const studentYield = {
  low: { studio: 0.008, one: 0.02, two: 0.09, three: 0.2 },
  central: { studio: 0.015, one: 0.035, two: 0.15, three: 0.3 },
  high: { studio: 0.025, one: 0.055, two: 0.22, three: 0.43 },
};

const tripRates = { studio: 4.1, one: 4.7, two: 5.4, three: 6.2 };

function unitMix(units: number, mix: MixKey) {
  const shares = {
    compact: [0.15, 0.55, 0.25],
    balanced: [0.1, 0.4, 0.35],
    family: [0.05, 0.2, 0.45],
  }[mix];
  const studio = Math.round(units * shares[0]);
  const one = Math.round(units * shares[1]);
  const two = Math.round(units * shares[2]);
  return { studio, one, two, three: units - studio - one - two };
}

function calculate(scenario: Scenario): Result {
  const mix = unitMix(scenario.units, scenario.mix);
  const site = sites.find((item) => item.id === scenario.siteId) ?? sites[0];
  const residentsFor = (key: AssumptionKey) => {
    const rate = occupancy[key];
    return Math.round(
      (mix.studio * rate.studio +
        mix.one * rate.one +
        mix.two * rate.two +
        mix.three * rate.three) *
        (1 - rate.vacancy),
    );
  };
  const studentsFor = (key: AssumptionKey) => {
    const rate = studentYield[key];
    return Math.round(
      mix.studio * rate.studio +
        mix.one * rate.one +
        mix.two * rate.two +
        mix.three * rate.three,
    );
  };
  const baseTrips =
    mix.studio * tripRates.studio +
    mix.one * tripRates.one +
    mix.two * tripRates.two +
    mix.three * tripRates.three;
  const transitAdjustment = site.transitMiles <= 0.15 ? 0.83 : site.transitMiles <= 0.3 ? 0.89 : 0.96;
  const autoShare = Math.min(0.72, Math.max(0.34, 0.38 + scenario.parking * 0.28));
  const personTrips = {
    low: Math.round(baseTrips * 0.86),
    central: Math.round(baseTrips),
    high: Math.round(baseTrips * 1.16),
  };
  const vehicleTrips = {
    low: Math.round(personTrips.low * Math.max(0.3, autoShare - 0.06) * transitAdjustment),
    central: Math.round(personTrips.central * autoShare * transitAdjustment),
    high: Math.round(personTrips.high * Math.min(0.78, autoShare + 0.06) * transitAdjustment),
  };
  const siteSquareFeet = site.acres * 43560;
  return {
    residents: { low: residentsFor("low"), central: residentsFor("central"), high: residentsFor("high") },
    students: { low: studentsFor("low"), central: studentsFor("central"), high: studentsFor("high") },
    personTrips,
    vehicleTrips,
    occupiedUnits: {
      low: Math.round(scenario.units * (1 - occupancy.low.vacancy)),
      central: Math.round(scenario.units * (1 - occupancy.central.vacancy)),
      high: Math.round(scenario.units * (1 - occupancy.high.vacancy)),
    },
    imperviousDelta: Math.round(scenario.impervious - siteSquareFeet * site.existingImpervious),
    imperviousShare: Math.round((scenario.impervious / siteSquareFeet) * 100),
    autoShare,
    unitMix: mix,
  };
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function signed(value: number) {
  return `${value > 0 ? "+" : value < 0 ? "−" : ""}${formatNumber(Math.abs(value))}`;
}

function hashScenario(scenario: Scenario) {
  const input = JSON.stringify(scenario);
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash >>> 0).toString(36).slice(0, 7).toUpperCase();
}

function IndicatorCard({
  eyebrow,
  value,
  range,
  note,
  tone,
  onInspect,
}: {
  eyebrow: string;
  value: string;
  range: string;
  note: string;
  tone: string;
  onInspect: () => void;
}) {
  return (
    <button className="indicator-card" data-tone={tone} onClick={onInspect}>
      <span className="indicator-topline">
        <span className="indicator-eyebrow">{eyebrow}</span>
        <span className="inspect-link">Inspect ↗</span>
      </span>
      <strong>{value}</strong>
      <span className="range-bar" aria-hidden="true"><i /></span>
      <span className="range-label">{range}</span>
      <span className="indicator-note">{note}</span>
    </button>
  );
}

function RangeInput({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="range-field">
      <span><span>{label}</span><strong>{display}</strong></span>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="range-ticks" aria-hidden="true"><i /><i /><i /></span>
    </label>
  );
}

export default function Home() {
  const [scenarios, setScenarios] = useState(initialScenarios);
  const [activeScenario, setActiveScenario] = useState<ScenarioKey>("a");
  const [trace, setTrace] = useState<IndicatorKey | null>(null);
  const [notice, setNotice] = useState("");
  const scenario = scenarios[activeScenario];
  const site = sites.find((item) => item.id === scenario.siteId) ?? sites[0];
  const result = useMemo(() => calculate(scenario), [scenario]);
  const results = useMemo(
    () => ({ a: calculate(scenarios.a), b: calculate(scenarios.b) }),
    [scenarios],
  );

  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setTrace(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);

  const updateScenario = (patch: Partial<Scenario>) => {
    setScenarios((current) => ({
      ...current,
      [activeScenario]: { ...current[activeScenario], ...patch },
    }));
  };

  const chooseSite = useCallback((siteId: string) => {
    setScenarios((current) => ({
      a: { ...current.a, siteId },
      b: { ...current.b, siteId },
    }));
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const runScenario = () => {
    setNotice(`${scenario.name} updated · Run ${hashScenario(scenario)}`);
    window.setTimeout(() => scrollTo("results"), 80);
  };

  const exportJson = () => {
    const payload = {
      schema_version: "1.0",
      city_pack: "us-ma-lynn@0.1.0-demo",
      baseline: "lynn-2026-demo",
      generated_at: new Date().toISOString(),
      disclaimer: "Demonstration estimates for exploration only.",
      scenarios: (Object.keys(scenarios) as ScenarioKey[]).map((key) => ({
        id: key.toUpperCase(),
        run_id: hashScenario(scenarios[key]),
        inputs: scenarios[key],
        results: results[key],
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "citynario-lynn-comparison.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Scenario JSON exported");
  };

  const copyShareLink = async () => {
    const link = `${window.location.origin}${window.location.pathname}?run=${hashScenario(scenario)}`;
    try {
      await navigator.clipboard.writeText(link);
      setNotice("Read-only scenario link copied");
    } catch {
      setNotice(`Run ID: ${hashScenario(scenario)}`);
    }
  };

  const assumptionValue = <T extends Record<AssumptionKey, number>>(range: T) => range[scenario.assumption];

  const traceContent: Record<IndicatorKey, { title: string; summary: string; formula: string; steps: string[]; source: string; caveat: string }> = {
    residents: {
      title: "Estimated new residents",
      summary: `${formatNumber(assumptionValue(result.residents))} residents under the ${scenario.assumption} assumption set.`,
      formula: "Σ occupied units by bedroom × persons per occupied unit",
      steps: [
        `${scenario.units} homes → ${result.unitMix.studio} studios, ${result.unitMix.one} one-bedrooms, ${result.unitMix.two} two-bedrooms, ${result.unitMix.three} three-bedrooms`,
        `${formatNumber(assumptionValue(result.occupiedUnits))} occupied homes after the documented vacancy allowance`,
        `${formatNumber(result.residents.low)}–${formatNumber(result.residents.high)} plausible resident range`,
      ],
      source: "Demonstration occupancy assumptions · proxy values pending local calibration",
      caveat: "Future households may differ from citywide or comparable-development averages.",
    },
    students: {
      title: "Estimated public-school students",
      summary: `${formatNumber(assumptionValue(result.students))} students under the ${scenario.assumption} assumption set.`,
      formula: "Σ units by bedroom × student yield by bedroom",
      steps: [
        `Bedroom-specific yields are applied to the ${scenario.units}-home mix`,
        `Low ${result.students.low} · central ${result.students.central} · high ${result.students.high}`,
        "Grade-band allocation is excluded until local yields are validated",
      ],
      source: "Demonstration student-yield assumptions · DESE Lynn profile identified for calibration",
      caveat: "This is not a student assignment, classroom, or district-capacity model.",
    },
    mobility: {
      title: "Daily travel screening",
      summary: `${formatNumber(assumptionValue(result.vehicleTrips))} vehicle trips within ${formatNumber(assumptionValue(result.personTrips))} person trips.`,
      formula: "Person trips × auto-driver share × location adjustment",
      steps: [
        `${formatNumber(result.personTrips.central)} central daily person trips from bedroom-specific screening rates`,
        `${Math.round(result.autoShare * 100)}% modeled auto-driver share, influenced by ${scenario.parking.toFixed(2)} parking spaces per home`,
        `${site.transitMiles.toFixed(2)} miles to frequent transit informs the location adjustment`,
      ],
      source: "Demonstration trip-rate assumptions · MBTA stop context identified for pack validation",
      caveat: "Trips are not assigned to a street or time of day and do not predict congestion.",
    },
    site: {
      title: "Site and land context",
      summary: `${result.imperviousShare}% proposed impervious coverage on the ${site.acres}-acre site.`,
      formula: "Proposed impervious area − estimated existing impervious area",
      steps: [
        `${formatNumber(scenario.impervious)} sq ft proposed impervious surface`,
        `${signed(result.imperviousDelta)} sq ft compared with the demonstration baseline`,
        `${site.floodOverlap}% overlap with mapped flood context at this demonstration site`,
      ],
      source: "Demonstration site geometry · MassGIS and FEMA layers identified for production pack",
      caveat: "Mapped overlap is a screening flag, not a survey or regulatory determination.",
    },
  };

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => scrollTo("studio")} aria-label="Citynario home">
          <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
          <span>Citynario</span>
        </button>
        <nav aria-label="Primary navigation">
          <button className="nav-active" onClick={() => scrollTo("studio")}>Scenario studio</button>
          <button onClick={() => scrollTo("compare")}>Compare</button>
          <button onClick={() => scrollTo("methods")}>Methods & data</button>
        </nav>
        <div className="header-actions">
          <button className="city-chip"><span /> Lynn, MA <b>⌄</b></button>
          <button className="share-button" onClick={copyShareLink}>Share <span>↗</span></button>
        </div>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <div>
          <span className="kicker"><i /> Lynn residential development explorer</span>
          <h1 id="page-title">What could happen if<br />new housing were built here?</h1>
        </div>
        <div className="intro-copy">
          <p>Place a proposal, compare alternatives, and see which assumptions shape the story.</p>
          <div className="trust-note"><span>Not a prediction</span> Plausible ranges for decision support <button onClick={() => scrollTo("methods")}>Why?</button></div>
        </div>
      </section>

      <section className="studio" id="studio" aria-label="Scenario studio">
        <div className="map-panel">
          <div className="map-toolbar">
            <div>
              <span className="section-index">01</span>
              <div><strong>Choose a place</strong><small>Explore Lynn, then select a development site</small></div>
            </div>
            <span className="demo-badge">DEMO PACK · 0.1.0</span>
          </div>
          <div className="map-canvas">
            <CityMap sites={sites} selectedSiteId={scenario.siteId} onSelectSite={chooseSite} />
          </div>
          <div className="site-strip">
            <div className="selected-site">
              <span className="selected-number">{String(sites.findIndex((item) => item.id === site.id) + 1).padStart(2, "0")}</span>
              <div><small>Selected site</small><strong>{site.name}</strong><span>{site.detail}</span></div>
            </div>
            <div className="site-facts">
              <span><small>Transit</small><b>{site.transitMiles.toFixed(2)} mi</b></span>
              <span><small>Existing cover</small><b>{Math.round(site.existingImpervious * 100)}%</b></span>
              <span><small>Flood overlap</small><b>{site.floodOverlap}%</b></span>
            </div>
          </div>
        </div>

        <div className="scenario-panel">
          <div className="scenario-header">
            <div>
              <span className="section-index coral">02</span>
              <div><strong>Describe the change</strong><small>Inputs update the estimate ranges</small></div>
            </div>
            <span className="saved-state"><i /> Local draft</span>
          </div>

          <div className="scenario-tabs" role="tablist" aria-label="Scenario alternative">
            {(["a", "b"] as ScenarioKey[]).map((key) => (
              <button
                key={key}
                role="tab"
                aria-selected={activeScenario === key}
                className={activeScenario === key ? "active" : ""}
                onClick={() => setActiveScenario(key)}
              >
                <span>{key.toUpperCase()}</span>
                <b>{scenarios[key].name}</b>
              </button>
            ))}
          </div>

          <div className="form-block">
            <RangeInput label="Homes" value={scenario.units} min={25} max={350} step={5} display={formatNumber(scenario.units)} onChange={(units) => updateScenario({ units })} />
            <fieldset className="mix-field">
              <legend>Bedroom mix</legend>
              <div>
                {(Object.keys(mixLabels) as MixKey[]).map((key) => (
                  <button key={key} className={scenario.mix === key ? "active" : ""} onClick={() => updateScenario({ mix: key })}>
                    <b>{mixLabels[key].label}</b><span>{mixLabels[key].note}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="two-ranges">
              <RangeInput label="Affordable homes" value={scenario.affordable} min={0} max={60} step={5} display={`${scenario.affordable}%`} onChange={(affordable) => updateScenario({ affordable })} />
              <RangeInput label="Parking / home" value={scenario.parking} min={0} max={1.5} step={0.05} display={scenario.parking.toFixed(2)} onChange={(parking) => updateScenario({ parking })} />
            </div>
            <RangeInput label="Proposed impervious surface" value={scenario.impervious} min={15000} max={75000} step={1000} display={`${formatNumber(scenario.impervious)} sq ft`} onChange={(impervious) => updateScenario({ impervious })} />
          </div>

          <div className="assumption-row">
            <div><strong>Assumption focus</strong><span>All result ranges stay visible</span></div>
            <div className="assumption-switch" role="group" aria-label="Assumption focus">
              {(["low", "central", "high"] as AssumptionKey[]).map((key) => (
                <button key={key} className={scenario.assumption === key ? "active" : ""} onClick={() => updateScenario({ assumption: key })}>{key}</button>
              ))}
            </div>
          </div>
          <button className="run-button" onClick={runScenario}><span>Run {activeScenario.toUpperCase()}</span><b>See transparent results</b><i>→</i></button>
        </div>
      </section>

      <section className="results-section" id="results" aria-labelledby="results-title">
        <div className="section-heading">
          <div>
            <span className="section-index light">03</span>
            <div><span className="kicker pale"><i /> Run {hashScenario(scenario)} · {scenario.assumption} focus</span><h2 id="results-title">A plausible range,<br />not a promise.</h2></div>
          </div>
          <div className="result-summary">
            <p><b>{scenario.name}</b> adds {scenario.units} homes at {site.name}. Under these assumptions, the largest differences are driven by the bedroom mix, parking supply, and proposed site coverage.</p>
            <button onClick={() => scrollTo("compare")}>Compare A + B <span>↓</span></button>
          </div>
        </div>
        <div className="indicator-grid">
          <IndicatorCard eyebrow="New residents" value={`≈ ${formatNumber(assumptionValue(result.residents))}`} range={`${formatNumber(result.residents.low)} — ${formatNumber(result.residents.high)}`} note="People associated with the new homes" tone="mint" onInspect={() => setTrace("residents")} />
          <IndicatorCard eyebrow="Public-school students" value={`≈ ${formatNumber(assumptionValue(result.students))}`} range={`${formatNumber(result.students.low)} — ${formatNumber(result.students.high)}`} note="Screening estimate, not assignment" tone="sun" onInspect={() => setTrace("students")} />
          <IndicatorCard eyebrow="Daily vehicle trips" value={`≈ ${formatNumber(assumptionValue(result.vehicleTrips))}`} range={`${formatNumber(result.vehicleTrips.low)} — ${formatNumber(result.vehicleTrips.high)}`} note={`Within ≈ ${formatNumber(assumptionValue(result.personTrips))} person trips`} tone="blue" onInspect={() => setTrace("mobility")} />
          <IndicatorCard eyebrow="Impervious change" value={`${signed(result.imperviousDelta)} ft²`} range={`${result.imperviousShare}% of the selected site`} note={site.floodOverlap ? `${site.floodOverlap}% mapped flood overlap` : "No mapped flood overlap in demo data"} tone="coral" onInspect={() => setTrace("site")} />
        </div>
        <div className="results-footnote"><span><i /> Selected assumptions</span><p>Click any result to see the formula, values, source path, and limitation behind it.</p><button onClick={() => setTrace("residents")}>Open a calculation trace →</button></div>
      </section>

      <section className="compare-section" id="compare" aria-labelledby="compare-title">
        <div className="compare-intro">
          <span className="section-index dark">04</span>
          <span className="kicker"><i /> Same site · same baseline · same model</span>
          <h2 id="compare-title">Compare the choices,<br />not just the totals.</h2>
          <p>Alternatives A and B use Lynn demo pack 0.1.0. Differences come only from the inputs you can see.</p>
        </div>
        <div className="compare-board">
          <div className="compare-head">
            <div><span>Alternative</span><b>Housing program</b></div>
            {(["a", "b"] as ScenarioKey[]).map((key) => (
              <button key={key} onClick={() => { setActiveScenario(key); scrollTo("studio"); }}>
                <span>{key.toUpperCase()}</span><div><b>{scenarios[key].name}</b><small>Edit alternative ↗</small></div>
              </button>
            ))}
          </div>
          {[
            ["Homes", scenarios.a.units, scenarios.b.units, "homes"],
            ["New residents", results.a.residents.central, results.b.residents.central, "people"],
            ["Public-school students", results.a.students.central, results.b.students.central, "students"],
            ["Daily vehicle trips", results.a.vehicleTrips.central, results.b.vehicleTrips.central, "trips"],
            ["Proposed impervious", scenarios.a.impervious, scenarios.b.impervious, "ft²"],
          ].map(([label, a, b, unit]) => {
            const difference = Number(b) - Number(a);
            return (
              <div className="compare-row" key={String(label)}>
                <span>{label}</span>
                <div><b>{formatNumber(Number(a))}</b><small>{unit}</small></div>
                <div><b>{formatNumber(Number(b))}</b><small>{unit}</small><em className={difference <= 0 ? "down" : "up"}>{signed(difference)} vs A</em></div>
              </div>
            );
          })}
          <div className="compare-actions">
            <span><i /> Comparison uses central estimates; ranges remain available above.</span>
            <div><button onClick={() => window.print()}>Print summary</button><button className="primary" onClick={exportJson}>Export JSON ↗</button></div>
          </div>
        </div>
      </section>

      <section className="methods-section" id="methods" aria-labelledby="methods-title">
        <div className="methods-heading">
          <span className="kicker"><i /> Methods & data</span>
          <h2 id="methods-title">Trust begins with<br />showing the work.</h2>
          <p>This first build demonstrates Citynario’s calculation and provenance contract. Its rates are illustrative proxies—not locally validated findings.</p>
        </div>
        <div className="method-cards">
          <article><span>MODEL 01</span><h3>Resident estimate</h3><p>Bedroom-specific occupancy rates, an explicit vacancy allowance, and low / central / high assumptions.</p><button onClick={() => setTrace("residents")}>Inspect method →</button></article>
          <article><span>MODEL 02</span><h3>School enrollment</h3><p>Bedroom-specific student yields, separated from any claim about school assignment or capacity.</p><button onClick={() => setTrace("students")}>Inspect method →</button></article>
          <article><span>MODEL 03</span><h3>Mobility screening</h3><p>Person-trip rates adjusted by parking supply and transit context—never assigned to a specific street.</p><button onClick={() => setTrace("mobility")}>Inspect method →</button></article>
          <article><span>MODEL 04</span><h3>Site context</h3><p>Proposed land cover compared with a demonstration baseline and mapped environmental flags.</p><button onClick={() => setTrace("site")}>Inspect method →</button></article>
        </div>
        <div className="source-register">
          <div><span className="section-index">05</span><div><strong>Lynn source register</strong><small>Candidate sources named in the project specification</small></div></div>
          <div className="source-list">
            <a href="https://tigerweb.geo.census.gov/" target="_blank" rel="noreferrer"><span>Boundary</span><b>U.S. Census TIGERweb</b><em>Official federal · live ↗</em></a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"><span>Basemap</span><b>OpenStreetMap contributors</b><em>Open data · live ↗</em></a>
            <a href="https://www.mass.gov/info-details/massgis-data-layers" target="_blank" rel="noreferrer"><span>Geography</span><b>MassGIS data layers</b><em>Official state · candidate ↗</em></a>
            <a href="https://www.lynnma.gov/city_government/departments/isd/zoning" target="_blank" rel="noreferrer"><span>Land use</span><b>City of Lynn zoning</b><em>Official local · candidate ↗</em></a>
            <a href="https://profiles.doe.mass.edu/profiles/student.aspx?orgcode=01630000&orgtypecode=5" target="_blank" rel="noreferrer"><span>Schools</span><b>MA district profiles</b><em>Official state · candidate ↗</em></a>
            <a href="https://api-v3.mbta.com/" target="_blank" rel="noreferrer"><span>Transit</span><b>MBTA V3 API</b><em>Official agency · candidate ↗</em></a>
          </div>
        </div>
      </section>

      <section className="responsibility">
        <span>Read this before using results</span>
        <h2>Citynario estimates plausible impacts under stated assumptions.</h2>
        <p>Results are for exploration and decision support—not prediction, legal determination, permitting, or professional engineering certification.</p>
      </section>

      <footer>
        <div className="brand footer-brand"><span className="brand-mark" aria-hidden="true"><i /><i /><i /></span><span>Citynario</span></div>
        <p>Explore the future of a city,<br />one transparent scenario at a time.</p>
        <div><span>Lynn demonstration pack · v0.1.0</span><span>Open civic technology · 2026</span></div>
      </footer>

      {trace && (
        <div className="trace-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setTrace(null); }}>
          <aside className="trace-panel" role="dialog" aria-modal="true" aria-labelledby="trace-title">
            <div className="trace-head"><span>Calculation trace</span><button onClick={() => setTrace(null)} aria-label="Close calculation trace">×</button></div>
            <div className="trace-body">
              <span className="kicker"><i /> Run {hashScenario(scenario)} · module 1.0-demo</span>
              <h2 id="trace-title">{traceContent[trace].title}</h2>
              <p className="trace-summary">{traceContent[trace].summary}</p>
              <div className="formula"><small>Formula</small><code>{traceContent[trace].formula}</code></div>
              <ol>{traceContent[trace].steps.map((step, index) => <li key={step}><span>{index + 1}</span><p>{step}</p></li>)}</ol>
              <div className="trace-source"><small>Source path</small><p>{traceContent[trace].source}</p><span>Tier 4 proxy · review required</span></div>
              <div className="trace-caveat"><b>Important limitation</b><p>{traceContent[trace].caveat}</p></div>
            </div>
          </aside>
        </div>
      )}

      {notice && <button className="toast" onClick={() => setNotice("")} aria-live="polite"><span>✓</span>{notice}<b>×</b></button>}
    </main>
  );
}
