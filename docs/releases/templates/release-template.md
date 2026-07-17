<!--
TEMPLATE — bukan release aktual. Salin objek di bawah ke dalam array
`RELEASES` pada `pocket-mint-fe/src/lib/changelog.ts`, isi, lalu hapus
kategori `changes.*` yang tidak punya entri (jangan tulis array kosong
sebagai pengisi). Lihat README.md di folder ini untuk aturan pengisian
tiap bagian dan cara menentukan patch/minor/major. Bentuk data mengikuti
`src/types/changelog.ts` (`Release`).
-->

```ts
{
  version: "X.Y.Z", // SemVer, tanpa prefix "v"
  title: "...",
  publishedAt: "YYYY-MM-DD",
  status: "internal" | "beta" | "stable",
  summary: "...", // satu-dua kalimat, dampak ke pengguna
  changes: {
    added: ["..."],    // fitur baru yang berfungsi end-to-end, dengan bukti (PR/commit/test)
    improved: ["..."], // perubahan pada fitur yang sudah ada: performa, UX, validasi, pesan error
    fixed: ["..."],    // bug yang sebelumnya berdampak ke pengguna, sudah diperbaiki dan diverifikasi
    security: ["..."], // autentikasi, otorisasi, atau data sensitif — dampak dan status perbaikan, tanpa detail eksploitasi
  },
  knownIssues: [
    "...", // masalah yang diketahui tapi sengaja belum diperbaiki pada rilis ini, dengan severity dan referensi ke known-issues.md
  ],
}
```

Setelah menambahkan objek, jalankan `npx vitest run tests/changelog.test.ts`
— `assertValidReleases` menolak field wajib yang hilang, format
`version`/`publishedAt` yang salah, dan `version` duplikat.

---

### Contoh terisi (ilustrasi format saja, BUKAN release aktual Pocket Mint)

```ts
{
  version: "0.2.0",
  title: "Filter Transaksi",
  publishedAt: "2026-08-01",
  status: "beta",
  summary: "Menambah filter kategori pada halaman Transaksi dan memperbaiki pembulatan saldo dompet DEBT.",
  changes: {
    added: ["Filter kategori pada halaman Transaksi."],
    improved: ["Pesan error validasi nominal transaksi kini menyebutkan field yang salah."],
    fixed: ["Saldo dompet DEBT tidak lagi salah dibulatkan saat menampilkan sisa tagihan."],
  },
  knownIssues: [
    "[Medium] Tombol \"Ekspor laporan\" di halaman Analitik belum berfungsi — lihat known-issues.md #KI-EXPORT.",
  ],
}
```
