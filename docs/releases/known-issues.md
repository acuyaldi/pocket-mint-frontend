# Pocket Mint — Known Issues

Audit awal: 18 Juli 2026. Diperbarui: 18 Juli 2026 berdasarkan
`mvp-stability-audit.md` (audit stabilitas MVP, tanggal sama). Hanya berisi
temuan yang dapat diverifikasi langsung dari kode, test, atau dokumen
bertanggal di repository. Audit awal murni observasi — tidak ada perbaikan
kode dilakukan pada tahap itu.

**Update 18 Juli 2026 (sesi terpisah, PM-STAB-004 saja):** migration baseline
diverifikasi ulang end-to-end pada database PostgreSQL disposable (empty
`migrate diff`, test suite hijau termasuk integration test yang sebelumnya
skip, backend smoke test lulus) — lihat entri PM-STAB-004 untuk detail. Tidak
ada migration baru dibuat, tidak ada schema/kode aplikasi diubah. Issue ini
**tetap Open**, bukan resolved, karena prosedur staging/production masih
manual dan belum dieksekusi. Issue lain di bawah tidak disentuh pada update
ini.

Severity: **Critical** (data/keamanan salah atau bocor), **High** (menyesatkan
pengguna atau memblokir rilis), **Medium** (fungsional tapi tidak lengkap),
**Low** (kosmetik/dokumentasi).

Issue PM-STAB-001 s.d. PM-STAB-010 adalah **blocker menuju MVP Stable**,
diurutkan dari severity/risiko tertinggi ke terendah, sesuai
`mvp-stability-audit.md` bagian "Blocker terurut dari risiko tertinggi". ID
ini adalah identitas resmi yang dipakai lintas dokumen (`release-status.md`,
`stable-criteria.md`) — jangan diganti nomor lain di masa depan.

---

## PM-STAB-001 — [Critical] Dashboard Net Worth ignores debt

- **Status:** Open.
- **Affected area:** Frontend — `app/(app)/dashboard/page.tsx` (Hero Card,
  label "Posisi keuangan bersih").
- **Expected behavior:** `netWorth = totalAssets − totalDebts` (PD-001),
  identik dengan yang sudah benar dan teruji di backend
  (`utils/financial.ts:calculateNetWorth`, dipanggil dari
  `GET /v1/dashboard/summary`).
- **Actual behavior:** `dashboard/page.tsx:139-148` menghitung ulang Net
  Worth secara lokal di frontend dan men-set `netWorth = totalAssets` —
  utang tidak pernah dikurangkan, walau `totalDebts` dihitung dan ditampilkan
  terpisah di kartu sebelahnya. `GET /v1/dashboard/summary` **tidak pernah
  dipanggil** dari frontend (pencarian menyeluruh untuk `dashboard/summary`
  dan `useDashboardSummary` tidak menemukan pemanggilan apa pun) — endpoint
  ini dead code dari sudut pandang produk yang berjalan.
