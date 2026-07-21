# Pocket Mint — Release Status

Audit tanggal: 18 Juli 2026. Disinkronkan 18 Juli 2026 dengan hasil audit
final independen §17 pada `mvp-stable-rc-validation.md` (sumber kebenaran
validasi saat ini) — lihat catatan di bagian "Status saat ini" dan "Alasan
pemilihan status" di bawah. Sumber: kode di `pocket-mint-fe` dan
`pocket-mint-be`, hasil test suite kedua repo, HTTP smoke test 37/37,
`mvp-stable-rc-validation.md` §17, `docs/deployment-runbook.md`, dan
`docs/prisma-migration-reconciliation.md` di `pocket-mint-be`.

**Update 19 Juli 2026 — promosi ke MVP Stable:** Migrasi database production
telah dijalankan dan diverifikasi (`prisma migrate status` → "Database schema
is up to date!"; `prisma migrate diff --from-config-datasource --to-schema
prisma/schema.prisma --script` → "This is an empty migration."), deployment
Railway production sehat, dan `GET /health` mengembalikan `200`. `PM-STAB-004`
sekarang **Resolved** (lihat `known-issues.md`). Dengan `PM-STAB-003` dan
`PM-STAB-004` sama-sama tidak lagi Open, tidak ada High/Critical yang tersisa
— Pocket Mint `0.3.0` **dipromosikan ke MVP Stable** per 19 Juli 2026 (lihat
`src/lib/changelog.ts`). Bagian di bawah yang menyatakan status "MVP Beta"/
"Ready for another RC" mencerminkan titik waktu audit 18 Juli 2026 sebelum
promosi ini — dipertahankan sebagai catatan historis, lihat tabel "Status
saat ini" untuk status terkini.

**Update 20 Juli 2026 — rilis `0.4.0`:** Target Tabungan, Transaksi Rutin
(dengan pengingat), Pusat Notifikasi, dan ekspor CSV halaman Analitik telah
dirilis dan diuji (lihat `src/lib/changelog.ts`). `KI-EXPORT` sekarang
**Resolved** (lihat `known-issues.md`) — tabel "Ringkasan fitur" di bawah
telah diperbarui untuk mencerminkan ini. Perbaikan konsistensi respons
dompet (`createWallet`/`updateWallet`) dan penanganan error mutasi yang
lebih jelas (dompet, transaksi rutin, target tabungan) turut dirilis pada
versi ini.

Metodologi: setiap fitur diverifikasi dengan menelusuri rute frontend →
hook/API client → route backend → controller/service, bukan hanya dari
keberadaan komponen UI. Lihat `known-issues.md` untuk rincian temuan
(termasuk blocker `PM-STAB-001`–`PM-STAB-010` dan minor `PM-STAB-011`) dan
`stable-criteria.md` untuk kriteria target berikutnya.

**Update 21 Juli 2026 — release scope untuk promosi ke `main`:** Audit di
atas berbasis kode pada branch `dev`. Pemeriksaan branch `main` (production
git branch, frontend) menunjukkan `main` masih berada di commit `d2daa7d3`
("initial standalone frontend architecture without cache", 10 Juli 2026) —
155 commit di belakang `dev`, **tanpa** `src/lib/changelog.ts`, tanpa
`docs/releases/`, dan **tanpa git tag apa pun** di repository ini. `main`
belum pernah menerima rilis `0.1.0`, `0.3.0`, maupun `0.4.0`; `package.json`
di `main` masih `0.1.0` sekadar versi awal scaffold, bukan bukti rilis
ter-tag. Karena itu, promosi berikutnya dari `dev` ke `main` diperlakukan
sebagai **satu rilis konsolidasi tunggal versi `0.4.0`** (bukan `0.5.0`) —
sesuai `README.md` §2: selama produk masih `0.x` (belum Public Stable),
fitur backward-compatible menaikkan minor version, dan karena `0.3.0`/`0.4.0`
belum pernah benar-benar sampai ke `main`, tidak ada versi produksi yang
"dilewati" dengan melompat ke `0.5.0`. `src/lib/changelog.ts` di `dev` sudah
mencerminkan bentuk final entri `0.4.0` yang akan dipromosikan — tidak ada
perubahan versi/isi entri yang dibutuhkan pada update dokumentasi ini. Tidak
ada tag yang dibuat oleh update ini; pembuatan tag mengikuti `README.md` §7
setelah PR rilis eksplisit `dev` → `main` dibuat dan disetujui terpisah.

## Status saat ini

| | |
| --- | --- |
| **Current status** | **MVP Stable** (per 19 Juli 2026) |
| **Current release** | `0.4.0` — "Target Tabungan, Transaksi Rutin & Pusat Notifikasi", `publishedAt` 2026-07-20 (lihat `src/lib/changelog.ts`). Rilis sebelumnya `0.3.0` "MVP Stable" (`publishedAt` 2026-07-19). `v0.3.0-rc.2` adalah label evidensi validasi RC yang mendahuluinya (`mvp-stable-rc-validation.md` §17.11), tidak dipublikasikan terpisah ke changelog publik sesuai `README.md` §1a. |
| **Validation decision** | **Promoted to MVP Stable** (19 Juli 2026) — lihat Addendum "Penutupan PM-STAB-004" di `mvp-stable-rc-validation.md`. Keputusan audit `Ready for another RC` di §17.11 mencerminkan titik waktu 18 Juli 2026, sebelum migrasi production dijalankan. |
| **Promotion ke MVP Stable diblokir oleh** | Tidak ada lagi. `PM-STAB-004` (migration staging/production, High) **Resolved** 19 Juli 2026 — migrasi production dijalankan dan diverifikasi (lihat `known-issues.md`). `PM-STAB-003` (rotasi kredensial) **Resolved after forensic verification** 19 Juli 2026 — lihat `known-issues.md`. |

## Status yang direkomendasikan: **MVP Stable**

### Definisi status yang dipakai di dokumen ini

| Status | Arti |
| --- | --- |
| Internal MVP | Alur inti berjalan untuk penggunaan internal/dogfooding; pengujian ad hoc; belum tentu ter-deploy dengan hardening. |
| **MVP Beta** | Fitur inti terhubung end-to-end (FE ↔ BE ↔ DB), punya automated test, dan ada CI gate. Beberapa kriteria stable (lihat `stable-criteria.md`) belum terpenuhi atau belum terverifikasi dengan bukti. |
| MVP Stable | Seluruh item di `stable-criteria.md` terpenuhi dengan bukti pengujian, termasuk deployment production dan reconciliation database yang sudah dijalankan dan diverifikasi. |
| Public Stable | MVP Stable + siap dipakai pengguna publik (SLA, dukungan, monitoring produksi berjalan). |

### Alasan pemilihan status

**Yang mendukung MVP Beta (bukan Internal MVP):**

- Seluruh alur uang inti (wallet, transaksi, transfer, cicilan/tagihan,
  dashboard) memiliki endpoint backend nyata dengan autentikasi JWT wajib
  (`requireUser` di setiap route mutasi/baca), bukan sekadar mock frontend,
  dan sekarang **dikonsumsi nyata oleh frontend** untuk Net Worth dan
  Analitik (lihat resolusi `PM-STAB-001`/`PM-STAB-002` di bawah).
- Backend unit: **382 lulus, 0 gagal, 11 skip** (integration suite
  dijalankan terpisah). Integration Prisma: **11/11 lulus**, kini permanen
  ter-CI (bukan lagi working-tree lokal). Frontend: **170/170 lulus, 0
  gagal**. HTTP smoke test end-to-end: **37/37 lulus**. Backup/restore
  dengan `pg_dump`/`pg_restore` nyata: **PASS**. Sumber:
  `mvp-stable-rc-validation.md` §17.
- CI berjalan di kedua repo (`pocket-mint-be/.github/workflows/ci.yml`,
  `pocket-mint-fe/.github/workflows/ci.yml`) mencakup typecheck, test, build,
  dan pemindaian artefak autentikasi lama/legacy di bundle produksi.
- Ada bukti QA manual bertanggal (`docs/qa/wallet-billing-flow.md`,
  17 Juli 2026) dan responsive capture desktop+mobile bertanggal 18 Juli
  2026 untuk rute privat, dompet, transfer, kartu kredit, cicilan/tagihan.
- Error handler produksi tidak membocorkan stack trace/detail internal
  (`pocket-mint-be/src/middlewares/error.middleware.ts`), diuji di
  `errorHandler.test.ts`.

**Yang sebelumnya mencegah MVP Stable (ID resmi mengikuti `known-issues.md`,
kedua item di bawah sekarang Resolved — lihat Update 19 Juli 2026 di atas):**

- **[Resolved after forensic verification, `PM-STAB-003`]** Full-history
  forensic scan (19 Juli 2026) atas kedua repo menemukan tidak ada
  kredensial database privileged (`DATABASE_URL`/`DIRECT_URL`, password DB,
  service-role key) yang pernah ter-commit; project Production
  (`wvrdnmiuyeecqatlwbpp`) tidak pernah muncul di git history. Bukan lagi
  blocker — lihat `known-issues.md` PM-STAB-003 untuk rincian, Lessons
  Learned, dan Residual Risk yang tersisa (config publik Development dan
  API key lama yang belum di-purge dari history, non-blocking).
- **[Resolved, `PM-STAB-004`]** Reconciliation migration database
  **production nyata** sekarang sudah dijalankan dan diverifikasi (19 Juli
  2026): `prisma migrate status` → "Database schema is up to date!";
  `prisma migrate diff --from-config-datasource --to-schema
  prisma/schema.prisma --script` → "This is an empty migration."; deployment
  Railway production sehat; `GET /health` → `200`. Provisioning database
  *kosong/baru* sudah **Resolved dan terverifikasi** sebelumnya (5 migrasi
  ter-apply bersih dari nol, `prisma migrate status` "up to date" —
  `mvp-stable-rc-validation.md` §17.5). Bukan lagi blocker — lihat
  `known-issues.md` PM-STAB-004.

Tidak ada lagi issue **Critical** atau **High core-flow** yang terbuka:
`PM-STAB-001` (Net Worth), `PM-STAB-002` (Analytics period), dan
`PM-STAB-005` (password update) seluruhnya **Resolved** dan dikonfirmasi
lewat kode, automated test, **dan** smoke test HTTP/screenshot langsung
pada audit final (`mvp-stable-rc-validation.md` §17.1). `PM-STAB-006`,
`PM-STAB-007`, dan `PM-STAB-008` (Medium) juga **Resolved** dengan
konfirmasi eksplisit via smoke test HTTP (§17.6). `PM-STAB-009` (Low, label
navigasi) tetap Open — kosmetik, butuh keputusan produk. `PM-STAB-010`
(Low, integration test/changelog/backup-restore) **Resolved** — seluruh 3
sub-item tuntas dengan bukti. `PM-STAB-011` (Medium, baru) adalah
inkonsistensi tipe respons `createWallet` — non-blocking, tanpa dampak
finansial nyata. Rincian lengkap: `known-issues.md`.

Rincian lengkap seluruh 10 blocker (`PM-STAB-001`–`PM-STAB-010`) plus
`PM-STAB-011` (Medium, non-blocking), termasuk evidence, acceptance
criteria, dan regression test yang dibutuhkan, ada di `known-issues.md`.
`PM-STAB-003` **Resolved after forensic verification** 19 Juli 2026 dan
`PM-STAB-004` **Resolved** 19 Juli 2026 (migrasi production dijalankan dan
diverifikasi — lihat `known-issues.md`). Tidak ada lagi High atau Critical
yang terbuka, sehingga Pocket Mint `0.3.0` **dinyatakan MVP Stable** per 19
Juli 2026 — lihat "Update 19 Juli 2026" di bagian atas dokumen ini dan
Addendum "Penutupan PM-STAB-004" di `mvp-stable-rc-validation.md`. Keputusan
validasi **Ready for another RC** (`mvp-stable-rc-validation.md` §17.11)
mencerminkan titik waktu audit 18 Juli 2026, sebelum migrasi production
dijalankan — dipertahankan sebagai catatan historis.

## Ringkasan fitur

### Implemented (terverifikasi end-to-end)

| Fitur | Frontend | Backend | Bukti test |
| --- | --- | --- | --- |
| Register / Login (email) | `app/actions/auth.ts` | Supabase Auth + `POST /v1/users/sync` | `auth.test.ts`, `userSync.test.ts` |
| Login Google OAuth | `app/actions/auth.ts:signInWithGoogle` | Supabase Auth | — |
| Logout | `app/actions/auth.ts:logout` | Supabase Auth | — |
| Lupa password (kirim email reset) | `app/login/page.tsx` (`resetPasswordForEmail`) | Supabase Auth | — |
| Reset password (dari link email) | `app/auth/reset-password/page.tsx` (`updateUser`) | Supabase Auth | — |
| Dompet: list/create/update/delete | `src/features/wallets/hooks/useWallets.ts` | `walletRoutes.ts` → `account.controller.ts` | `walletService.test.ts`, `walletUpdate.test.ts`, `walletDeletion.test.ts`, `walletControllerBoundary.test.ts` |
| Sparkline saldo dompet | `useWallets` (`/wallets/:id/sparkline`) | `getWalletSparkline` | `walletSparkline.test.ts` |
| Transaksi: create/update/delete, income/expense/transfer | `src/features/transactions/hooks/useTransactions.ts` | `transaction.routes.ts` → `transaction.controller.ts` | `transactionService.test.ts`, `transactionBalance.test.ts`, `transactionController.test.ts` |
| Ringkasan bulanan (P&L) | `useMonthlySummary` | `GET /transactions/summary` | `transactionReporting.test.ts` |
| Cicilan/Tagihan: list, bayar | `src/features/bills/hooks/useBills.ts` | `/v1/bills` & `/v1/installments` → `installment.controller.ts` | `installment.test.ts`, `installmentPaymentService.test.ts`, `installmentQueryService.test.ts` |
| Pembuatan cicilan (via transaksi EXPENSE pada wallet DEBT) | `AddTransactionModal.tsx` | `transaction.controller.ts` + `installment` service | `installment.test.ts` |
| Rate paylater | `usePaylaterRates` | `GET /installments/rates` | — (data statis) |
| Dashboard summary — **Resolved, `PM-STAB-001`** | `app/(app)/dashboard/page.tsx` memanggil `useDashboardSummary` → `GET /v1/dashboard/summary` | `GET /dashboard/summary` (`calculateNetWorth`) | `dashboardQueryService.test.ts`, `dashboardControllerBoundary.test.ts`, smoke test HTTP nyata + screenshot §17.6/§17.8 |
| Analitik (cash flow, kategori, komposisi dompet) — **Resolved, `PM-STAB-002`** | `app/(app)/analytics/page.tsx` memakai `useAllTransactions` → `GET /transactions/all` dengan filter tanggal client-side | dihitung dari `/transactions/all`, `/wallets`, `/bills` | screenshot filter "6 bulan" terisi §17.8 |
| Ubah password di halaman Profil — **Resolved, `PM-STAB-005`** | `app/(app)/profile/page.tsx` memanggil `signInWithPassword` + `updateUser` sungguhan | Supabase Auth (tidak ada kolom password di DB Pocket Mint) | `tests/profile-page.test.ts` (19 assertion) |
| Kategori (daftar tetap, read-only) | `useCategories` | `GET /categories` | `categoryService.test.ts`, `categoryController.test.ts` |
| Net worth = assets − outstanding debt (PD-001) | `wallets`/`dashboard` (backend service) | `calculateNetWorth` (`utils/financial.ts`) | `dashboardQueryService.test.ts:69-73` |
| CHANGELOG / release notes (`pocket-mint-fe`, PM-STAB-010B) | `src/lib/changelog.ts` (`RELEASES`), `app/changelog/page.tsx`, ringkasan di `app/page.tsx` | — (data statis, tidak ada backend) | `tests/changelog.test.ts` |
| Target Tabungan (create/update/progress/archive) | `src/features/savingGoals/hooks/useSavingGoals.ts`, `app/(app)/target-tabungan/page.tsx` | `savingGoal.routes.ts` → `savingGoal.controller.ts` → `savingGoal.service.ts` | `tests/saving-goals.test.ts` (FE), `savingGoalService.test.ts`, `savingGoalController.test.ts` (BE) |
| Transaksi Rutin (template + jadwal + `nextDueDate`) | `src/features/recurring/hooks/useRecurringTransactions.ts`, `app/(app)/transactions/rutin/page.tsx` | `recurringTransaction.routes.ts` → `recurringTransaction.controller.ts` → `recurringTransaction.service.ts` | `tests/recurring-transactions.test.ts` (FE), backend recurring-transaction service tests |
| Pengingat & Pusat Notifikasi | `src/features/notifications/hooks/useNotifications.ts`, `app/(app)/notifications/page.tsx` | `notification.routes.ts` → `notification.controller.ts`, `recurringReminderEngine.service.ts` | `tests/notification-center.test.ts` (FE), `notificationService.test.ts`, `notificationController.test.ts`, `recurringReminderEngineService.test.ts` (BE) |
| Ekspor CSV halaman Analitik — **Resolved, `KI-EXPORT`** | `app/(app)/analytics/page.tsx` (tombol `Download`) → `exportTransactionsCsv` di `src/features/transactions/hooks/useTransactions.ts` | dihitung dari `/transactions/all` (tidak ada endpoint export terpisah — CSV dibangun client-side) | `tests/analytics-export.test.ts` |
| Dompet: status loading/error + konsistensi respons create/update — **Resolved, `PM-STAB-011`** | `app/(app)/wallets/page.tsx`, `EditWalletModal.tsx` | `account.controller.ts` (`createWallet`/`updateWallet` kini pakai `serializeWallet`, sama seperti `getAllWallets`) | `tests/wallets-stability.test.ts`, `tests/wallet-page.test.ts` (FE), `walletControllerBoundary.test.ts`, `walletUpdate.test.ts` (BE) |
| Pesan error saat aksi mutasi gagal (hapus transaksi rutin, arsip target tabungan) | `toast()` di `components/ui/toaster.tsx`, dipakai di `wallets/page.tsx`, `transactions/rutin/page.tsx`, `target-tabungan/page.tsx` | — (penanganan di frontend, error asli dari backend diteruskan) | `tests/recurring-transactions.test.ts`, `tests/saving-goals.test.ts` |

### Partially Implemented

| Fitur | Catatan |
| --- | --- |
| Navigasi (5 vs 6 item) | Berfungsi penuh, tetapi bottom nav mobile menampilkan 6 ikon (termasuk trigger dropdown akun terpisah), bukan 5 item "Akun" sesuai kontrak desain — deviasi dokumentasi vs implementasi, bukan bug fungsional (`PM-STAB-009`, Low). |

### UI Only

Tidak ada fitur berstatus UI Only saat ini. `PM-STAB-005` (form ubah
password) sebelumnya berada di kategori ini — sudah dipindahkan ke
"Implemented" di atas setelah resolusi 18 Juli 2026.

### Not Implemented

| Fitur | Catatan |
| --- | --- |
| Manajemen kategori (create/update/delete) | Tidak ada route/controller/UI untuk ini. Kategori adalah daftar tetap sesuai `skills/financial-logic.skill.md` ("Category is optional metadata") — kemungkinan besar ini memang bukan gap, melainkan scope yang disengaja. |
| CHANGELOG / release notes (`pocket-mint-be`) | Belum ada struktur changelog di backend. Lihat baris terpisah di "Implemented" untuk status `pocket-mint-fe` (PM-STAB-010B). |

### Needs Verification

Tidak ada lagi item terkait `PM-STAB-004` di tabel ini — reconciliation
migration production dan deployment sudah dijalankan dan diverifikasi
(lihat "Update 19 Juli 2026" di atas dan `known-issues.md` PM-STAB-004).

| Item | Alasan | Blocker ID |
| --- | --- | --- |
| Purge git history (residual, non-blocking) | `docs/deployment-runbook.md` §11 — config publik Development dan API key lama yang retired masih terlihat di history, purge masih "PENDING EXPLICIT APPROVAL (do not execute)". Bukan blocker: forensic re-verification 19 Juli 2026 mengonfirmasi tidak ada kredensial privileged (`DATABASE_URL`/`DIRECT_URL`/service-role key) di history manapun — lihat `known-issues.md` PM-STAB-003 (Resolved after forensic verification) dan §10 runbook. | Residual Risk terkait `PM-STAB-003` (Resolved, tidak lagi blocker) |

Uji backup & restore data **tidak lagi berada di tabel ini** — sudah
Resolved dengan drill nyata memakai `pg_dump`/`pg_restore`/`psql`
(`mvp-stable-rc-validation.md` §17.7), lihat `known-issues.md` PM-STAB-010.

## Ringkasan pengujian otomatis (bukti, audit final `v0.3.0-rc.2`, 18 Juli 2026)

Sumber: `mvp-stable-rc-validation.md` §17 (audit final independen, sumber
kebenaran saat ini — menggantikan angka §1–§16 rc.1 di bawah).

- Backend unit (`pocket-mint-be`): `npm run test` → **382 lulus, 0 gagal, 11
  skip** (integration suite `prismaAdapter.integration.test.ts` dijalankan
  terpisah dengan `TEST_DATABASE_URL`, bukan kegagalan).
- Integration Prisma (`npm run test:integration`): **11/11 lulus**, kini
  permanen ter-commit dan ter-CI (commit `0c6c370`).
- Frontend (`pocket-mint-fe`): `npx vitest run` → **170/170 lulus, 0 gagal**.
- Typecheck (BE+FE): PASS. Lint (FE): PASS. Lint (BE): N/A (tidak
  dikonfigurasi, bukan kegagalan).
- Production build (BE+FE): PASS.
- Provisioning database kosong + `migrate deploy` + `migrate status`: PASS
  ("Database schema is up to date!").
- HTTP smoke test end-to-end (core flow + financial integrity + cross-user
  isolation): **37/37 lulus** (§17.6).
- Backup dan restore dengan `pg_dump`/`pg_restore`/`psql` nyata: **PASS**,
  row count sumber dan hasil restore identik persis, 0 orphan FK (§17.7).
- Responsive desktop + mobile (Playwright, login sungguhan): **PASS**, tidak
  ada horizontal overflow, Net Worth dan Analitik terkonfirmasi benar secara
  visual (§17.8).

**Angka historis rc.1 (§1–§16, dipertahankan sebagai evidence, bukan lagi
digunakan untuk keputusan):** Backend 392/392 dengan `TEST_DATABASE_URL`
(381/381 tanpa), Frontend 170/170, Integration Prisma 11/11.
