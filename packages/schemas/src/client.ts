import { runResultSchema, type RunResult, type ScenarioEnvelope } from "./contracts";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export async function runScenario(
  apiUrl: string,
  scenario: ScenarioEnvelope,
  signal?: AbortSignal,
): Promise<RunResult> {
  const request: RequestInit = {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(scenario),
  };
  if (signal) request.signal = signal;
  const response = await fetch(`${apiUrl}/v1/scenarios/run`, request);
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === "object" && body !== null && "detail" in body
        ? String(body.detail)
        : "Citynario could not run this scenario.";
    throw new ApiError(message, response.status);
  }
  return runResultSchema.parse(await response.json());
}
