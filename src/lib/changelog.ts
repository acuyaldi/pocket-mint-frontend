import type { Release, ReleaseChanges, ReleaseStatus } from "@/src/types/changelog";

/**
 * Source of truth for the Pocket Mint changelog. Consumed by the landing
 * page and `/changelog`. Entries describe user-facing capabilities only —
 * no internal engineering, CI, or operational detail belongs here.
 */
export const RELEASES: Release[] = [
  {
    version: "0.5.0",
    title: "Anggaran Bulanan per Kategori",
    publishedAt: "2026-07-22",
    summary:
      "Pocket Mint kini mendukung Anggaran: batas pengeluaran bulanan per kategori dengan status pemakaian yang dihitung otomatis dari transaksi. Seluruh rute aplikasi kini terlindungi secara default, dan target sentuh navigasi mobile serta asosiasi label formulir kini lebih konsisten.",
    status: "stable",
    changes: {
      added: [
        "Anggaran: atur batas pengeluaran bulanan per kategori, pantau status pemakaian (terpakai, sisa, persentase) yang dihitung otomatis dari transaksi, dan arsipkan atau pulihkan anggaran yang tidak lagi digunakan",
      ],
      fixed: [
        "Target sentuh navigasi bawah pada perangkat mobile dipulihkan ke ukuran yang mudah diakses",
        "Asosiasi label pada formulir dengan kolom terbungkus (mis. kolom nominal berprefiks) tidak lagi bertabrakan dengan id ganda",
      ],
      security: [
        "Seluruh rute aplikasi kini terlindungi secara default; hanya rute publik yang diizinkan tanpa autentikasi",
      ],
    },
  },
  {
    version: "0.4.0",
    title: "Target Tabungan, Transaksi Rutin & Pusat Notifikasi",
    publishedAt: "2026-07-20",
    summary:
      "Pocket Mint kini mendukung target tabungan, transaksi rutin dengan pengingat, dan pusat notifikasi terpusat. Aplikasi kini juga tersedia dalam Bahasa Indonesia dan Inggris. Halaman Dompet dan alur transaksi rutin/target tabungan kini menampilkan status loading dan error yang lebih jelas.",
    status: "stable",
    changes: {
      added: [
        "Target Tabungan: buat dan pantau target tabungan dengan progres otomatis, tandai selesai atau arsipkan",
        "Transaksi Rutin: jadwalkan transaksi berulang (harian, mingguan, bulanan, tahunan) dengan pengingat opsional",
        "Pusat Notifikasi: pengingat tagihan dan transaksi rutin yang akan datang, dapat ditandai dibaca atau dikonfirmasi",
        "Ekspor laporan Analitik ke CSV",
        "Dukungan Bahasa Indonesia dan Inggris di seluruh aplikasi, dengan opsi ganti bahasa kapan saja",
      ],
      improved: [
        "Halaman Dompet menampilkan status loading, error, dan kosong yang lebih jelas",
        "Pesan kesalahan yang lebih jelas saat aksi gagal (menghapus transaksi rutin, mengarsipkan target tabungan)",
        "Pusat Notifikasi menampilkan status kosong dan error yang lebih jelas",
        "Tampilan dan alur edit transaksi lebih konsisten dan jelas umpan baliknya",
        "Indikator loading saat logout",
      ],
      fixed: [
        "Data dompet yang baru dibuat atau diperbarui kini konsisten dengan data yang ditampilkan di daftar dompet",
      ],
    },
    knownIssues: ["Label navigasi menyimpang dari kontrak desain 5-item"],
  },
  {
    version: "0.3.0",
    title: "MVP Stable",
    publishedAt: "2026-07-19",
    summary:
      "Pocket Mint kini stabil dan siap produksi. Seluruh alur keuangan inti telah diuji end-to-end, database produksi berhasil dimigrasi, dan seluruh blocker stabilitas MVP telah diselesaikan.",
    status: "stable",
    changes: {
      improved: [
        "Stabilitas alur dompet, transaksi, transfer, cicilan, dashboard, dan analitik",
        "Konsistensi navigasi dan terminologi produk",
        "Kesiapan produksi dan keandalan rilis",
      ],
      fixed: [
        "Rekonsiliasi migration database produksi",
        "Sinkronisasi skema dompet dan tagihan",
        "Penghapusan model transfer usang yang tidak terpakai",
        "Blocker stabilitas MVP yang sebelumnya terdokumentasi kini telah diselesaikan",
      ],
      security: [
        "Pengerasan autentikasi dan penanganan error produksi",
        "Pengamanan alur rilis dan deployment",
      ],
    },
    highlights: [
      "Seluruh 170 test frontend dan 382 test backend lulus tanpa kegagalan",
      "Smoke test HTTP end-to-end 42/42 lulus mencakup seluruh alur inti dan isolasi data pengguna",
      "Backup dan pemulihan data telah diuji dengan snapshot nyata dan verifikasi integritas baris",
      "CI otomatis mencakup typecheck, test, build, dan integration test di kedua repositori",
    ],
    knownIssues: [
      "Tombol \"Ekspor laporan\" di halaman Analitik belum berfungsi (KI-EXPORT)",
      "Label navigasi menyimpang dari kontrak desain 5-item (PM-STAB-009)",
    ],
  },
  {
    version: "0.1.0",
    title: "MVP Stable",
    publishedAt: "2026-07-18",
    summary:
      "Rilis stabil pertama Pocket Mint yang tersedia untuk publik — ruang kerja finansial privat untuk mengelola dompet, transaksi, dan cicilan dalam satu tempat.",
    status: "stable",
    changes: {
      added: [
        "Registrasi, login, dan logout email, termasuk login Google OAuth",
        "Lupa password dan reset password melalui link email",
        "Pengelolaan dompet aset dan kewajiban (tunai, bank, e-wallet, kartu kredit, paylater, dan pinjaman)",
        "Pencatatan dan penelusuran transaksi pemasukan, pengeluaran, dan transfer antar-dompet",
        "Pemantauan cicilan/tagihan beserta progres pembayaran per termin",
        "Ringkasan dashboard: posisi keuangan bersih, ringkasan dompet, dan aktivitas terbaru",
        "Ringkasan dan analitik keuangan: arus kas, kategori pengeluaran, dan komposisi dompet",
        "Daftar kategori transaksi (read-only)",
      ],
      improved: [
        "Pengalaman responsif penuh di desktop, tablet, dan perangkat seluler",
        "Penyempurnaan navigasi dan konsistensi tampilan landing page",
      ],
      security: [
        "Seluruh route mutasi dan baca mewajibkan autentikasi JWT (requireUser)",
        "Error handler produksi tidak membocorkan stack trace atau detail internal",
      ],
    },
    knownIssues: [
      "Tombol \"Ekspor laporan\" di halaman Analitik belum berfungsi",
      "Bilah navigasi pada perangkat seluler menampilkan menu tambahan di luar lima menu utama",
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
