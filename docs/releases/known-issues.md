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

- **Status:** Open.
- **Affected area:** Frontend — `app/(app)/profile/page.tsx`, fungsi
  `handleSubmit` (baris 73–97), bagian dari alur Authentication.
- **Expected behavior:** Form ubah password memanggil
  `supabase.auth.updateUser({ password })` (sama seperti alur reset password
  yang sudah benar di `app/auth/reset-password/page.tsx`) dan benar-benar
  mengubah password akun.
- **Actual behavior:** Setelah validasi client-side, kode hanya menjalankan
  `await new Promise((resolve) => window.setTimeout(resolve, 900))` lalu
  men-set pesan sukses "Form perubahan password sudah siap digunakan." Tidak
  ada pemanggilan `supabase.auth.updateUser`, tidak ada `fetch`/`api.*` ke
  backend. Dikonfirmasi ulang masih ada di kode saat audit stabilitas MVP
  ditulis (18 Juli 2026).
- **Evidence / lokasi kode:** `app/(app)/profile/page.tsx:73-97`; pembanding
  yang benar: `app/auth/reset-password/page.tsx`
  (`supabase.auth.updateUser`).
- **User impact:** Pengguna yang mengisi form ini melihat konfirmasi sukses
  palsu padahal password lama mereka tidak berubah — false sense of security
  pada alur keamanan akun, berpotensi menimbulkan keluhan dukungan atau
  insiden akun tidak aman yang dikira sudah diamankan.
- **Acceptance criteria:** Form memanggil `supabase.auth.updateUser` (atau
  endpoint setara) sungguhan; pesan sukses hanya tampil setelah panggilan
  berhasil; error dari Supabase ditampilkan ke pengguna, bukan diabaikan.
- **Required regression tests:** Test frontend baru untuk
  `profile/page.tsx` yang memverifikasi `supabase.auth.updateUser` benar-benar
  dipanggil dengan password baru, dan bahwa pesan sukses tidak tampil pada
  kasus gagal.
- **Catatan rekonsiliasi:** Finding ini identik dengan known-issue #1 versi
  sebelumnya (severity High, tervalidasi ulang di `mvp-stability-audit.md`
  bagian Authentication dengan severity High yang sama). Bagian ringkasan
  blocker pada audit sempat menandainya `[Medium]` saat menaikkan prioritas
  pengerjaan — ini adalah label ringkasan yang tidak konsisten dengan
  penilaian severity rinci pada dokumen yang sama; dokumen ini mengikuti
  severity **High** yang dikonfirmasi dua kali (known-issues sebelumnya +
  detail audit), bukan label ringkasan Medium.

## PM-STAB-006 — [Medium] Installment final payment leaves rounding remainder

- **Status:** Open.
- **Affected area:** Backend — `installment-payment.service.ts:payInstallment`,
  domain `domain/installment.ts` (`computeInstallmentPlan`).
- **Expected behavior:** Setelah termin terakhir cicilan dibayar dan status
  menjadi `SETTLED`, saldo wallet DEBT terkait mencapai tepat nol (kriteria
  stable: "Cicilan lunas tidak lagi dihitung sebagai hutang aktif").
- **Actual behavior:** `monthlyAmount = round(grandTotal / months)` dapat
  menyisakan sisa pembulatan beberapa sen ketika `grandTotal` tidak habis
  dibagi rata oleh `installmentMonths` (`monthlyAmount × months ≠
  grandTotal`). Domain function `computeInstallmentPlan` sudah menyediakan
  `finalMonthlyAmount` untuk menyerap sisa ini di termin terakhir
  (`domain/installment.ts:58-60,91`, diuji di `installment.test.ts:27,39`),
  **tapi kolom ini tidak pernah disimpan ke schema Prisma dan tidak pernah
  dipakai di `installment-payment.service.ts`** — pembayaran termin terakhir
  tetap divalidasi harus sama persis dengan `monthlyAmount` biasa. Setelah
  status `SETTLED`, `payInstallment` menolak pembayaran lanjutan
  ("Tagihan sudah lunas"), sehingga sisa hutang tersebut **tak tertagih
  selamanya** kecuali direkonsiliasi manual.
- **Evidence / lokasi kode:** `domain/installment.ts:58-60,91`,
  `installment.test.ts:27,39`, `installment-payment.service.ts:17` dan
  logika validasi `amount.equals(installment.monthlyAmount)`. Contoh
  reproduksi numerik: principal 100000, rate 2,6%, tenor 3 bulan →
  `totalInterest = round(100000 × 0,026 × 3) = 7800`,
  `grandTotal = 107800`, `monthlyAmount = round(107800/3) = 35933,33`,
  `monthlyAmount × 3 = 107799,99` — kurang Rp0,01 dari `grandTotal`.