- **Evidence / lokasi kode:** `app/(app)/dashboard/page.tsx:139-148`
  (`useMemo` yang menghasilkan `netWorth: assets`); backend pembanding yang
  benar: `dashboard-query.service.ts:getSummary`,
  `dashboardQueryService.test.ts:69-73` ("reports netWorth as assets minus
  outstanding debt (PD-001)").
- **User impact:** Setiap pengguna dengan utang aktif (kartu kredit/paylater/
  pinjaman) melihat angka finansial paling terlihat di aplikasi (Hero Card)
  lebih tinggi dari kondisi sebenarnya — dua angka yang kontradiktif di layar
  yang sama ("Posisi keuangan bersih" vs "Total hutang").
- **Acceptance criteria:** Dashboard menampilkan Net Worth dengan memanggil
  `GET /v1/dashboard/summary`, atau menghitung ulang secara lokal dengan
  hasil identik (`assets − debts`) yang diverifikasi test; nilai yang
  dirender ke pengguna diuji, bukan hanya bahwa komponen mount.
- **Required regression tests:** test frontend baru untuk halaman Dashboard
  yang menegaskan nilai Net Worth yang dirender pada kasus: hanya asset, ada
  utang aktif, utang melebihi asset (net worth negatif). `dashboardQueryService.test.ts`
  backend tetap harus hijau sebagai baseline formula yang benar.

## PM-STAB-002 — [High] Analytics period uses current-month transaction dataset

- **Status:** Open.
- **Affected area:** Frontend — `app/(app)/analytics/page.tsx` (filter
  periode, grafik arus kas); turut berdampak ke hitungan "transaksi
  tercatat" di `dashboard/page.tsx:212`.
- **Expected behavior:** Memilih periode "3 bulan"/"6 bulan" mengambil
  transaksi lintas bulan sesuai rentang yang dipilih (`stable-criteria.md`:
  "Analitik menggunakan transaksi aktual dan rentang waktu yang benar").
- **Actual behavior:** `useTransactions()` memanggil `GET /v1/transactions`
  yang **auto-filtered ke bulan berjalan**
  (`transaction.routes.ts:9`, `transaction.controller.ts:107`). Endpoint
  `GET /v1/transactions/all` yang dirancang untuk data tanpa batas bulan
  (`transaction.controller.ts:144-161`) **tidak pernah dipanggil** dari
  frontend. Akibatnya selector "3 bulan"/"6 bulan" menghasilkan himpunan
  data yang sama dengan "Bulan ini", dan grafik "Arus kas 6 bulan terakhir"
  (`analytics/page.tsx:151-171`, `monthlyFlow`) menampilkan 5 dari 6 bulan
  selalu kosong untuk pengguna dengan riwayat lebih dari satu bulan.
- **Evidence / lokasi kode:** `transaction.routes.ts:9`,
  `transaction.controller.ts:107,144-161`, `analytics/page.tsx:151-171`
  (`monthlyFlow`), `dashboard/page.tsx:212` ("{transactions.length} transaksi
  tercatat" mewarisi keterbatasan yang sama tanpa label penjelas).
- **User impact:** Data yang ditampilkan tidak sesuai rentang waktu yang
  dipilih pengguna — menyesatkan untuk pengambilan keputusan finansial,
  walau read-only (tidak merusak data).
- **Acceptance criteria:** `analytics/page.tsx` (dan bagian dashboard yang
  butuh riwayat lengkap) mengambil data dari `GET /transactions/all` dengan
  filter tanggal di sisi client, atau dari endpoint backend baru yang
  menerima rentang tanggal eksplisit; filter "3 bulan"/"6 bulan" terbukti
  mengambil data lintas bulan.
- **Required regression tests:** test frontend baru (`analytics*.test.ts`,
  belum ada satu pun saat ini) yang membuktikan filter periode dan
  `monthlyFlow` terisi untuk transaksi lintas bulan; test backend untuk
  endpoint `/transactions/all` bila dipakai (belum diverifikasi dipanggil
  dari mana pun saat ini).

## PM-STAB-003 — [High] Exposed credentials require rotation

- **Status:** Open. *(Severity dinaikkan dari Medium menjadi High —
  lihat catatan rekonsiliasi di bawah.)*
- **Affected area:** Operasional/infrastruktur — git history
  `pocket-mint-be`, `.env` yang dulu ter-track.
- **Expected behavior:** Tidak ada kredensial produksi (password database
  Supabase, API key lama) yang dapat diakses lewat git history; rotasi dan
  purge sudah dieksekusi dan dikonfirmasi.
- **Actual behavior:** `deployment-runbook.md` §10 ("Credential rotation")
  menyatakan password database Supabase dan API key lama (`kunci_...`)
  pernah ter-hardcode/ter-commit. §11 ("Git-history purge plan") berstatus
  eksplisit **"PENDING EXPLICIT APPROVAL (do not execute)"**, tertanggal
  13 Juli 2026. Tidak ada dokumen lebih baru di kedua repo yang mengonfirmasi
  rotasi/purge sudah selesai.
- **Evidence / lokasi kode:** `pocket-mint-be/docs/deployment-runbook.md`
  §10–11.
- **User impact:** Risiko kebocoran kredensial database produksi (berisi
  data finansial pengguna) jika siapa pun dengan akses ke history git
  mengeksploitasi kredensial lama yang belum dirotasi.
- **Acceptance criteria:** Kredensial dirotasi dan dikonfirmasi via dokumen
  operasional bertanggal (di luar repo — Supabase dashboard/secret manager);
  keputusan purge history dieksekusi, atau risiko diterima secara sadar dan
  didokumentasikan secara eksplisit (bukan dibiarkan "pending").
- **Required regression tests:** Tidak ada test kode yang relevan; verifikasi
  operasional manual (checklist: kredensial baru aktif, kredensial lama
  dicabut, scan bundle produksi tetap bersih seperti yang sudah dilakukan CI
  untuk header legacy).
- **Catatan rekonsiliasi:** `known-issues.md` versi sebelumnya menandai ini
  Medium; `mvp-stability-audit.md` §12 menilai ulang risiko ini sebagai
  **High** karena memblokir kriteria Security di `stable-criteria.md`
  secara langsung ("Secret tidak tersimpan di repository"). Dokumen ini
  mengikuti penilaian audit terbaru.

## PM-STAB-004 — [High → partially resolved] Database baseline migration is incomplete

- **Status:** Open — narrowed. *(Severity dinaikkan dari Medium menjadi
  High — lihat catatan rekonsiliasi di bawah. Diperbarui 18 Juli 2026 setelah
  perbaikan langsung pada migration baseline; lihat catatan verifikasi.)*
- **Affected area:** `pocket-mint-be/prisma/migrations`, prosedur
  provisioning database staging/production.
- **Expected behavior:** `prisma migrate status` bersih pada database baru;
  seluruh migration dapat dijalankan pada database baru tanpa gagal
  (`stable-criteria.md` bagian Reliability).
- **Actual behavior (root cause, historis):** Dua migration yang pertama
  kali membentuk schema (`20260612031023_init` dan
  `20260613000000_rename_account_to_wallet`) tidak pernah ter-commit ke
  `prisma/migrations/` lokal, walau sudah ter-apply di database remote.
  Akibatnya local history dimulai dari migration yang meng-ALTER tabel yang
  belum pernah dibuat (`DROP COLUMN password` pada `users` yang belum ada) —
  `prisma migrate status` melaporkan "last common migration: null" dan
  database kosong tidak bisa diprovision hanya dari migration repository.
- **Perbaikan yang sudah dilakukan (sebelum audit ini) dan sudah pernah
  divalidasi:** migration `20260710000000_baseline` direkonstruksi ulang
  (bukan re-run migration lama) agar identik dengan state schema remote
  sesaat sebelum dua migration lokal berikutnya — lihat
  `prisma-migration-reconciliation.md` §2–§5. Validasi sebelumnya HANYA
  mencakup 3 migration (`baseline` + `remove_local_user_password` +
  `add_transaction_to_wallet`); migration ke-4 yang ditambahkan setelahnya
  (`20260717000000_generalize_wallets_and_bills` — split `WalletType`
  menjadi `PAYLATER`/`LOAN`, kolom billing wallet, dan field cicilan
  `kind`/`paid_terms`/`next_due_date`) **belum pernah** direplay dari database
  kosong sebelum audit ini — itulah gap konkret yang tersisa dari PM-STAB-004
  sebelum perbaikan hari ini.
- **Verifikasi yang dijalankan hari ini (18 Juli 2026, PM-STAB-004):** seluruh
  4 migration direplay dari nol pada instance PostgreSQL 18 disposable
  (`embedded-postgres`, efemeral, tidak pernah menyentuh database bersama):
  - `prisma migrate deploy` dari database kosong → 4 migration ter-apply
    tanpa error.
  - `prisma migrate status` → "Database schema is up to date" (dan tetap
    demikian pada run kedua — idempotent, "No pending migrations to apply").
  - `prisma migrate diff --from-config-datasource prisma.config.ts
    --to-schema prisma/schema.prisma --script` → **"This is an empty
    migration"** — schema hasil migration identik dengan
    `prisma/schema.prisma`.
  - `prisma generate` berhasil.
  - `npx vitest run` dengan `TEST_DATABASE_URL` diarahkan ke database ini →
    **381/381 test lulus, 0 skip** (termasuk 4 test
    `prismaAdapter.integration.test.ts` yang sebelumnya skip — lihat
    PM-STAB-010).
  - Backend (`ts-node --transpile-only src/server.ts`) berhasil start
    melawan database ini (lolos startup `SELECT 1`), dan `GET /health`
    mengembalikan `200`.
  - Detail lengkap: `pocket-mint-be/docs/prisma-migration-reconciliation.md`
    §5a, §6 ("Re-verified for PM-STAB-004 on 2026-07-18"), §11.
- **Yang TIDAK diubah dan TIDAK dijalankan (di luar cakupan minimum
  perbaikan):** tidak ada migration baru dibuat, tidak ada migration lama
  dihapus/diedit, `prisma/schema.prisma` tidak diubah — chain migration yang
  ada sudah benar dan hanya perlu diverifikasi ulang. Tidak ada perintah yang
  dijalankan terhadap database `.env`/staging/production manapun.
- **Evidence / lokasi kode:**
  `pocket-mint-be/docs/deployment-runbook.md` §5;
  `pocket-mint-be/docs/prisma-migration-reconciliation.md` §5a, §6–§11.
- **User impact:** Provisioning database kosong (development baru, CI, atau
  environment staging benar-benar baru) sekarang terbukti berhasil hanya dari
  migration repository. Tidak ada dampak langsung ke pengguna existing selama
  database production saat ini tidak diprovision ulang dari nol.
- **Sisa pekerjaan sebelum acceptance criteria PM-STAB-004 terpenuhi
  sepenuhnya:** `migrate resolve --applied 20260710000000_baseline` +
  `migrate deploy` (untuk 3 migration terbaru, termasuk migration ke-4) masih
  ditandai eksplisit **"⚠ MANUAL — run yourself after review"** dan **belum
  dieksekusi** terhadap staging/production nyata — ini butuh akses ke
  database bersama, backup/PITR window, dan persetujuan eksplisit yang di
  luar cakupan task ini (lihat `agent-rules.skill.md`: migration command
  hanya boleh dijalankan terhadap database disposable). Jangan tandai
  PM-STAB-004 resolved sampai langkah staging/production ini benar-benar
  dijalankan dan diverifikasi.
- **Acceptance criteria:** Baseline migration direkonstruksi agar cocok
  dengan skema remote (**terpenuhi** — dan sekarang terverifikasi mencakup
  seluruh 4 migration, bukan hanya 3); `migrate resolve --applied` +
  `migrate deploy` dijalankan dan diverifikasi pada staging nyata (**belum
  terpenuhi** — lihat "Sisa pekerjaan" di atas).
- **Required regression tests:** `prismaAdapter.integration.test.ts`
  dijalankan dengan `TEST_DATABASE_URL` (lihat PM-STAB-010) — **sudah
  dijalankan hari ini, 4/4 lulus**. Belum ada smoke test provisioning
  database kosong yang terpasang permanen di CI (rekomendasi: tambahkan job
  CI terpisah yang menjalankan `embedded-postgres` + `migrate deploy` +
  `migrate diff --exit-code`, di luar cakupan minimum task ini).
- **Catatan rekonsiliasi:** `known-issues.md` versi sebelumnya menandai ini
  Medium; `mvp-stability-audit.md` §12 menilai ulang sebagai **High** karena
  memblokir kriteria Reliability ("Seluruh migration dapat dijalankan pada
  database baru"). Dokumen ini mengikuti penilaian audit terbaru; status
  diperbarui 18 Juli 2026 untuk mencerminkan verifikasi ulang di atas, tanpa
  menutup issue karena langkah staging/production tetap manual dan belum
  dijalankan.

## PM-STAB-005 — [High] Profile password form does not perform password update

- **Status:** Resolved (18 Juli 2026).
- **Resolution:** `handleSubmit` diganti dari placeholder `setTimeout` + pesan
  sukses palsu menjadi flow nyata: verifikasi password saat ini via
  `supabase.auth.signInWithPassword`, update via `supabase.auth.updateUser`,
  sign out, dan redirect ke login. 19 contract test baru di
  `tests/profile-page.test.ts`. Manual smoke test lulus: login → ubah password
  → logout → login dengan password baru (berhasil) → login dengan password
  lama (gagal).
- **Files changed:** `app/(app)/profile/page.tsx` (form fix),
  `tests/profile-page.test.ts` (new, 19 assertions).
- **Backend changes:** Tidak ada — autentikasi dimiliki Supabase Auth, tidak
  ada kolom password di database Pocket Mint.
- **Affected area:** Frontend — `app/(app)/profile/page.tsx`, fungsi
  `handleSubmit`, bagian dari alur Authentication.
- **Expected behavior:** Form ubah password memanggil
  `supabase.auth.updateUser({ password })` (sama seperti alur reset password
  yang sudah benar di `app/auth/reset-password/page.tsx`) dan benar-benar
  mengubah password akun.
- **Actual behavior (sebelum fix):** Setelah validasi client-side, kode hanya
  menjalankan `await new Promise((resolve) => window.setTimeout(resolve, 900))`
  lalu men-set pesan sukses "Form perubahan password sudah siap digunakan."
  Tidak ada pemanggilan `supabase.auth.updateUser`, tidak ada `fetch`/`api.*`
  ke backend.
- **Acceptance criteria:** ✅ Form memanggil `supabase.auth.updateUser`
  sungguhan; ✅ pesan sukses hanya tampil setelah panggilan berhasil; ✅ error
  dari Supabase ditampilkan ke pengguna; ✅ contract test verifikasi pemanggilan
  `updateUser` dan ketiadaan fake success message; ✅ manual smoke test lulus.

## PM-STAB-006 — [Medium] Installment final payment leaves rounding remainder

- **Status:** Open — code fix in place; needs confirmation.
- **Update 18 Juli 2026 (PM-STAB-008 reconciliation):** Code fix found
  already in `installment-payment.service.ts:60-72`. `payInstallment` now
  computes `expectedAmount` via `computeFinalMonthlyAmount` for the final
  term and rejects the regular `monthlyAmount` on that term (`INVALID_AMOUNT`).
  Test `installmentPaymentService.test.ts` covers the PM-STAB-006 case
  (non-divisible grandTotal, finalMonthlyAmount used, debt wallet reaches
  exactly zero after SETTLED). Schema unchanged — `finalMonthlyAmount` is
  derived from stored fields at payment time. Acceptance criteria met in
  code; awaiting explicit confirmation no remaining edge cases.
- **Affected area:** Backend — `installment-payment.service.ts:payInstallment`,
  domain `domain/installment.ts` (`computeInstallmentPlan`,
  `computeFinalMonthlyAmount`).
- **Evidence / lokasi kode:** `installment-payment.service.ts:60-72`
  (final term detection + expectedAmount),
  `installmentPaymentService.test.ts` (PM-STAB-006 test cases).
- **Acceptance criteria:** ✅ `finalMonthlyAmount` used in final term
  validation; ✅ regular `monthlyAmount` rejected on final term; ✅ debt
  wallet = 0 after SETTLED; ⏳ Explicit confirmation.
- **Required regression tests:** Already in `installmentPaymentService.test.ts`.

## PM-STAB-007 — [Medium] Backend allows INCOME targeting DEBT wallet

- **Status:** Open — code fix in place; needs confirmation.
- **Update 18 Juli 2026 (PM-STAB-008 reconciliation):** Code fix found
  already in `transaction.service.ts:141-143`. Backend now rejects INCOME
  targeting CREDIT_CARD, PAYLATER, or LOAN (`classifyWalletForNetWorth(wallet.type)
  === 'DEBT'`) with 400 BAD_REQUEST before any database write. Guard also
  active on the update path (re-targeting and type-flip cases). Tested:
  `transactionService.test.ts` — 5 PM-STAB-007 cases covering create
  (ASSET allowed, all 3 DEBT types rejected, user isolation) and update
  (re-target, type-flip). Acceptance criteria met in code; awaiting explicit
  confirmation.
- **Affected area:** Backend — `transaction.service.ts:createTransaction`
  (line 141-143) and `updateTransaction` (line 342-344).
- **Evidence / lokasi kode:** `transaction.service.ts:141-143`
  (`classifyWalletForNetWorth(wallet.type) === 'DEBT'` guard),
  `transactionService.test.ts` (PM-STAB-007 test cases).
- **Acceptance criteria:** ✅ Backend rejects INCOME to all three DEBT types;
  ✅ Guard fires before any write (no `$transaction` call); ✅ User isolation
  preserved; ✅ Update path also guarded; ⏳ Explicit confirmation.
- **Required regression tests:** Already in `transactionService.test.ts`.

## PM-STAB-008 — [Medium] Financial documentation conflicts with implementation

- **Status:** Resolved (18 Juli 2026).
- **Resolution:** Rekonsiliasi penuh dokumentasi finansial terhadap PD-001
  (Approved), kode backend, dan 381 test. Tiga file skill.md diperbarui:
  `pocket-mint-be/.claude/skills/financial-logic.skill.md` (otoritatif),
  `pocket-mint-fe/.claude/skills/financial-logic.skill.md`, dan
  `pocket-mint-fe/skills/financial-logic.skill.md`. Perubahan utama:
  1. **Net Worth:** Formula dikoreksi dari `Σ(ASSET balances)` menjadi
     `totalAset − totalUtang` sesuai PD-001 (Approved 2026-07-14). Formula
     lama dipindahkan ke bagian "Deprecated" dengan catatan sejarah.
  2. **Sumber pembayaran:** Dikoreksi dari `BANK/CASH only` menjadi
     `BANK/CASH/E_WALLET` — sesuai implementasi backend dan frontend.
  3. **finalMonthlyAmount:** Didokumentasikan sebagai sudah aktif di
     `installment-payment.service.ts` (PM-STAB-006 code fix sudah ada).
  4. **INCOME→DEBT guard:** Didokumentasikan sebagai sudah ada di
     `transaction.service.ts` (PM-STAB-007 code fix sudah ada).
  5. **Klasifikasi wallet:** `LOAN_PAYLATER` dikoreksi menjadi `PAYLATER`
     dan `LOAN` sebagai tipe terpisah sesuai schema Prisma.
  6. **Debt ratio thresholds:** Disesuaikan mengikuti PD-005 (Draft):
     Warning 30%–<80%, Danger ≥80%.
  7. **Transfer model:** Ditandai sebagai dead schema.
  8. **Admin fee:** Dicatat sebagai gap — disimpan di schema tapi tidak
     masuk kalkulasi `grandTotal` (menunggu PD-004).
  9. Semua aturan utama sekarang punya contoh angka konkret, formula
     eksplisit, matriks dampak Net Worth per tipe transaksi, dan referensi
     implementasi.
- **Files changed:** `pocket-mint-be/.claude/skills/financial-logic.skill.md`,
  `pocket-mint-fe/.claude/skills/financial-logic.skill.md`,
  `pocket-mint-fe/skills/financial-logic.skill.md`.
- **Affected area:** Dokumentasi otoritatif agent — ketiga file
  `financial-logic.skill.md`.
- **Acceptance criteria:** ✅ Tidak ada aturan utama yang kontradiktif;
  ✅ Formula Net Worth sesuai PD-001 + kode + test; ✅ Seluruh formula
  utama tertulis eksplisit; ✅ Transfer, debt payment, dan installment
  payment tidak dapat ditafsirkan sebagai expense; ✅ Agent rule menunjuk
  dokumen ini sebagai source of truth; ✅ Konflik yang belum dapat diputuskan
  (admin fee, lifecycle) tercatat sebagai Open Decision.
- **Required regression tests:** Tidak ada — perbaikan dokumentasi murni.
  Test eksisting (`dashboardQueryService.test.ts`, `installmentPaymentService.test.ts`,
  `transactionService.test.ts`) tetap menjadi acuan kebenaran.

## PM-STAB-009 — [Low] Unused Transfer model and inconsistent navigation label

- **Status:** Open.
- **Affected area:** Backend schema — `prisma/schema.prisma:228-247` (model
  `Transfer`); Frontend navigasi — `components/layout/app-sidebar.tsx`,
  `bottom-nav.tsx`.
- **Expected behavior:** Tidak ada model schema mati yang membingungkan;
  label navigasi persis mengikuti `skills/design.md` /
  `skills/ui-system.skill.md`: `Dashboard`, `Dompet`, `Transaksi`, `Cicilan`,
  `Akun`.
- **Actual behavior:**
  1. Model Prisma `Transfer` (`schema.prisma:228-247`) **ada tapi tidak
     dipakai** oleh alur transfer yang sebenarnya — transfer dicatat sebagai
     baris `Transaction` bertipe `TRANSFER` dengan kolom `toWalletId`, bukan
     baris `Transfer`. Tampak sebagai sisa desain lama (dead schema, tidak
     berbahaya tapi berpotensi membingungkan pengembang berikutnya atau alat
     migrasi otomatis).
  2. Item navigasi memakai label "Tagihan" (`href: "/tagihan"`) dan
     "Analitik", bukan "Cicilan" yang diwajibkan dokumen desain. Rute
     `/cicilan` ada dan me-redirect ke `/tagihan`, jadi fungsional tidak
     rusak — murni penyimpangan label dari kontrak desain.
- **Evidence / lokasi kode:** `prisma/schema.prisma:228-247`;
  `components/layout/app-sidebar.tsx`, `bottom-nav.tsx`;
  `app/(app)/cicilan/page.tsx` (redirect); `skills/design.md`,
  `skills/ui-system.skill.md` (lima label wajib).
- **User impact:** Kosmetik/dokumentasi saja — fitur berfungsi penuh untuk
  kedua temuan. Dicatat agar tidak muncul kembali sebagai temuan "baru" di
  audit berikutnya dan agar model schema mati tidak disalahartikan sebagai
  fitur aktif oleh tooling migrasi otomatis.
- **Acceptance criteria:** Model `Transfer` dihapus dari schema (dengan
  migration) atau didokumentasikan eksplisit sebagai deprecated/reserved;
  label navigasi diseragamkan menjadi lima label wajib dokumen desain.
- **Required regression tests:** Bila model `Transfer` dihapus, pastikan
  tidak ada referensi tersisa (`grep` schema + kode) dan migration test
  Prisma tetap hijau. Bila label nav diganti, tambahkan/perbarui test
  navigasi yang menegaskan label persis sesuai `skills/design.md`.

## PM-STAB-010 — [Low → narrowed] Missing integration test coverage, backup, and restore validation

- **Status:** Open — narrowed. *(Updated 18 Juli 2026, PM-STAB-010B: bagian
  changelog resolved di `pocket-mint-fe`, lihat sub-item 2 di bawah. Sisa
  sub-item 1 dan 3 tetap Open.)*
- **Affected area:** Operasional — `pocket-mint-be` test suite, prosedur
  disaster recovery. (Sub-item changelog sebelumnya di sini sudah
  diselesaikan di `pocket-mint-fe`; lihat catatan sub-item 2.)
- **Expected behavior:** Seluruh test integrasi backend dijalankan dan
  lulus dengan bukti; changelog/release notes tersedia
  (`stable-criteria.md` — Release Readiness); backup dan proses pemulihan
  data telah diuji (`stable-criteria.md` — Reliability).
- **Actual behavior:**
  1. Empat test integrasi Prisma di-skip:
     `pocket-mint-be/test/prismaAdapter.integration.test.ts` memakai
     `describe.skipIf(!TEST_DATABASE_URL)`; `npx vitest run` melaporkan
     366 lulus, 0 gagal, **4 skip** karena `TEST_DATABASE_URL` tidak diset
     di lingkungan audit. **Masih Open.**
  2. **Resolved (18 Juli 2026, PM-STAB-010B) untuk `pocket-mint-fe`:**
     source of truth changelog terstruktur ditambahkan di
     `pocket-mint-fe/src/lib/changelog.ts` (array `RELEASES`, tervalidasi
     `assertValidReleases`, diuji `tests/changelog.test.ts`), dikonsumsi
     oleh route `/changelog` (`app/changelog/page.tsx`) dan ringkasan
     rilis terbaru di landing page (`app/page.tsx`, section "Yang Baru di
     Pocket Mint") — satu sumber data, tidak di-hardcode dua tempat.
     Baseline rilis `0.1.0` (status `beta`, MVP Beta) berisi hanya fitur
     yang terverifikasi di `release-status.md` dan mencantumkan known
     issue material sebagai `knownIssues`. `pocket-mint-be` **belum**
     punya struktur setara — tetap Open untuk backend.
  3. Tidak ada bukti uji backup & restore data produksi: satu-satunya
     aktivitas yang mendekati adalah replay migrasi skema pada database
     PostgreSQL disposable lokal
     (`docs/prisma-migration-reconciliation.md` §6) — itu uji migrasi
     skema, bukan uji backup/restore data pengguna. **Masih Open.**
- **Evidence / lokasi kode:**
  `pocket-mint-be/test/prismaAdapter.integration.test.ts`;
  `pocket-mint-fe/src/lib/changelog.ts`, `pocket-mint-fe/src/types/changelog.ts`,
  `pocket-mint-fe/app/changelog/page.tsx`, `pocket-mint-fe/app/page.tsx`,
  `pocket-mint-fe/tests/changelog.test.ts` (sub-item 2, FE);
  `pocket-mint-be/docs/prisma-migration-reconciliation.md` §6 (sub-item 3).
- **User impact:** Sub-item 2 tidak lagi menghambat Release Readiness untuk
  `pocket-mint-fe`. Sub-item 1 dan 3 tetap tidak memblokir fungsi produk
  saat ini, tapi menghambat kriteria Reliability dan meninggalkan disaster
  recovery data finansial pengguna belum terbukti dari repository.
- **Acceptance criteria:** 4 test integrasi Prisma dijalankan dengan
  `TEST_DATABASE_URL` dan hasilnya didokumentasikan; ✅ changelog
  terstruktur ditambahkan dan dipelihara per rilis di `pocket-mint-fe`
  (belum di `pocket-mint-be`); uji backup/restore data produksi (bukan
  hanya skema) dilakukan dan hasilnya didokumentasikan dengan tanggal.
- **Required regression tests:** Jalankan
  `TEST_DATABASE_URL=<disposable-db-url> npx vitest run` di CI atau lokal
  dan pastikan 370/370 lulus (0 skip); `tests/changelog.test.ts` sudah ada
  untuk sub-item 2 (FE); tidak ada test kode baru untuk backup, itu adalah
  aktivitas operasional yang didokumentasikan terpisah.

---

## Known issue lain (di luar blocker MVP Stable PM-STAB-001–010)

## KI-EXPORT — [Medium] Tombol "Ekspor laporan" di halaman Analitik tidak berfungsi

- **Status:** Open.
- **Lokasi:** `pocket-mint-fe/app/(app)/analytics/page.tsx` (tombol dengan
  ikon `Download`, sekitar baris 276–282).
- **Bukti:** elemen `<button>` tidak memiliki prop `onClick` atau logic
  ekspor apa pun di file tersebut.
- **Dampak:** dead control — pengguna mengklik tombol dan tidak terjadi apa
  pun, tanpa disabled state atau indikasi bahwa fitur belum tersedia.
- **Catatan:** Item ini sudah ada sebelum audit stabilitas MVP 18 Juli 2026
  dan tidak termasuk dalam 10 blocker PM-STAB yang diminta audit tersebut
  (`mvp-stability-audit.md` menyebutnya sebagai item kosmetik yang levelnya
  lebih rendah dibanding temuan Analytics period — lihat PM-STAB-002).
  Dipertahankan di sini dengan ID lama agar tidak hilang dari catatan.

---

## Tidak termasuk known issue (diverifikasi aman)

Dicatat agar tidak diasumsikan sebagai masalah oleh pembaca berikutnya:

- Error handler produksi (`pocket-mint-be/src/middlewares/error.middleware.ts`)
  tidak membocorkan stack trace atau pesan internal saat `NODE_ENV=production`
  — diuji di `errorHandler.test.ts`.
- Autentikasi murni JWT Supabase (`requireUser`/`requireVerifiedJwt` di
  `apiKeyAuth.ts`); tidak ada jalur `x-api-key`/`x-user-id`/`x-user-email`.
  CI frontend memindai bundle produksi untuk memastikan header/kunci lama
  ini tidak muncul (`.github/workflows/ci.yml` job "Scan production bundle").
- Rate limiting memang **in-memory per instance** dan tidak dibagi antar
  proses saat scale horizontal — ini didokumentasikan secara eksplisit
  sebagai batasan yang disengaja di `docs/deployment-runbook.md` §4, bukan
  bug yang tersembunyi.
- User data isolation (`requireUser`/`requireVerifiedJwt` di setiap route,
  scoping `userId` konsisten di setiap service) — diverifikasi ulang secara
  menyeluruh di `mvp-stability-audit.md` bagian 11, delapan file test
  boundary/ownership khusus, Pass tanpa temuan baru.
- Transfer antar wallet aset (source→destination CASH/BANK/E_WALLET) —
  reversal simetris, atomik, teruji; satu-satunya catatan terkait
  (hardening Low untuk `toWalletId` bertipe DEBT pada transfer generik) tidak
  reachable dari UI produk saat ini dan tidak menambah risiko net worth
  secara matematis (lihat `mvp-stability-audit.md` bagian 5).
