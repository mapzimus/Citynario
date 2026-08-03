import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ResultsPanel } from "./results-panel";

describe("ResultsPanel", () => {
  it("shows the central estimate and transparent range", () => {
    render(
      <ResultsPanel
        result={{
          schema_version: "1.0",
          run_id: "run_test",
          created_at: "2026-08-02T00:00:00Z",
          city_pack: "us-ma-lynn@0.1.0",
          baseline: "lynn-2026-07",
          assumption_set: "lynn-central-2026",
          scenario_name: "Test housing",
          module_versions: { resident_estimate: "0.1.0" },
          indicators: [
            {
              id: "added_residents",
              module: "resident_estimate",
              label: "Added residents",
              estimate: { low: 250, central: 310, high: 380 },
              unit: "people",
              trace_root: "trace_1",
              interpretation: "A range.",
            },
          ],
          traces: [
            {
              id: "trace_1",
              module: "resident_estimate",
              label: "Added residents",
              operation: "multiply",
              formula: "units × occupancy",
              inputs: {},
              output: { low: 250, central: 310, high: 380 },
              assumption_ids: [],
              source_ids: [],
            },
          ],
          warnings: [],
          excluded_effects: ["Feedback effects"],
          disclaimer: "Decision support only.",
        }}
      />,
    );
    expect(screen.getByText("310")).toBeInTheDocument();
    expect(screen.getByText(/250–380 plausible range/)).toBeInTheDocument();
    expect(screen.getByText("Decision support only.")).toBeInTheDocument();
  });
});
