import type { Release, ReleaseChanges, ReleaseStatus } from "@/src/types/changelog";

/**
 * Source of truth for the Pocket Mint changelog. Consumed by the landing
 * page and `/changelog`. Baseline entry reflects only what
 * `docs/releases/release-status.md` (audit 18 Juli 2026) verified as
 * implemented end-to-end — no aspirational or unverified claims.
 */
export const RELEASES: Release[] = [
  {
    version: "0.1.0",
    title: "MVP Beta",
    publishedAt: "2026-07-18",
    summary:
      "Alur inti Pocket Mint (autentikasi, dompet, transaksi, cicilan, dashboard, analitik) terhubung end-to-end dari frontend ke backend dengan automated test.",
    status: "beta",
    changes: {
      added: [
        "Registrasi, login, dan logout email, termasuk login Google OAuth",
        "Lupa password dan reset password melalui link email",
        "Manajemen dompet: buat, ubah, hapus, dan sparkline saldo",
        "Pencatatan transaksi income, expense, dan transfer antar-dompet",
        "Ringkasan bulanan (pemasukan vs pengeluaran)",
        "Cicilan: pembuatan, daftar, dan pembayaran",
        "Dashboard dengan net worth, ringkasan dompet, dan aktivitas terbaru",
        "Halaman analitik: arus kas, kategori, dan komposisi dompet",
        "Daftar kategori transaksi (read-only)",
      ],
      security: [
        "Seluruh route mutasi dan baca mewajibkan autentikasi JWT (requireUser)",
        "Error handler produksi tidak membocorkan stack trace atau detail internal",
      ],
    },
    highlights: [
      "QA manual bertanggal untuk rute privat, dompet, transfer, kartu kredit, dan cicilan (docs/qa/wallet-billing-flow.md, 17 Juli 2026)",
      "CI mencakup typecheck, test, build, dan pemindaian artefak autentikasi lama pada bundle produksi",
    ],
    knownIssues: [
      "Tombol \"Ekspor laporan\" di halaman Analitik belum berfungsi (known-issues.md KI-EXPORT)",
      "Label navigasi menyimpang dari kontrak desain 5-item (known-issues.md PM-STAB-009)",
      "Migration staging/production belum dieksekusi — memblokir promosi ke MVP Stable (known-issues.md PM-STAB-004)",
    ],
  },
];

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const STATUSES: ReleaseStatus[] = ["internal", "beta", "stable"];
const CHANGE_KEYS: (keyof ReleaseChanges)[] = ["added", "improved", "fixed", "security"];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(isNonEmptyString);
}

/** Collects validation errors for a single release; empty array means valid. */
export function validateRelease(release: Release): string[] {
  const errors: string[] = [];

  if (!VERSION_PATTERN.test(release.version)) {
    errors.push(`invalid semantic version: "${release.version}"`);
  }
  if (!isNonEmptyString(release.title)) {
    errors.push(`missing title for version "${release.version}"`);
  }
  if (!DATE_PATTERN.test(release.publishedAt)) {
    errors.push(`invalid publishedAt for version "${release.version}": "${release.publishedAt}"`);
  }
  if (!isNonEmptyString(release.summary)) {
    errors.push(`missing summary for version "${release.version}"`);
  }
  if (!STATUSES.includes(release.status)) {
    errors.push(`invalid status for version "${release.version}": "${release.status}"`);
  }
  if (!release.changes || typeof release.changes !== "object") {
    errors.push(`missing changes for version "${release.version}"`);
  } else {
    for (const key of CHANGE_KEYS) {
      const entries = release.changes[key];
      if (entries !== undefined && !isStringArray(entries)) {
        errors.push(`changes.${key} must be a non-empty string array for version "${release.version}"`);
      }
    }
  }
  if (release.highlights !== undefined && !isStringArray(release.highlights)) {
    errors.push(`highlights must be a non-empty string array for version "${release.version}"`);
  }
  if (release.knownIssues !== undefined && !isStringArray(release.knownIssues)) {
    errors.push(`knownIssues must be a non-empty string array for version "${release.version}"`);
  }

  return errors;
}

/** Throws with every collected error if any release in the list is invalid. */
export function assertValidReleases(releases: Release[]): void {
  const errors = releases.flatMap(validateRelease);
  const versions = releases.map((r) => r.version);
  const duplicates = versions.filter((v, i) => versions.indexOf(v) !== i);
  for (const dup of new Set(duplicates)) {
    errors.push(`duplicate version: "${dup}"`);
  }
  if (errors.length > 0) {
    throw new Error(`Invalid changelog data:\n${errors.join("\n")}`);
  }
}

/** Compares semantic versions; positive when `a` is newer than `b`. */
export function compareVersions(a: string, b: string): number {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Returns a new array sorted newest-first by version, falling back to publishedAt. */
export function sortReleases(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => {
    const byVersion = compareVersions(b.version, a.version);
    if (byVersion !== 0) return byVersion;
    return b.publishedAt.localeCompare(a.publishedAt);
  });
}

/** Validated, newest-first changelog data. Use this from pages/components. */
export function getReleases(): Release[] {
  assertValidReleases(RELEASES);
  return sortReleases(RELEASES);
}

export function getLatestRelease(): Release | undefined {
  return getReleases()[0];
}