- **User impact:** Nilainya kecil per kasus (di bawah unit Rupiah praktis di
  UI), tapi merupakan bug integritas data finansial yang sistematis;
  membesar dengan jumlah pengguna serta kombinasi tenor/rate ganjil. Wallet
  DEBT yang "lunas" secara status masih menyimpan sisa saldo negatif kecil
  yang masuk ke `totalUtang` pada net worth selamanya kecuali direkonsiliasi.
- **Acceptance criteria:** `finalMonthlyAmount` diterapkan pada validasi
  pembayaran termin terakhir (kolom ditambahkan ke schema `Installment` dan
  dipakai oleh `installment-payment.service.ts`), atau mekanisme
  reconciliation otomatis menutup sisa pembulatan saat status menjadi
  `SETTLED`, sehingga saldo wallet DEBT benar-benar nol.
- **Required regression tests:** Test baru pada
  `installmentPaymentService.test.ts` untuk kasus `grandTotal` tidak habis
  dibagi rata oleh `installmentMonths`, menegaskan saldo wallet DEBT = 0
  tepat setelah termin terakhir dibayar dan status `SETTLED`.

## PM-STAB-007 — [Medium] Backend allows INCOME targeting DEBT wallet

- **Status:** Open.
- **Affected area:** Backend — `transaction.service.ts:createTransaction`
  (cabang non-`isCreditExpense`, tipe `INCOME`).
