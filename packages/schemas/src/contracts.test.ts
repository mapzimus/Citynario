import { describe, expect, it } from "vitest";

import { estimateRangeSchema } from "./contracts";

describe("estimateRangeSchema", () => {
  it("parses numeric estimate ranges", () => {
    expect(estimateRangeSchema.parse({ low: 1, central: 2, high: 3 }).central).toBe(2);
  });
});
