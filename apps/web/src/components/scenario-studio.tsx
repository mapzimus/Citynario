"use client";

import { runScenario, type RunResult, type ScenarioEnvelope } from "@citynario/schemas";
import { FormEvent, useState } from "react";

import { MapPanel } from "./map-panel";
import { ResultsPanel } from "./results-panel";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

type FormState = {
  name: string;
  studio: number;
  oneBedroom: number;
  twoBedroom: number;
  threePlus: number;
  parking: number;
  siteArea: number;
  imperviousArea: number;
};

const INITIAL: FormState = {
  name: "Downtown Housing A",
  studio: 30,
  oneBedroom: 100,
  twoBedroom: 60,
  threePlus: 10,
  parking: 0.6,
  siteArea: 80000,
  imperviousArea: 52000,
};

function scenarioFromForm(form: FormState): ScenarioEnvelope {
  return {
    schema_version: "1.0",
    city_pack: "us-ma-lynn@0.1.0",
    baseline: "lynn-2026-07",
    scenario: {
      name: form.name,
      description: "Created in the Citynario engineering demo",
      interventions: [
        {
          id: "development-1",
          type: "residential_development",
          geometry: null,
          inputs: {
            units: {
              studio: form.studio,
              one_bedroom: form.oneBedroom,
              two_bedroom: form.twoBedroom,
              three_plus_bedroom: form.threePlus,
            },
            affordable_share: 0.2,
            parking_spaces_per_unit: form.parking,
            site_area_square_feet: form.siteArea,
            proposed_impervious_square_feet: form.imperviousArea,
          },
        },
      ],
      assumption_set: "lynn-central-2026",
      requested_modules: [
        "resident_estimate",
        "school_enrollment",
        "mobility_screening",
        "site_context",
      ],
    },
  };
}

export function ScenarioStudio() {
  const [form, setForm] = useState(INITIAL);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRunning(true);
    setError(null);
    try {
      setResult(await runScenario(API_URL, scenarioFromForm(form)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The scenario could not be run.");
    } finally {
      setRunning(false);
    }
  }

  return (
    <>
      <section className="studio" aria-label="Scenario Studio">
        <MapPanel />
        <form className="scenario-form" onSubmit={submit}>
          <p className="eyebrow">Scenario Studio</p>
          <h2>Describe the housing</h2>
          <label>
            Scenario name
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              maxLength={120}
              required
            />
          </label>
          <fieldset>
            <legend>Units by bedroom type</legend>
            <div className="field-grid">
              <NumberField label="Studios" value={form.studio} onChange={(v) => update("studio", v)} />
              <NumberField label="1 bedroom" value={form.oneBedroom} onChange={(v) => update("oneBedroom", v)} />
              <NumberField label="2 bedrooms" value={form.twoBedroom} onChange={(v) => update("twoBedroom", v)} />
              <NumberField label="3+ bedrooms" value={form.threePlus} onChange={(v) => update("threePlus", v)} />
            </div>
          </fieldset>
          <div className="field-grid">
            <NumberField label="Parking / unit" value={form.parking} step={0.05} onChange={(v) => update("parking", v)} />
            <NumberField label="Site area (sq ft)" value={form.siteArea} onChange={(v) => update("siteArea", v)} />
            <NumberField label="Impervious area (sq ft)" value={form.imperviousArea} onChange={(v) => update("imperviousArea", v)} />
          </div>
          <div className="assumption-note">
            Uses the illustrative <strong>Lynn central 2026</strong> assumption set. All assumptions
            remain visible in the result trace.
          </div>
          {error ? <p className="error" role="alert">{error}</p> : null}
          <button type="submit" disabled={running}>
            {running ? "Running transparent models…" : "Run scenario"}
          </button>
        </form>
      </section>
      {result ? <ResultsPanel result={result} /> : null}
    </>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label>
      {label}
      <input
        type="number"
        min={0}
        step={step}
        value={value}
        onChange={(event) => onChange(event.target.valueAsNumber || 0)}
        required
      />
    </label>
  );
}
