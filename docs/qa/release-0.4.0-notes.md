# QA Notes — 0.4.0 (Target Tabungan, Transaksi Rutin & Pusat Notifikasi)

Tanggal: 20 Juli 2026.

## Cakupan automated test

Fitur di rilis ini (Target Tabungan, Transaksi Rutin, Pengingat/Pusat
Notifikasi, ekspor CSV Analitik, perbaikan status loading/error Dompet, dan
konsistensi respons `createWallet`/`updateWallet`) dicakup oleh automated
test — lihat baris terkait di "Ringkasan fitur" pada
`docs/releases/release-status.md` untuk daftar file test per fitur
(`tests/saving-goals.test.ts`, `tests/recurring-transactions.test.ts`,
`tests/notification-center.test.ts`, `tests/analytics-export.test.ts`,
`tests/wallets-stability.test.ts`, dan padanannya di `pocket-mint-be`).

## Manual browser verification

**Manual verification pending.** Tidak ada capture Playwright atau QA pass
manual bertanggal untuk fitur-fitur di atas — `docs/qa/wallet-billing-flow.md`
(17 Juli 2026) mendahului rilis ini dan hanya mencakup alur dompet/tagihan
versi sebelumnya. Jadwalkan QA manual (desktop + mobile 390×844, mengikuti
format `wallet-billing-flow.md`) sebelum mengandalkan rilis ini untuk
verifikasi visual/UX di luar cakupan automated test.