- **Expected behavior:** Backend menolak transaksi `INCOME` yang menyasar
  wallet DEBT (`CREDIT_CARD`/`PAYLATER`/`LOAN`), sejajar dengan guard yang
  sudah ada untuk `EXPENSE` dari wallet `LOAN`
  (`transaction.service.ts:137-139`: "Pinjaman tidak dapat digunakan sebagai
  sumber pengeluaran").
- **Actual behavior:** Larangan "Pemasukan tidak bisa dicatat ke kartu
  kredit atau paylater" **hanya ada di frontend**
  (`AddTransactionModal.tsx:460`) — tidak ada guard setara di backend.
  Panggilan API langsung (tanpa lewat UI produk) dengan `type: "INCOME"` dan
  `walletId` mengarah ke wallet DEBT berhasil membuat saldo wallet tersebut
  menjadi **positif**, melanggar invarian "outstanding = saldo negatif" di
  `financial-logic.skill.md`.
- **Evidence / lokasi kode:** `transaction.service.ts` (cabang INCOME, tidak
  ada guard tipe wallet DEBT), `AddTransactionModal.tsx:460` (guard
  frontend-only), `utils/financial.ts:42` (`calculateNetWorth` memakai
  `balance.abs()` untuk wallet DEBT tanpa memandang tanda — saldo DEBT
  positif akan **menambah** `totalUtang`, bukan mengoreksinya).
- **User impact:** Tidak reachable dari UI produk saat ini (butuh akses API
  langsung), tapi jika dieksploitasi dapat mendistorsi `totalUtang` dan Net
  Worth pengguna secara diam-diam.
- **Acceptance criteria:** Backend menolak `INCOME` dengan `walletId`
  bertipe DEBT (`CREDIT_CARD`/`PAYLATER`/`LOAN`) dengan pesan error yang
  jelas, konsisten dengan guard `EXPENSE`→`LOAN` yang sudah ada.
- **Required regression tests:** Test baru pada `transactionService.test.ts`
  yang menegaskan `POST /v1/transactions` dengan `type: "INCOME"` dan
  `walletId` DEBT ditolak untuk ketiga tipe wallet DEBT.

## PM-STAB-008 — [Medium] Financial documentation conflicts with implementation

- **Status:** Open.
- **Affected area:** Dokumentasi otoritatif agent —
  `pocket-mint-fe/skills/financial-logic.skill.md`; turut berdampak ke
  `release-status.md` yang mewarisi klaim yang sama.
- **Expected behavior:** Dokumen otoritatif yang dipakai agent/pengembang
  untuk mengambil keputusan implementasi mencerminkan perilaku backend yang
  sebenarnya dan teruji.
- **Actual behavior:** Dua inkonsistensi terverifikasi:
  1. **Formula Net Worth.** `financial-logic.skill.md` menyatakan
     `netWorth = Σ(ASSET balances)` ("Debt does NOT subtract from net worth
     directly ... decided Jul 2026") dan mengklaim ini "implemented in
     backend calculateNetWorth, dashboard, and wallets page". **Kode backend
     yang sebenarnya dan teruji melakukan sebaliknya**
     (`assets − debt`, PD-001, lihat PM-STAB-001). `release-status.md` juga
     mewarisi klaim yang sama pada tabel fitur implemented sebelum dokumen
     ini diperbarui.
  2. **Sumber pembayaran cicilan.** `financial-logic.skill.md` menyatakan
     "E-wallets cannot pay CC/paylater bills — PAY DEBT sources are BANK/CASH
     only", tapi kode nyata (`installment-payment.service.ts:17`:
     `ALLOWED_SOURCE_TYPES = ['BANK', 'CASH', 'E_WALLET']`) dan frontend
     (`PayBillModal.tsx:27-29`) **keduanya mengizinkan E-Wallet**. Perilaku
     FE/BE konsisten satu sama lain (bukan bug fungsional), tapi dokumen
     otoritatif tidak sinkron dengan kode.
- **Evidence / lokasi kode:** `skills/financial-logic.skill.md` (bagian "Net
  Worth Calculation" dan "Transaction Rules"), `utils/financial.ts:42`,
  `dashboard-query.service.ts`, `installment-payment.service.ts:17`,
  `PayBillModal.tsx:27-29`.
- **User impact:** Tidak berdampak langsung ke pengguna akhir, tapi berisiko
  tinggi terhadap **pengembangan berikutnya**: agent atau pengembang manusia
  yang mengikuti dokumen otoritatif ini berpotensi "memperbaiki" kode yang
  sebenarnya sudah benar (sumber pembayaran), atau — lebih berbahaya —
  mengimplementasikan formula Net Worth yang salah di tempat lain karena
  mengira itu keputusan produk yang sah. Severity dinilai Medium (bukan Low)
  karena risiko ini secara langsung menyebabkan PM-STAB-001.
- **Acceptance criteria:** `financial-logic.skill.md` diperbarui agar cocok
  dengan implementasi backend yang teruji (`assets − debt` untuk Net Worth;
  `BANK/CASH/E_WALLET` untuk sumber pembayaran cicilan), atau — jika
  `Σ(ASSET balances)` memang keputusan produk final — backend dan test
  `dashboardQueryService.test.ts` diubah agar konsisten. Keputusan produk
  mana yang benar harus diambil eksplisit (di luar cakupan audit ini), bukan
  dibiarkan bertentangan.
- **Required regression tests:** Tidak ada test kode baru untuk perbaikan
  dokumentasi itu sendiri; pastikan test yang menjadi acuan kebenaran
  (`dashboardQueryService.test.ts` PD-001) tetap menjadi single source of
  truth setelah dokumen diperbarui.

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

## PM-STAB-010 — [Low] Missing integration, changelog, backup, and restore validation

- **Status:** Open.
- **Affected area:** Operasional — `pocket-mint-be` test suite, root kedua
  repo, prosedur disaster recovery.
- **Expected behavior:** Seluruh test integrasi backend dijalankan dan
  lulus dengan bukti; changelog/release notes tersedia
  (`stable-criteria.md` — Release Readiness); backup dan proses pemulihan
  data telah diuji (`stable-criteria.md` — Reliability).
- **Actual behavior:**
  1. Empat test integrasi Prisma di-skip:
     `pocket-mint-be/test/prismaAdapter.integration.test.ts` memakai
     `describe.skipIf(!TEST_DATABASE_URL)`; `npx vitest run` melaporkan
     366 lulus, 0 gagal, **4 skip** karena `TEST_DATABASE_URL` tidak diset
     di lingkungan audit.
  2. Tidak ada `CHANGELOG.md` atau release notes: pencarian `CHANGELOG*` di
     kedua repo hanya menemukan file di dalam `node_modules` (dependency
     pihak ketiga).
  3. Tidak ada bukti uji backup & restore data produksi: satu-satunya
     aktivitas yang mendekati adalah replay migrasi skema pada database
     PostgreSQL disposable lokal
     (`docs/prisma-migration-reconciliation.md` §6) — itu uji migrasi
     skema, bukan uji backup/restore data pengguna.
- **Evidence / lokasi kode:**
  `pocket-mint-be/test/prismaAdapter.integration.test.ts`; root
  `pocket-mint-fe` dan `pocket-mint-be` (tidak ada `CHANGELOG.md`);
  `pocket-mint-be/docs/prisma-migration-reconciliation.md` §6.
- **User impact:** Tidak memblokir fungsi produk saat ini, tapi menghambat
  kriteria Release Readiness dan Reliability, serta meninggalkan disaster
  recovery data finansial pengguna belum terbukti dari repository.
- **Acceptance criteria:** 4 test integrasi Prisma dijalankan dengan
  `TEST_DATABASE_URL` dan hasilnya didokumentasikan; `CHANGELOG.md`
  ditambahkan di kedua repo dan dipelihara per rilis; uji backup/restore
  data produksi (bukan hanya skema) dilakukan dan hasilnya didokumentasikan
  dengan tanggal.
- **Required regression tests:** Jalankan
  `TEST_DATABASE_URL=<disposable-db-url> npx vitest run` di CI atau lokal
  dan pastikan 370/370 lulus (0 skip); tidak ada test kode baru untuk
  changelog/backup, itu adalah aktivitas operasional yang didokumentasikan
  terpisah.

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
