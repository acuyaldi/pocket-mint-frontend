import { describe, expect, it } from "vitest";

import { unwrapAnalyticsResponse } from "@/src/features/analytics/hooks/useAnalytics";

describe("unwrapAnalyticsResponse", () => {
  it("returns the payload inside the backend success envelope", () => {
    const payload = {
      period: "current-month",
      periodStart: "2026-07-01T00:00:00.000Z",
      periodEnd: "2026-08-01T00:00:00.000Z",
      granularity: "daily",
      buckets: [
        {
          start: "2026-07-01T00:00:00.000Z",
          end: "2026-07-02T00:00:00.000Z",
          income: 100_000,
          expense: 25_000,
          netCashFlow: 75_000,
        },
      ],
    };

    expect(
      unwrapAnalyticsResponse({
        success: true,
        data: payload,
        message: "Retrieved analytics trends",
      }),
    ).toBe(payload);
  });

  it("leaves already-unwrapped payloads unchanged", () => {
    const payload = {
      period: "current-month",
      periodStart: "2026-07-01T00:00:00.000Z",
      periodEnd: "2026-08-01T00:00:00.000Z",
      granularity: "daily",
      buckets: [],
    };

    expect(unwrapAnalyticsResponse(payload)).toBe(payload);
  });
});
