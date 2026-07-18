export type ReleaseStatus = "internal" | "beta" | "stable";

export interface ReleaseChanges {
  added?: string[];
  improved?: string[];
  fixed?: string[];
  security?: string[];
}

export interface Release {
  /** Semantic version, e.g. "0.2.0". No leading "v". */
  version: string;
  title: string;
  /** ISO date string, e.g. "2026-07-18". */
  publishedAt: string;
  summary: string;
  status: ReleaseStatus;
  changes: ReleaseChanges;
  highlights?: string[];
  knownIssues?: string[];
}
