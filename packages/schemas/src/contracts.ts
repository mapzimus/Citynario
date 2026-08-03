import { z } from "zod";
import type { Geometry } from "geojson";

export const estimateRangeSchema = z.object({
  low: z.number(),
  central: z.number(),
  high: z.number(),
});

export const indicatorSchema = z.object({
  id: z.string(),
  module: z.string(),
  label: z.string(),
  estimate: estimateRangeSchema,
  unit: z.string(),
  trace_root: z.string(),
  interpretation: z.string(),
});

export const traceNodeSchema = z.object({
  id: z.string(),
  module: z.string(),
  label: z.string(),
  operation: z.string(),
  formula: z.string(),
  inputs: z.record(z.string(), z.unknown()),
  output: estimateRangeSchema,
  assumption_ids: z.array(z.string()),
  source_ids: z.array(z.string()),
});

export const runResultSchema = z.object({
  schema_version: z.literal("1.0"),
  run_id: z.string(),
  created_at: z.string(),
  city_pack: z.string(),
  baseline: z.string(),
  assumption_set: z.string(),
  scenario_name: z.string(),
  module_versions: z.record(z.string(), z.string()),
  indicators: z.array(indicatorSchema),
  traces: z.array(traceNodeSchema),
  warnings: z.array(
    z.object({
      code: z.string(),
      message: z.string(),
      severity: z.enum(["info", "warning", "error"]),
    }),
  ),
  excluded_effects: z.array(z.string()),
  disclaimer: z.string(),
});

export type EstimateRange = z.infer<typeof estimateRangeSchema>;
export type Indicator = z.infer<typeof indicatorSchema>;
export type TraceNode = z.infer<typeof traceNodeSchema>;
export type RunResult = z.infer<typeof runResultSchema>;

export type ScenarioEnvelope = {
  schema_version: "1.0";
  city_pack: string;
  baseline: string;
  scenario: {
    name: string;
    description: string;
    interventions: Array<{
      id: string;
      type: "residential_development";
      geometry: Geometry | null;
      inputs: {
        units: {
          studio: number;
          one_bedroom: number;
          two_bedroom: number;
          three_plus_bedroom: number;
        };
        affordable_share: number;
        parking_spaces_per_unit: number;
        site_area_square_feet: number | null;
        proposed_impervious_square_feet: number | null;
      };
    }>;
    assumption_set: string;
    requested_modules: string[];
  };
};
