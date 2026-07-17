# Pocket Mint — Release Status

Audit tanggal: 18 Juli 2026. Diperbarui 18 Juli 2026 berdasarkan
`mvp-stability-audit.md` (audit stabilitas MVP, tanggal sama) untuk
menghilangkan kontradiksi yang ditemukan audit tersebut — lihat catatan di
bagian "Alasan pemilihan status" dan "Ringkasan fitur" di bawah. Sumber:
kode di `pocket-mint-fe` (branch kerja saat ini) dan `pocket-mint-be` (branch
`dev`), hasil `npx vitest run` pada kedua repo, `docs/qa/wallet-billing-flow.md`,
`docs/deployment-runbook.md`, dan `docs/prisma-migration-reconciliation.md` di
`pocket-mint-be`.

Metodologi: setiap fitur diverifikasi dengan menelusuri rute frontend →
hook/API client → route backend → controller/service, bukan hanya dari
keberadaan komponen UI. Lihat `known-issues.md` untuk rincian temuan
(termasuk blocker `PM-STAB-001`–`PM-STAB-010`) dan `stable-criteria.md`
untuk kriteria target berikutnya.

## Status yang direkomendasikan: **MVP Beta**

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
  (`requireUser` di setiap route mutasi/baca), bukan sekadar mock frontend.
- Backend: 366 test lulus, 0 gagal (4 skip karena butuh `TEST_DATABASE_URL`).
  Frontend: 111 test lulus, 0 gagal.
- CI berjalan di kedua repo (`pocket-mint-be/.github/workflows/ci.yml`,
  `pocket-mint-fe/.github/workflows/ci.yml`) mencakup typecheck, test, build,
  dan pemindaian artefak autentikasi lama/legacy di bundle produksi.
- Ada bukti QA manual bertanggal (`docs/qa/wallet-billing-flow.md`,
  17 Juli 2026) untuk rute privat, dompet, transfer, kartu kredit, tagihan,
  dan responsivitas.
- Error handler produksi tidak membocorkan stack trace/detail internal
  (`pocket-mint-be/src/middlewares/error.middleware.ts`), diuji di
  `errorHandler.test.ts`.

**Yang mencegah MVP Stable saat ini:**
- **[Critical, `PM-STAB-001`]** Dashboard menghitung Net Worth sendiri di
  frontend (`app/(app)/dashboard/page.tsx:139-148`) dan mengabaikan utang
  (`netWorth = totalAssets`, endpoint backend
  `GET /v1/dashboard/summary` yang sudah benar tidak pernah dipanggil). Ini
  adalah kesalahan finansial pada metrik paling terlihat di aplikasi, bukan
  sekadar gap kecil — lihat `mvp-stability-audit.md` §9 dan
  `known-issues.md`.
- **[High, `PM-STAB-002`]** Halaman Analitik dan bagian Dashboard yang
  bergantung pada riwayat transaksi memakai endpoint yang di-scope ke bulan
  berjalan (`GET /transactions`), bukan `GET /transactions/all` — filter
  periode "3 bulan"/"6 bulan" secara efektif tidak menerapkan rentang waktu
  yang dipilih pengguna. Lihat `mvp-stability-audit.md` §10 dan
  `known-issues.md`.
- **[High, `PM-STAB-003`]** Reconciliation migration database
  staging/production ditandai eksplisit sebagai **manual, belum
  dijalankan** oleh dokumen backend sendiri
  (`docs/prisma-migration-reconciliation.md` §11). Provisioning "fresh
  database" hanya dibuktikan pada database disposable lokal, bukan staging
  atau production sungguhan.
- **[High, `PM-STAB-004`]** `docs/deployment-runbook.md` §10–11
  (13 Juli 2026) mencatat password database dan API key lama masih ada di
  git history, menunggu rotasi dan purge yang **belum dieksekusi**; tidak
  ada dokumen lebih baru di repo yang mengonfirmasi ini sudah selesai.
- **[High, `PM-STAB-005`]** Fitur UI-only yang menyesatkan pengguna: form
  ubah password di halaman Profil menampilkan pesan sukses palsu tanpa
  memanggil API apa pun (lihat `known-issues.md`).
- **[Medium, `PM-STAB-006`–`PM-STAB-008`]** Sisa pembulatan cicilan yang tak
  tertagih setelah status `SETTLED`, backend tidak menolak `INCOME` ke
  wallet DEBT, dan `skills/financial-logic.skill.md` tidak sinkron dengan
  implementasi backend (termasuk klaim formula Net Worth yang salah — lihat
  baris "Net worth" pada tabel fitur di bawah). Lihat `known-issues.md`.
- **[Low, `PM-STAB-009`–`PM-STAB-010`]** Tidak ada `CHANGELOG.md`; model
  Prisma `Transfer` tidak terpakai; 4 test integrasi Prisma di-skip; tidak
  ada bukti uji backup/restore data produksi — satu-satunya bukti terkait
  adalah replay migrasi skema pada database sekali pakai, bukan uji
  pemulihan data. Tidak ada bukti deployment production yang benar-benar
  sudah dijalankan dan diverifikasi dari dalam repository (runbook bersifat
  prosedural, bukan laporan hasil).

