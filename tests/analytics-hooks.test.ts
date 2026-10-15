import { describe, expect, it } from "vitest";

import { unwrapAnalyticsResponse } from "@/src/features/analytics/hooks/useAnalytics";
import type { AnalyticsTrends } from "@/src/types/analytics";

describe("analytics API hooks", () => {
  it("unwraps the backend success envelope before charts receive trends data", () => {
    const trends: AnalyticsTrends = {
      period: "current-month",
      periodStart: "2026-07-01T00:00:00.000Z",
      periodEnd: "2026-08-01T00:00:00.000Z",
      granularity: "daily",
      buckets: [
        {
          start: "2026-07-01T00:00:00.000Z",
          end: "2026-07-02T00:00:00.000Z",
          income: 250000,
          expense: 100000,
          netCashFlow: 150000,
        },
      ],
    };

    const result = unwrapAnalyticsResponse({
      success: true,
      data: trends,
      message: "Retrieved analytics trends",
    });

    expect(result).toEqual(trends);
    expect(result.buckets).toHaveLength(1);
  });
});
