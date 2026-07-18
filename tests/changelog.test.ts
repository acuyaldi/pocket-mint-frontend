import { describe, expect, it } from "vitest";

import {
  RELEASES,
  assertValidReleases,
  compareVersions,
  getLatestRelease,
  getReleases,
  sortReleases,
  validateRelease,
} from "@/src/lib/changelog";
import type { Release } from "@/src/types/changelog";

describe("changelog data", () => {
  it("has a valid, non-empty baseline release list", () => {
    expect(RELEASES.length).toBeGreaterThan(0);
    expect(() => assertValidReleases(RELEASES)).not.toThrow();
  });

  it("getReleases returns releases sorted newest-first", () => {
    const releases = getReleases();
    for (let i = 1; i < releases.length; i++) {
      expect(compareVersions(releases[i - 1].version, releases[i].version)).toBeGreaterThanOrEqual(0);
    }
  });

  it("getLatestRelease returns the newest version", () => {
    const latest = getLatestRelease();
    const sorted = sortReleases(RELEASES);
    expect(latest?.version).toBe(sorted[0]?.version);
  });
});

describe("compareVersions", () => {
  it("orders by major, minor, then patch", () => {
    expect(compareVersions("1.0.0", "0.9.9")).toBeGreaterThan(0);
    expect(compareVersions("0.2.0", "0.10.0")).toBeLessThan(0);
    expect(compareVersions("1.2.3", "1.2.3")).toBe(0);
    expect(compareVersions("1.2.0", "1.2.3")).toBeLessThan(0);
  });
});

describe("sortReleases", () => {
  it("sorts descending by version regardless of input order", () => {
    const releases = [
      makeRelease({ version: "0.1.0", publishedAt: "2026-01-01" }),
      makeRelease({ version: "1.2.0", publishedAt: "2026-03-01" }),
      makeRelease({ version: "0.9.0", publishedAt: "2026-02-01" }),
    ];
    expect(sortReleases(releases).map((r) => r.version)).toEqual(["1.2.0", "0.9.0", "0.1.0"]);
  });

  it("does not mutate the input array", () => {
    const releases = [
      makeRelease({ version: "0.1.0" }),
      makeRelease({ version: "0.2.0" }),
    ];
    const original = [...releases];
    sortReleases(releases);
    expect(releases).toEqual(original);
  });
});

describe("validateRelease", () => {
  it("accepts a well-formed release", () => {
    expect(validateRelease(makeRelease({}))).toEqual([]);
  });

  it("flags an invalid semantic version", () => {
    expect(validateRelease(makeRelease({ version: "v1.0" }))).toContain(
      'invalid semantic version: "v1.0"',
    );
  });

  it("flags an invalid publishedAt", () => {
    expect(validateRelease(makeRelease({ publishedAt: "18 July 2026" }))).toContain(
      'invalid publishedAt for version "0.1.0": "18 July 2026"',
    );
  });

  it("flags an invalid status", () => {
    const invalid = makeRelease({}) as unknown as Release;
    // @ts-expect-error intentionally invalid for the test
    invalid.status = "draft";
    expect(validateRelease(invalid).some((e) => e.includes("invalid status"))).toBe(true);
  });

  it("flags an empty string inside a changes list", () => {
    const invalid = makeRelease({ changes: { added: [""] } });
    expect(invalid.changes.added).toEqual([""]);
    expect(validateRelease(invalid).some((e) => e.includes("changes.added"))).toBe(true);
  });
});

describe("assertValidReleases", () => {
  it("throws when versions collide", () => {
    const releases = [makeRelease({ version: "0.1.0" }), makeRelease({ version: "0.1.0" })];
    expect(() => assertValidReleases(releases)).toThrow(/duplicate version/);
  });
});

function makeRelease(overrides: Partial<Release>): Release {
  return {
    version: "0.1.0",
    title: "Test Release",
    publishedAt: "2026-07-18",
    summary: "A test release.",
    status: "beta",
    changes: { added: ["Something shipped"] },
    ...overrides,
  };
}