Rincian lengkap seluruh 10 blocker (`PM-STAB-001`–`PM-STAB-010`), termasuk
evidence, acceptance criteria, dan regression test yang dibutuhkan, ada di
`known-issues.md`. Karena kombinasi ini — terutama satu Critical dan empat
High yang masih terbuka — Pocket Mint **tidak dapat dinyatakan stable**,
walau bukti yang ada tetap mendukung status Beta yang solid untuk sebagian
besar core flow, dengan gap yang jelas dan dapat dilacak.

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
| Dashboard summary — **backend benar, frontend salah, lihat `PM-STAB-001`** | `app/(app)/dashboard/page.tsx` (tidak memanggil endpoint di kolom Backend; menghitung Net Worth sendiri secara salah) | `GET /dashboard/summary` (benar, tapi dead code — tidak dipanggil FE) | `dashboardQueryService.test.ts`, `dashboardControllerBoundary.test.ts` (backend saja; **tidak ada test frontend** untuk nilai yang dirender) |
| Analitik (cash flow, kategori, komposisi dompet) — **periode/rentang salah, lihat `PM-STAB-002`** | `app/(app)/analytics/page.tsx` | dihitung dari data `/transactions` (auto-filtered bulan berjalan, bukan `/transactions/all`), `/wallets`, `/bills` (tidak ada endpoint khusus) | — |
| Kategori (daftar tetap, read-only) | `useCategories` | `GET /categories` | `categoryService.test.ts`, `categoryController.test.ts` |
| Net worth = assets − outstanding debt (PD-001) | `wallets`/`dashboard` (backend service) | `calculateNetWorth` (`utils/financial.ts`) | `dashboardQueryService.test.ts:69-73` |

### Partially Implemented

| Fitur | Catatan |
| --- | --- |
| Halaman Analitik | Data dan grafik nyata (real data), tetapi tombol "Ekspor laporan" tidak punya handler (`known-issues.md` `KI-EXPORT`) **dan** filter periode tidak benar-benar mengambil data lintas bulan (`PM-STAB-002`). |
| Navigasi "Cicilan" | Berfungsi (redirect `/cicilan` → `/tagihan`), tetapi label nav yang tampil adalah "Tagihan", bukan "Cicilan" seperti yang diwajibkan `skills/design.md` — deviasi dokumentasi vs implementasi, bukan bug fungsional (`PM-STAB-009`). |
| Dashboard Net Worth | Backend benar dan teruji, tetapi frontend menghitung ulang secara lokal dan mengabaikan utang — lihat baris "Dashboard summary" di atas dan `PM-STAB-001` (Critical). |

### UI Only

| Fitur | Bukti |
| --- | --- |
| Ubah password di halaman Profil (`app/(app)/profile/page.tsx`) | `handleSubmit` (baris 73–97) hanya `await new Promise((resolve) => window.setTimeout(resolve, 900))` lalu menampilkan pesan sukses. Tidak ada pemanggilan Supabase `updateUser` atau endpoint backend apa pun. Bandingkan dengan `app/auth/reset-password/page.tsx` yang benar-benar memanggil `supabase.auth.updateUser`. |

### Not Implemented

| Fitur | Catatan |
| --- | --- |
| Ekspor laporan Analitik | Tombol ada di UI (`app/(app)/analytics/page.tsx` baris ~276–282), tanpa `onClick` atau logic ekspor. |
| Manajemen kategori (create/update/delete) | Tidak ada route/controller/UI untuk ini. Kategori adalah daftar tetap sesuai `skills/financial-logic.skill.md` ("Category is optional metadata") — kemungkinan besar ini memang bukan gap, melainkan scope yang disengaja. |
| CHANGELOG / release notes | Tidak ada file di kedua repo. |

### Needs Verification

| Item | Alasan | Blocker ID |
| --- | --- | --- |
| Reconciliation migration di staging/production | `docs/prisma-migration-reconciliation.md` §11 menyatakan langkah `migrate resolve --applied` dan `migrate deploy` terhadap database staging/production bersifat manual dan tidak ada bukti eksekusi di repo. | `PM-STAB-004` (High) |
| Rotasi kredensial & purge git history | `docs/deployment-runbook.md` §10–11 (13 Juli 2026) menyatakan password database dan API key lama masih ada di history, purge "PENDING EXPLICIT APPROVAL (do not execute)". Tidak ada dokumen yang lebih baru mengonfirmasi penyelesaian. | `PM-STAB-003` (High) |
| Deployment production aktif | Runbook bersifat prosedural (langkah yang harus dijalankan), tidak ada laporan hasil deployment sungguhan di repo. | terkait `PM-STAB-004` |
| Uji backup & restore data | Tidak ditemukan bukti uji restore dari backup produksi nyata. | `PM-STAB-010` (Low) |

## Ringkasan pengujian otomatis (bukti, tanggal audit)

- Backend (`pocket-mint-be`): `npx vitest run` → 366 lulus, 0 gagal, 4 skip
  (butuh `TEST_DATABASE_URL`, lihat `test/prismaAdapter.integration.test.ts`).
- Frontend (`pocket-mint-fe`): `npx vitest run` → 111 lulus, 0 gagal.
- Playwright: `test-results/.last-run.json` di root repo mencatat
  `"status": "passed"`, tidak ada failed test tercatat (cakupan tepatnya lihat
  `docs/qa/wallet-billing-flow.md`).
