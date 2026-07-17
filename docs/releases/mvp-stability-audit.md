# Pocket Mint — MVP Stability Audit

Audit tanggal: 18 Juli 2026. Ini adalah audit murni — **tidak ada perbaikan
kode dilakukan pada tahap ini**. Setiap temuan diverifikasi dengan menelusuri
kode sungguhan (frontend → hook/API client → route backend →
controller/service → Prisma schema), bukan dari nama file atau dokumentasi
saja. Baseline yang sudah ada (`release-status.md`, `known-issues.md`,
`stable-criteria.md`) dibaca lebih dulu dan **tidak diulang di sini kecuali
relevan** — dokumen ini menambah temuan baru dan memverifikasi ulang integritas
finansial secara spesifik per alur, sesuai permintaan audit.

Metodologi: baca kode, bukan asumsi dari dokumentasi. Beberapa temuan di bawah
justru membuktikan bahwa `skills/financial-logic.skill.md` (dokumen otoritatif
bagi agent) **tidak sinkron** dengan implementasi backend yang sebenarnya —
lihat Temuan F6.

## Ringkasan cepat

| # | Alur | Status | Severity tertinggi |
| --- | --- | --- | --- |
| 1 | Authentication | Pass (dengan 1 gap UI di luar login) | High |
| 2 | Wallet CRUD | Pass | — |
| 3 | Income transaction | Pass | Medium |
| 4 | Expense transaction | Pass | — |
| 5 | Transfer antar-dompet | Pass | — |
| 6 | Debt/credit transaction | Pass | Medium |
| 7 | Installment creation | Pass | Medium |
| 8 | Installment payment | Partial | Medium |
| 9 | Dashboard totals | **Fail** | **Critical** |
| 10 | Analytics totals | **Fail** | High |
| 11 | User data isolation | Pass | — |
| 12 | Deployment & migration readiness | Not Ready (sudah didokumentasikan) | High |

**Keputusan akhir: Not Ready untuk MVP Stable, dan tidak layak dinaikkan ke
status yang lebih baik dari MVP Beta saat ini** — lihat bagian Keputusan.

---

## 1. Authentication

- **Status:** Pass (alur inti); satu gap UI-only di luar alur login itu sendiri.
- **Frontend entry point:** `app/actions/auth.ts` (`login`, `signup`,
  `signInWithGoogle`, `logout`), `app/login/page.tsx`,
  `app/auth/reset-password/page.tsx`, `app/(app)/profile/page.tsx` (ubah
  password).
- **Backend endpoint/service:** Supabase Auth (login/signup/OAuth/logout/reset
  password dikelola sepenuhnya oleh Supabase, bukan backend Pocket Mint) +
  `POST /v1/users/sync` (`user.routes.ts` → `UserController.sync`, gated oleh
  `requireVerifiedJwt`) untuk bootstrap baris `User` lokal.
- **Database entities:** `User` (tanpa kolom password — diverifikasi di
  `schema.prisma:20-39`, autentikasi murni milik Supabase).
- **Validasi tersedia:** `requireUser`/`requireVerifiedJwt`
  (`src/middleware/apiKeyAuth.ts`) memverifikasi JWT Supabase (signature,
  expiry, audience, issuer jika di-pin); tidak ada fallback ke `x-user-id`,
  API key, atau identitas dari body/query. `POST /users/sync` mengikat
  `userId` ke `sub` JWT terverifikasi — body `supabaseId` tidak bisa
  override.
- **Test tersedia:** `auth.test.ts`, `authContext.test.ts`, `userSync.test.ts`,
  `rateLimitAuth.test.ts`, `httpSecurity.test.ts` (backend);
  `login-page.test.ts`, `private-route-auth.test.ts`, `session-token.test.ts`,
  `sync-user.test.ts` (frontend).
- **Risiko terhadap data:** Rendah untuk alur login/logout/reset-password itu
  sendiri (memanggil Supabase langsung, teruji). **Tapi form ubah password di
  halaman Profil adalah UI palsu** — sudah didokumentasikan di
  `known-issues.md` #1 (High), diverifikasi ulang di sini: `handleSubmit`
  (`app/(app)/profile/page.tsx:73-97`) hanya `setTimeout` lalu menampilkan
  pesan sukses; tidak ada `supabase.auth.updateUser` atau panggilan API
  apa pun. Dikonfirmasi masih ada di kode saat audit ini ditulis.
- **Langkah reproduksi:** Buka `/profile`, isi form ubah password dengan
  password baru yang valid, submit → tampil pesan sukses palsu, password akun
  Supabase tidak berubah.
- **Severity:** High (menyesatkan pengguna soal keamanan akun — bukan
  kebocoran data, tapi false sense of security).

## 2. Wallet CRUD

- **Status:** Pass.
- **Frontend entry point:** `src/features/wallets/hooks/useWallets.ts`
  (`useWallets`, `useCreateWallet`, `useUpdateWallet`, `useDeleteWallet`),
  `app/(app)/wallets/page.tsx` + `components/{CreateWalletModal,
  EditWalletModal, DeleteWalletModal}.tsx`.
- **Backend endpoint/service:** `walletRoutes.ts` → `account.controller.ts`
  → `wallet.service.ts` / `wallet-query.service.ts`.
- **Database entities:** `Wallet` (`schema.prisma:53-89`).
- **Validasi tersedia:** Nama wajib, tipe wallet harus salah satu enum valid,
  `creditLimit > 0` wajib untuk CREDIT_CARD/PAYLATER, `principal > 0` wajib
  untuk LOAN (dan field kredit lain ditolak untuk LOAN), hari cutoff/jatuh
  tempo 1–31, saldo aset tidak boleh negatif saat dibuat. **Ledger boundary**:
  `updateWallet` menolak keras setiap upaya mengubah `balance` langsung
  (`BALANCE_UPDATE_NOT_ALLOWED`, dibandingkan Decimal-exact, bukan
  float-subtract) — saldo hanya bisa berubah lewat transaksi. Delete punya dua
  gate: wallet yang jadi salah satu sisi transfer ditolak **walau `force`**;
  wallet dengan riwayat transaksi biasa ditolak kecuali `force=true`. Semua
  operasi discope `userId` via `findFirst({ where: { id, userId } })`.
- **Test tersedia:** `walletService.test.ts`, `walletUpdate.test.ts`,
  `walletDeletion.test.ts`, `walletControllerBoundary.test.ts`,
  `walletQueryService.test.ts`, `walletQueryControllerBoundary.test.ts`,
  `walletSparkline.test.ts` (backend); `wallet-form.test.ts`,
  `wallet-page.test.ts` (frontend).
- **Risiko terhadap data:** Rendah. Setiap mutasi adalah satu Prisma write
  (tidak butuh `$transaction` karena tidak ada efek berantai selain cascade
  skema).
- **Severity:** —

## 3. Income transaction

- **Status:** Pass, dengan satu gap validasi backend (Medium).
- **Frontend entry point:**
  `app/(app)/transactions/components/AddTransactionModal.tsx`,
  `useCreateTransaction` (`src/features/transactions/hooks/useTransactions.ts`).
- **Backend endpoint/service:** `POST /v1/transactions` →
  `TransactionController.create` → `transaction.service.ts:createTransaction`
  (cabang non-`isCreditExpense`, tipe `INCOME`).
- **Database entities:** `Transaction`, `Wallet`, `Category`.
- **Validasi tersedia:** tipe harus salah satu `INCOME/EXPENSE/TRANSFER`,
  amount harus angka positif, kategori wajib untuk INCOME dan harus milik user
  serta bertipe `INCOME`, wallet harus milik user. Efek saldo dihitung lewat
  satu sumber kebenaran (`computeBalanceEffect` di
  `domain/transactionBalance.ts`) dan diterapkan via
  `wallet.update({ data: { balance: { increment } } })` — atomic increment,
  bukan read-modify-write, sehingga aman dari race condition.
- **Test tersedia:** `transactionService.test.ts` (37 kasus),
  `transactionBalance.test.ts` (13 kasus), `transactionController.test.ts`,
  `transactionControllerBoundary.test.ts`.
- **Risiko terhadap data — Temuan F5 (Medium):** Backend **tidak menolak**
  transaksi `INCOME` dengan `walletId` mengarah ke wallet DEBT
  (`CREDIT_CARD`/`PAYLATER`/`LOAN`). Larangan ini **hanya ada di frontend**
  (`AddTransactionModal.tsx:460`: `"Pemasukan tidak bisa dicatat ke kartu
  kredit atau paylater."`). Dibandingkan dengan cabang EXPENSE yang punya
  guard backend eksplisit untuk LOAN
  (`transaction.service.ts:137-139`: `"Pinjaman tidak dapat digunakan sebagai
  sumber pengeluaran"`), tidak ada guard setara untuk INCOME ke wallet DEBT
  mana pun. Panggilan API langsung (tanpa lewat UI) bisa mendorong saldo
  wallet DEBT menjadi **positif** — melanggar invarian "outstanding = saldo
  negatif" di `financial-logic.skill.md`, dan `calculateNetWorth`
  (`utils/financial.ts:42`) memakai `balance.abs()` untuk wallet DEBT tanpa
  memandang tanda, sehingga saldo DEBT positif akan **menambah** `totalUtang`
  alih-alih mengoreksinya.
- **Langkah reproduksi:** `POST /v1/transactions` dengan JWT valid,
  `type: "INCOME"`, `walletId` = id wallet `CREDIT_CARD` milik user, amount
  besar melebihi saldo negatifnya → transaksi berhasil dibuat, saldo wallet
  kartu kredit menjadi positif, tidak ada penolakan dari backend.
- **Severity:** Medium (butuh akses API langsung untuk dieksploitasi — tidak
  reachable dari UI produk saat ini — tapi backend seharusnya tidak
  bergantung pada frontend untuk invarian tipe wallet).

## 4. Expense transaction

- **Status:** Pass.
- **Frontend entry point:** sama seperti Income (`AddTransactionModal.tsx`,
  `useCreateTransaction`).
- **Backend endpoint/service:** `POST /v1/transactions` →
  `transaction.service.ts:createTransaction` (cabang EXPENSE non-kredit).
- **Database entities:** `Transaction`, `Wallet`, `Category`.
- **Validasi tersedia:** kategori wajib dan harus bertipe EXPENSE; wallet
  LOAN ditolak eksplisit sebagai sumber pengeluaran; efek saldo lewat
  `computeBalanceEffect` yang sama (satu sumber kebenaran untuk create,
  update, dan delete — lihat bagian Financial Integrity).
- **Test tersedia:** sama seperti Income (satu service, satu test suite).
- **Risiko terhadap data:** Rendah.
- **Severity:** —

## 5. Transfer antar-dompet

- **Status:** Pass.
- **Frontend entry point:** `AddTransactionModal.tsx` tab Transfer (memakai
  `ASSET_WALLET_TYPES` untuk membatasi picker sumber **dan** tujuan ke
  CASH/BANK/E_WALLET saja — `src/types/wallet.ts:9`).
- **Backend endpoint/service:** `POST /v1/transactions` (`type: "TRANSFER"`)
  → `transaction.service.ts`. Satu baris `Transaction` menyimpan
  `walletId` (sumber, didebit) + `toWalletId` (tujuan, dikredit) — bukan dua
  baris terpisah, sehingga reversal (update/delete) selalu bisa membalik
  KEDUA sisi dari baris yang tersimpan, bukan dari data request baru.
- **Database entities:** `Transaction` (kolom `toWalletId`), `Wallet`. Model
  `Transfer` di schema (`schema.prisma:228-247`) **ada tapi tidak dipakai
  oleh service ini** — transfer sesungguhnya dicatat sebagai `Transaction`
  bertipe `TRANSFER`, bukan baris `Transfer`. Model `Transfer` tampak sebagai
  sisa desain lama (dead schema, tidak berbahaya tapi membingungkan).
- **Validasi tersedia:** sumber harus CASH/BANK/E_WALLET
  (`TRANSFER_SOURCE_TYPES`), sumber ≠ tujuan, saldo sumber mencukupi
  (`sourceBalance.lessThan(numAmount)` dicek sebelum write), tujuan harus
  milik user yang sama, transfer tidak boleh punya `categoryId`. Backend
  **tidak membatasi tipe wallet tujuan** (lihat catatan di bawah), tapi
  frontend membatasinya ke wallet ASSET saja sehingga jalur pembayaran utang
  yang sebenarnya selalu lewat alur Installment Payment (#8), bukan transfer
  generik.
- **Test tersedia:** `transactionBalance.test.ts` (symmetry & reversal),
  `transactionService.test.ts`, `transactionController.test.ts`;
  `transfer-account-picker.test.ts`,
  `transfer-account-picker-contract.test.ts` (frontend).
- **Risiko terhadap data:** Rendah untuk alur yang reachable dari UI. Catatan
  hardening (Low, bukan bug aktif): backend menerima `toWalletId` bertipe
  DEBT pada TRANSFER generik (di luar endpoint `/bills/:id/pay`) tanpa
  menyentuh baris `Installment` — secara matematis tetap menjaga net worth
  (lihat Financial Integrity di bawah) tapi bisa membuat progres cicilan
  (`paidTerms`) desync dari saldo wallet jika suatu saat ada client lain
  (mobile app, API pihak ketiga) yang tidak menerapkan pembatasan yang sama.
- **Severity:** — (Low hanya untuk catatan hardening di atas).

## 6. Debt or credit transaction

- **Status:** Pass, dengan satu inkonsistensi dokumentasi (Low).
- **Frontend entry point:** `AddTransactionModal.tsx` tab EXPENSE dengan
  wallet sumber bertipe CREDIT_CARD/PAYLATER (`isCreditWallet`).
- **Backend endpoint/service:** `POST /v1/transactions` →
  `transaction.service.ts:createTransaction`, cabang `isCreditExpense`
  (baris 146–246). **Setiap** pengeluaran dari wallet CREDIT_CARD/PAYLATER
  otomatis menjadi baris `Installment` (kind `FULL` untuk sekali bayar, kind
  `INSTALLMENT` untuk cicilan bertenor) — flow ini dan Installment Creation
  (#7) adalah **satu code path yang sama**.
- **Database entities:** `Installment`, `Transaction` (`isInstallment: true`,
  `installmentId`), `Wallet`.
- **Validasi tersedia:** limit kredit dicek sebelum write
  (`grandTotal.greaterThan(remainingCredit)` → `INSUFFICIENT_CREDIT`),
  `installmentMonths` 1–120, cicilan wajib ≥2 termin, bunga 0–100%.
- **Test tersedia:** `installment.test.ts`, `transactionService.test.ts`.
- **Risiko terhadap data — Temuan F6b (Low, dokumentasi):**
  `skills/financial-logic.skill.md` menyatakan "E-wallets cannot pay CC/paylater
  bills — PAY DEBT sources are BANK/CASH only", tapi kode nyata
  (`installment-payment.service.ts:17`:
  `ALLOWED_SOURCE_TYPES = ['BANK', 'CASH', 'E_WALLET']`) dan frontend
  (`PayBillModal.tsx:27-29`, memfilter dengan `ASSET_WALLET_TYPES` yang
  mencakup E_WALLET) **keduanya mengizinkan E-Wallet sebagai sumber
  pembayaran**. Ini bukan bug fungsional (perilaku konsisten antara FE dan
  BE), tapi dokumen otoritatif agent tidak sinkron dengan implementasi —
  berisiko membuat perubahan berikutnya "memperbaiki" sesuatu yang sebenarnya
  sudah disengaja, atau sebaliknya.
- **Severity:** Medium untuk fungsi inti (tervalidasi baik), Low untuk
  inkonsistensi dokumentasi.

## 7. Installment creation

- **Status:** Pass secara fungsional; Medium finding pada integritas
  pembulatan (lihat Financial Integrity F1 di bawah).
- **Frontend entry point:** sama dengan #6 (`AddTransactionModal.tsx`, tab
  EXPENSE + toggle cicilan).
- **Backend endpoint/service:** sama dengan #6 —
  `transaction.service.ts:createTransaction`, cabang `isCreditExpense`, yang
  memanggil `computeInstallmentPlan` (`domain/installment.ts`).
- **Database entities:** `Installment` (`totalAmount`, `interestRate`,
  `totalInterest`, `grandTotal`, `installmentMonths`, `monthlyAmount`,
  `paidTerms`, `nextDueDate`, `status`, `balanceDeducted`), `Transaction`.
- **Validasi tersedia:** rencana cicilan dihitung 100% dengan `Prisma.Decimal`
  (`computeInstallmentPlan`, `MONEY_SCALE = 2`, `ROUND_HALF_UP`) — tidak ada
  aritmetika `number`/`float` untuk uang di jalur ini. Wallet didebit sebesar
  **`grandTotal` penuh** (pokok + bunga) pada saat pembuatan, dalam satu
  `db.$transaction` bersama pembuatan baris `Installment` dan `Transaction` —
  atomik, tidak ada partial write.
- **Test tersedia:** `installment.test.ts` (termasuk test matematika
  `computeInstallmentPlan` dan `finalMonthlyAmount`),
  `transactionService.test.ts`.
- **Risiko terhadap data:** Lihat **Temuan F1 (Financial Integrity)** di
  bawah — `finalMonthlyAmount` dihitung dan diuji di level fungsi murni,
  tapi tidak pernah dipakai di jalur pembayaran sungguhan.
- **Severity:** Medium (lihat F1).

## 8. Installment payment

- **Status:** Partial — mekanisme inti benar, tapi ada gap integritas.
- **Frontend entry point:** `app/(app)/tagihan/components/PayBillModal.tsx`,
  `usePayBill` (`src/features/bills/hooks/useBills.ts`).
- **Backend endpoint/service:** `POST /v1/bills/:id/pay` (alias
  `/v1/installments/:id/pay`) → `installment.controller.ts:payInstallment`
  → `installment-payment.service.ts:payInstallment`.
- **Database entities:** `Installment`, `Transaction` (baru, `type:
  "TRANSFER"`), `Wallet` (sumber & tujuan/wallet utang).
- **Validasi tersedia:** cicilan harus `ACTIVE` dan belum lunas, jumlah bayar
  **harus persis sama** dengan `installment.monthlyAmount`
  (`amount.equals(installment.monthlyAmount)`), sumber harus
  BANK/CASH/E_WALLET dan saldo cukup. Pembayaran dicatat sebagai **satu baris
  `Transaction` bertipe `TRANSFER`** (sumber → wallet utang) di dalam
  `db.$transaction` bersama update `Installment.paidTerms`/`status` —
  atomik.
- **Sesuai aturan produk — dikonfirmasi benar:** pembayaran cicilan **bukan**
  EXPENSE baru; ia adalah TRANSFER (debt settlement), persis sesuai
  `financial-logic.skill.md` ("Debt repayment = TRANSFER from asset wallet
  into debt wallet") dan permintaan audit ini. Ini memenuhi kriteria
  "Pembayaran cicilan tidak terhitung sebagai expense baru".
- **Test tersedia:** `installmentPaymentService.test.ts` (5 kasus),
  `installmentQueryService.test.ts`, `installmentControllerBoundary.test.ts`.
- **Risiko terhadap data — Temuan F1 (Medium, Financial Integrity):**
  `monthlyAmount = round(grandTotal / months)` bisa menyisakan sisa
  pembulatan beberapa sen (`monthlyAmount × months ≠ grandTotal` pada
  kasus tidak habis dibagi). Domain function `computeInstallmentPlan`
  sengaja menyediakan `finalMonthlyAmount` untuk menyerap sisa ini di termin
  terakhir (`domain/installment.ts:58-60,91`, diuji di
  `installment.test.ts:27,39`) — **tapi `finalMonthlyAmount` tidak pernah
  disimpan ke schema Prisma (`Installment` tidak punya kolom ini) dan tidak
  pernah dipakai di `installment-payment.service.ts`**. Pembayaran termin
  terakhir tetap divalidasi harus sama persis dengan `monthlyAmount`
  biasa, bukan `finalMonthlyAmount`. Akibatnya: pada cicilan dengan
  `grandTotal` yang tidak habis dibagi rata oleh `installmentMonths`, setelah
  termin terakhir dibayar dan status berubah `SETTLED`, saldo wallet utang
  akan menyisakan **hutang sisa beberapa sen yang tidak pernah tertagih**
  (installment sudah `SETTLED` sehingga `payInstallment` menolak pembayaran
  lanjutan dengan `"Tagihan sudah lunas"`). Sisa ini masuk ke `totalUtang`
  pada net worth selamanya kecuali direkonsiliasi manual.
- **Langkah reproduksi:** Buat wallet PAYLATER, buat transaksi EXPENSE
  cicilan dengan `principal` dan `interestRate` yang menghasilkan
  `grandTotal` tidak habis dibagi bulat oleh `installmentMonths` (mis.
  principal 100000, rate 2.6%, months 3 → `totalInterest = round(100000 ×
  0.026 × 3) = 7800`, `grandTotal = 107800`, `monthlyAmount =
  round(107800/3) = 35933.33`, `monthlyAmount × 3 = 107799.99` — kurang
  Rp0,01 dari `grandTotal`). Bayar 3 termin penuh masing-masing
  `monthlyAmount` → status jadi `SETTLED`, tapi saldo wallet PAYLATER masih
  `-0.01`.
- **Severity:** Medium — nilainya kecil per kasus (di bawah unit Rupiah
  praktis, karena IDR tidak punya sub-rupiah di UI), tapi ini adalah bug
  integritas data yang sistematis dan diakui sendiri oleh komentar kode
  ("must never do money math [...] without this"), dan bisa membesar dengan
  jumlah pengguna serta rate/tenor tertentu (mis. tenor panjang, rate ganjil).
  Tidak memenuhi kriteria stable "Cicilan lunas tidak lagi dihitung sebagai
  hutang aktif" secara tepat — status berubah `SETTLED`, tapi saldo tidak
  benar-benar nol.

## 9. Dashboard totals

- **Status:** **Fail.**
- **Frontend entry point:** `app/(app)/dashboard/page.tsx`.
- **Backend endpoint/service:** `GET /v1/dashboard/summary` →
  `dashboard.controller.ts` → `dashboard-query.service.ts:getSummary` →
  `calculateNetWorth` (`utils/financial.ts`).
- **Database entities:** `Wallet` (`type`, `balance`).
- **Validasi tersedia (backend):** benar dan teruji —
  `netWorth = totalAset − totalUtang` (PD-001), Decimal-safe, di-scope ke
  `userId`, punya 8 test yang eksplisit menegaskan formula ini
  (`dashboardQueryService.test.ts:69-73`: *"reports netWorth as assets minus
  outstanding debt (PD-001)"*). `wallet-query.service.ts:getNetWorth` memakai
  helper Decimal yang **sama persis** dan dipakai ulang di setiap respons
  mutasi wallet (`account.controller.ts:110-121`).
- **Test tersedia:** `dashboardQueryService.test.ts`,
  `dashboardControllerBoundary.test.ts` — **tapi seluruhnya menguji backend
  saja**. Tidak ada satu pun test frontend yang menguji nilai Net Worth yang
  ditampilkan di halaman Dashboard.
- **Risiko terhadap data — Temuan F2 (CRITICAL):**
  1. **`GET /v1/dashboard/summary` tidak pernah dipanggil dari frontend.**
     Pencarian menyeluruh pada `pocket-mint-fe` untuk `dashboard/summary` atau
     hook `useDashboardSummary` **tidak menemukan satu pun pemanggilan**.
     Satu-satunya jejak string `"dashboard"` di luar halaman itu sendiri
     adalah invalidasi query key `["dashboard"]` di `useBills.ts:97` — yang
     tidak pernah punya `useQuery` pasangannya. Endpoint backend ini secara
     efektif adalah **dead code** dari sudut pandang produk yang berjalan.
  2. **Dashboard menghitung Net Worth sendiri di frontend, dan salah.**
     `app/(app)/dashboard/page.tsx:139-148`:
     ```ts
     const { totalAssets, totalDebts, netWorth } = useMemo(() => {
       const assets = wallets.filter(...).reduce((sum, w) => sum + w.balance, 0);
       const debts = wallets.filter(...).reduce((sum, w) => sum + Math.abs(w.balance), 0);
       return { totalAssets: assets, totalDebts: debts, netWorth: assets };
       //                                                ^^^^^^^^^^^^^^^^^^ BUG
     }, [wallets]);
     ```
     `netWorth` di-set sama dengan `assets` — **utang tidak pernah
     dikurangkan**, walau `totalDebts` dihitung dan ditampilkan terpisah di
     kartu sebelahnya. Hero Card menampilkan label **"Posisi keuangan
     bersih"** (net worth) dengan nilai yang secara matematis selalu identik
     dengan Total Aset, berapa pun utang pengguna.
  3. Ini secara langsung melanggar kriteria yang diminta audit ini ("Net
     worth = assets - outstanding debt") **dan** kriteria stable produk
     sendiri (`stable-criteria.md`: "Saldo dompet sama dengan hasil
     perhitungan seluruh transaksi terkait" — Net Worth adalah salah satu
     angka finansial paling terlihat di aplikasi dan salah untuk setiap
     pengguna yang punya utang aktif).
- **Langkah reproduksi:** Buat 1 wallet BANK saldo Rp5.000.000, buat 1 wallet
  CREDIT_CARD dengan outstanding Rp2.000.000 (mis. lewat transaksi EXPENSE
  cicilan). Buka `/dashboard` → "Posisi keuangan bersih" menampilkan
  **Rp5.000.000** (harusnya Rp3.000.000), sementara "Total hutang" di bawahnya
  benar menampilkan Rp2.000.000 — dua angka yang saling kontradiktif di layar
  yang sama.
- **Severity:** **Critical** — kesalahan perhitungan finansial pada metrik
  paling utama di aplikasi (Hero Card), terlihat oleh setiap pengguna dengan
  utang aktif, tidak tertangkap satu pun test yang ada.

## 10. Analytics totals

- **Status:** **Fail** untuk filter periode dan grafik arus kas multi-bulan;
  Partial untuk sisanya (sudah tercatat sebagian di `known-issues.md` #2).
- **Frontend entry point:** `app/(app)/analytics/page.tsx`.
- **Backend endpoint/service:** Tidak ada endpoint analytics khusus (sudah
  benar tercatat di `release-status.md`) — halaman ini memakai
  `useTransactions()` (`GET /v1/transactions`) dan `useWallets()`
  (`GET /v1/wallets`) yang **sama** dengan yang dipakai Dashboard.
- **Database entities:** `Transaction`, `Wallet` (dibaca, tidak ditulis).
- **Validasi tersedia:** Tidak relevan (read-only, tidak ada mutasi).
- **Test tersedia:** Tidak ada test frontend untuk halaman Analytics itu
  sendiri (tidak ditemukan `analytics*.test.ts` di `tests/`).
- **Risiko terhadap data — Temuan F3 (High):** `GET /v1/transactions` (yang
  dipanggil `useTransactions()`) **secara eksplisit hanya mengembalikan bulan
  berjalan** — dikonfirmasi langsung dari kode backend:
  `transaction.routes.ts:9`: `"GET /api/v1/transactions — auto-filtered to
  current month"`, dan `transaction.controller.ts:107`: `"Auto-filters to
  current month unless month/year explicitly provided"`. Endpoint terpisah
  `GET /v1/transactions/all` memang ada khusus untuk data tanpa batas bulan
  (`transaction.controller.ts:144-161`), **tapi pencarian menyeluruh di
  seluruh frontend untuk `transactions/all` atau `getAllTime` tidak
  menemukan satu pun pemanggilan.**

  Konsekuensi konkret di `analytics/page.tsx`:
  - Selector periode "3 bulan" dan "6 bulan" (`PeriodFilter`,
    `getPeriodStart`) memfilter `transactions` yang sudah dibatasi bulan
    berjalan oleh backend — sehingga memilih "3 bulan" atau "6 bulan" secara
    efektif menghasilkan **himpunan data yang sama** dengan "Bulan ini",
    karena tidak pernah ada transaksi bulan-bulan sebelumnya di dataset yang
    diterima frontend.
  - Grafik **"Arus kas — Pendapatan dan pengeluaran 6 bulan terakhir"**
    (`monthlyFlow`, baris 151-171) membangun 6 bucket bulan dari sumber data
    yang sama — 5 dari 6 bulan akan **selalu kosong** (bar tinggi 0) untuk
    pengguna mana pun yang punya riwayat transaksi lebih dari satu bulan,
    terlepas dari transaksi sungguhan yang ada di database.
  - Dashboard (`dashboard/page.tsx:212`, `"{transactions.length} transaksi
    tercatat"`) mewarisi keterbatasan yang sama — angka ini diam-diam hanya
    menghitung bulan berjalan, tanpa label yang menjelaskan itu.

  Ini melanggar langsung kriteria `stable-criteria.md`: **"Analitik
  menggunakan transaksi aktual dan rentang waktu yang benar"** — rentang
  waktu yang dipilih pengguna tidak benar-benar diterapkan ke data.
- **Langkah reproduksi:** Buat transaksi EXPENSE bertanggal 4 bulan lalu dan
  transaksi EXPENSE bertanggal hari ini. Buka `/analytics`, pilih periode
  "6 bulan" → grafik arus kas hanya menampilkan bar untuk bulan berjalan;
  bulan transaksi lama tidak muncul sama sekali, padahal datanya ada di
  database.
- **Severity:** High — data yang ditampilkan tidak sesuai rentang waktu yang
  dipilih pengguna (menyesatkan untuk pengambilan keputusan finansial), tapi
  tidak menyebabkan kerusakan data (read-only) dan sudah ada dua item terkait
  di `known-issues.md` (tombol ekspor mati) yang sifatnya lebih kosmetik
  dibanding ini.

## 11. User data isolation

- **Status:** Pass.
- **Frontend entry point:** `lib/api.ts` — setiap request melampirkan
  `Authorization: Bearer <supabase-access-token>` segar dari
  `getAccessToken()`; interceptor 401 mem-force logout + redirect ke
  `/login` jika token tidak valid, dan tidak pernah membiarkan header
  `Authorization` bawaan caller menimpa token asli (`config.headers.set(...)`
  selalu dipanggil di interceptor).
- **Backend endpoint/service:** `requireUser`/`requireVerifiedJwt`
  (`src/middleware/apiKeyAuth.ts`), dipasang di **setiap** route mutasi/baca
  yang menyentuh data pengguna — diverifikasi dengan membaca seluruh file di
  `src/routes/*.ts` (`walletRoutes.ts`, `transaction.routes.ts`,
  `installmentRoutes.ts`, `dashboardRoutes.ts`, `categoryRoutes.ts`,
  `user.routes.ts`): tidak ada satu route pun yang tidak melewati salah satu
  dari kedua middleware ini.
- **Database entities:** Semua model punya `userId` (`Wallet`, `Category`,
  `Transaction`, `Installment`, `Transfer`) dengan index
  `@@index([userId])`/`@@index([userId, ...])`.
- **Validasi tersedia:** Setiap service (`wallet.service.ts`,
  `transaction.service.ts`, `installment-payment.service.ts`,
  `dashboard-query.service.ts`, `wallet-query.service.ts`) melakukan query
  dengan `where: { id, userId }` (bukan `where: { id }` lalu cek belakangan) —
  pola `findFirst` yang scoped langsung ke `userId`, dikonfirmasi konsisten di
  setiap file yang dibaca untuk audit ini. Identitas `userId` **selalu**
  berasal dari `req.auth.userId` (hasil verifikasi JWT), **tidak pernah**
  dari body/query — dikonfirmasi lewat komentar eksplisit di setiap
  controller ("Identity comes only from the canonical auth context — never
  the query/body").
- **Test tersedia:** `httpBoundaryGuards.test.ts`, `httpSecurity.test.ts`,
  `walletControllerBoundary.test.ts`, `transactionControllerBoundary.test.ts`,
  `transactionQueryControllerBoundary.test.ts`,
  `installmentControllerBoundary.test.ts`,
  `dashboardControllerBoundary.test.ts`,
  `walletQueryControllerBoundary.test.ts` — delapan file test khusus
  boundary/ownership, CI juga memindai bundle produksi frontend untuk
  memastikan header legacy (`x-api-key`/`x-user-id`/`x-user-email`) tidak
  muncul lagi (dicatat di `known-issues.md`, diverifikasi konsisten di sini).
- **Risiko terhadap data:** Rendah untuk kode yang di-review. Sisa risiko ada
  di luar kode aplikasi: kredensial lama di git history dan status rotasi
  belum terkonfirmasi (lihat #12).
- **Severity:** — (risiko terkait kredensial dicatat di #12, bukan di sini).

## 12. Deployment and migration readiness

- **Status:** Not Ready — **sudah didokumentasikan dengan baik** di
  `known-issues.md` #3, #4 dan `release-status.md`; diverifikasi ulang di
  sini terhadap `pocket-mint-be/docs/deployment-runbook.md` dan
  `prisma-migration-reconciliation.md`.
- **Temuan yang dikonfirmasi ulang, tidak berubah sejak audit sebelumnya:**
  - `deployment-runbook.md` §5: migration history **drift** —
    `prisma migrate status` melaporkan "last common migration: null"; migrasi
    baseline (`..._init`, `..._rename_account_to_wallet`, yang terakhir
    muncul dua kali di remote) **tidak ada** di
    `prisma/migrations/` lokal. Database fresh/kosong akan **gagal** provision
    karena migrasi destruktif (`DROP COLUMN password`) akan dijalankan
    terhadap tabel yang belum punya kolom tersebut sama sekali.
  - §10–11: password database Supabase pernah ter-commit di `.env` yang
    dulu ter-track; API key lama (`kunci_...`) juga pernah hardcoded.
    Rencana purge history git berstatus eksplisit **"PENDING EXPLICIT
    APPROVAL (do not execute)"**, tertanggal 13 Juli 2026. Tidak ada dokumen
    lebih baru di kedua repo yang mengonfirmasi rotasi/purge sudah selesai.
  - Tidak ada bukti deployment production yang benar-benar sudah dijalankan
    dari dalam repo (runbook bersifat prosedural, §7–9 adalah instruksi,
    bukan laporan hasil).
  - Tidak ada bukti uji backup/restore data produksi (hanya replay migrasi
    skema di database disposable lokal).
- **Frontend entry point:** n/a (operasional).
- **Backend endpoint/service:** n/a (operasional/infrastruktur).
- **Database entities:** seluruh skema (`prisma/schema.prisma`) berpotensi
  terdampak pada provisioning database baru.
- **Test tersedia:** `prismaBillingMigration.test.ts`,
  `prismaFactory.test.ts`, `prismaSingleton.test.ts`,
  `prismaAdapter.integration.test.ts` (4 test **di-skip** tanpa
  `TEST_DATABASE_URL` — dikonfirmasi ulang, tidak dijalankan di lingkungan
  audit ini).
- **Risiko terhadap data:** Tinggi untuk provisioning database baru
  (staging/production) sampai baseline migration direkonstruksi atau database
  baru diprovisikan dari snapshot yang sudah ada — bukan dari skema kosong.
  Risiko kebocoran kredensial tetap terbuka sampai rotasi dan purge history
  dieksekusi dan dikonfirmasi.
- **Severity:** High (memblokir kriteria Reliability di `stable-criteria.md`
  secara langsung: "Seluruh migration dapat dijalankan pada database baru"
  dan bagian Security "Secret tidak tersimpan di repository").

---

## Verifikasi Financial Integrity (spesifik per item yang diminta)

| Aturan | Backend (service/domain) | Status | Catatan |
| --- | --- | --- | --- |
| Net worth = assets − outstanding debt | `utils/financial.ts:calculateNetWorth` | **Backend: Pass.** **Frontend Dashboard: Fail.** | Backend benar & teruji (PD-001). Dashboard FE mengabaikan endpoint ini dan menghitung ulang secara salah — lihat **F2 (Critical)** di #9. |
| Transfer tidak mengubah net worth | `domain/transactionBalance.ts:computeBalanceEffect` (TRANSFER: −amount sumber, +amount tujuan) | Pass | Diverifikasi aljabar: baik transfer aset→aset maupun aset→wallet DEBT sama-sama menjaga `totalAset − totalUtang` tetap konstan, karena kedua sisi memakai delta bertanda yang sama persis (satu fungsi, satu sumber kebenaran, dipakai oleh create/update/delete/reconciliation). Teruji di `transactionBalance.test.ts`. |
| Pembayaran cicilan = debt settlement, bukan expense baru | `installment-payment.service.ts:payInstallment` (mencatat `type: "TRANSFER"`, bukan `EXPENSE`) | Pass | Sesuai `financial-logic.skill.md`. Teruji di `installmentPaymentService.test.ts`. |
| Tidak ada double deduction | `applyBalanceDeltas` (atomic `increment`, bukan read-modify-write); update/delete transaksi memakai "reverse-then-apply" dari baris tersimpan, bukan dari data request | Pass | Reversal transaksi **selalu** dihitung dari `existing` (baris di DB), bukan dari payload update — mencegah drift dan double-apply. Installment: delete membalik `grandTotal` penuh (bukan `amount` per-termin), dikonfirmasi di `transaction.service.ts:453-463`. |
| Saldo & activity history tetap sinkron | `domain/reconciliation.ts` + `reconciliationAudit.test.ts` (7 kasus) | Pass (dengan pengecualian F1) | Ada script read-only reconciliation (`src/scripts/reconcile.ts --audit`) dan domain helper `reconcileWalletBalances` yang independen dari jalur tulis. **Kecuali** kasus sisa pembulatan cicilan (F1) yang membuat saldo "benar secara ledger" tapi tidak pernah mencapai nol meski status `SETTLED`. |
| Failed operation tidak meninggalkan partial update | `db.$transaction(...)` membungkus setiap mutasi multi-langkah (create/update/delete transaksi, create/pay installment) | Pass | Diverifikasi di `transaction.service.ts` (3 fungsi, semua pakai `$transaction`) dan `installment-payment.service.ts` (satu `$transaction` untuk create Transaction + 2× wallet update + update Installment). Wallet CRUD tidak butuh `$transaction` karena hanya satu write per operasi. |
| Nilai uang tidak mengalami floating point error | `Prisma.Decimal` end-to-end di backend (`Decimal(15,2)` di schema); `parseFloat` hanya di response boundary (serializer) | Pass (backend); **Medium residual** | Backend: tidak ada aritmetika uang dengan `number`/`float` sebelum tersimpan — dikonfirmasi di `transaction.service.ts`, `domain/installment.ts`, `domain/transactionBalance.ts`. **Tapi** `finalMonthlyAmount` (mekanisme yang justru dirancang untuk menghindari residu pembulatan pada termin terakhir) tidak terpakai — lihat F1. Frontend menjumlahkan angka `number` hasil `parseFloat` untuk agregat tampilan (dashboard/analytics) — untuk IDR yang tidak punya sub-rupiah di UI, risiko presisi ini rendah dalam praktik, tapi secara teknis bukan Decimal-safe. |

### Temuan baru (di luar `known-issues.md` yang sudah ada)

- **F1 (Medium):** `finalMonthlyAmount` dihitung & diuji di
  `domain/installment.ts` tapi tidak pernah diintegrasikan ke
  `installment-payment.service.ts` atau schema `Installment` — cicilan
  dengan `grandTotal` yang tidak habis dibagi rata oleh `installmentMonths`
  meninggalkan sisa hutang beberapa sen yang tak tertagih setelah status
  `SETTLED`. Lihat #8.
- **F2 (Critical):** Dashboard frontend menghitung Net Worth = Total Aset
  saja (mengabaikan utang) dan tidak pernah memanggil
  `GET /v1/dashboard/summary` yang sudah benar di backend. Lihat #9.
- **F3 (High):** Analytics (dan sebagian Dashboard) memakai endpoint
  transaksi yang di-scope ke bulan berjalan (`GET /transactions`), bukan
  `GET /transactions/all`, sehingga filter periode 3/6 bulan dan grafik arus
  kas 6 bulan tidak merefleksikan data sungguhan. Lihat #10.
- **F4 (Low):** Model Prisma `Transfer` (`schema.prisma:228-247`) tidak
  dipakai oleh alur transfer yang sebenarnya (yang memakai `Transaction`
  dengan `toWalletId`) — kemungkinan sisa desain lama, tidak berbahaya tapi
  berpotensi membingungkan pengembang berikutnya atau alat migrasi otomatis.
- **F5 (Medium):** Backend tidak memvalidasi bahwa transaksi `INCOME` tidak
  boleh menyasar wallet DEBT — hanya dicegah di frontend. Lihat #3.
- **F6 (Low, dokumentasi):** `skills/financial-logic.skill.md` menyatakan net
  worth adalah total saldo ASSET saja ("Debt does NOT subtract from net
  worth directly ... decided Jul 2026") dan mengklaim ini "implemented in
  backend calculateNetWorth, dashboard, and wallets page". **Kode backend
  yang sebenarnya (dan teruji) melakukan yang sebaliknya** (assets − debt,
  PD-001). `release-status.md` juga mewarisi klaim yang sama ("Net worth =
  total saldo ASSET"). Dokumen otoritatif ini perlu diperbaiki agar cocok
  dengan kode, atau kode perlu diperiksa ulang untuk memastikan mana yang
  sebenarnya jadi keputusan produk terakhir — audit ini **tidak mengambil
  keputusan produk**, hanya melaporkan bahwa keduanya saat ini saling
  bertentangan dan frontend kebetulan mengikuti dokumen yang (menurut test
  backend) sudah usang.

---

## Keputusan

### Not Ready untuk MVP Stable

Kriteria yang secara eksplisit memblokir MVP Stable (per instruksi audit):

- **Critical issue ada:** F2 — Net Worth di Dashboard salah secara
  matematis untuk setiap pengguna dengan utang aktif.
- **High issue pada core flow ada:** F3 (Analytics/Dashboard totals
  memakai rentang waktu yang salah), known-issue #1 (form ubah password
  palsu, bagian dari Authentication), dan risiko kredensial/migrasi yang
  belum di-resolve (#12).
- **Kesalahan perhitungan finansial ada:** F1 (sisa pembulatan cicilan yang
  tak tertagih) dan F2.
- **Core flow yang belum pernah diuji secara end-to-end (bukan cuma unit
  test service):** Net Worth Dashboard tidak punya test frontend sama
  sekali yang memverifikasi *nilai* yang tampil ke pengguna — seluruh 8 test
  Dashboard yang ada menguji backend, yang ternyata tidak pernah dipanggil
  oleh halaman yang diuji.

### Apakah masih layak MVP Beta?

`release-status.md` (audit sebelumnya, tanggal sama) merekomendasikan **MVP
Beta**, dengan alasan seluruh alur inti terhubung end-to-end dan punya
automated test serta CI gate. Audit ini **tidak membantah** bahwa
kabel FE↔BE↔DB tersambung untuk semua alur — itu benar dan terverifikasi
ulang. Tapi audit ini menemukan bahwa **salah satu alur yang paling terlihat
oleh pengguna (Dashboard Net Worth) tersambung ke kode yang salah**, bukan
sekadar "belum sempurna" — pengguna dengan utang melihat angka finansial
utama yang keliru setiap kali membuka aplikasi. Ini adalah kelas masalah yang
sama dengan known-issue #1 (form ubah password palsu): fitur yang *terlihat*
berfungsi tapi secara diam-diam salah.

**Rekomendasi status: tetap MVP Beta, tidak turun ke Internal MVP** — karena
cakupan test, CI gate, dan sebagian besar alur transaksi/cicilan/transfer
tetap benar dan teruji dengan baik — **tapi status ini tidak boleh naik
menjadi MVP Stable sampai F1–F3 diperbaiki**, terlepas dari progres migrasi
dan rotasi kredensial di #12.

---

## Blocker terurut dari risiko tertinggi

1. **[Critical] Perbaiki Net Worth di Dashboard (F2).** Ganti perhitungan
   lokal di `dashboard/page.tsx` dengan pemanggilan
   `GET /v1/dashboard/summary` (atau minimal perbaiki rumus lokal menjadi
   `assets − debts`, tapi memanggil endpoint backend yang sudah teruji lebih
   aman daripada menduplikasi logikanya di frontend). Tambahkan test
   frontend yang menegaskan nilai Net Worth yang dirender, bukan cuma bahwa
   komponennya mount.
2. **[High] Perbaiki rentang waktu Analytics (F3).** Ganti sumber data
   `analytics/page.tsx` (dan bagian Dashboard yang butuh riwayat lengkap)
   dari `useTransactions()` (`GET /transactions`, bulan berjalan) ke
   `GET /transactions/all` dengan filter tanggal di sisi client, atau buat
   endpoint backend baru yang menerima rentang tanggal eksplisit. Tambahkan
   test yang membuktikan filter "3 bulan"/"6 bulan" benar-benar mengambil
   data lintas bulan.
3. **[High] Selesaikan rotasi kredensial & keputusan purge git history
   (known-issues #4, `deployment-runbook.md` §10-11).** Blocker keamanan
   yang statusnya sudah "pending" sejak 13 Juli 2026 — perlu keputusan
   eksplisit (eksekusi atau terima risiko secara sadar), bukan dibiarkan.
4. **[High] Rekonstruksi baseline migration atau tetapkan prosedur
   provisioning database baru (known-issues #3).** Tanpa ini, deployment ke
   database staging/production yang benar-benar baru (bukan snapshot) akan
   gagal di tengah jalan pada langkah destruktif.
5. **[Medium] Perbaiki form ubah password di halaman Profil
   (known-issues #1)** — sudah lama diketahui, prioritasnya naik karena
   ini bagian dari flow Authentication yang diaudit di sini dan berdampak
   langsung ke persepsi keamanan akun pengguna.
6. **[Medium] Terapkan `finalMonthlyAmount` pada termin cicilan terakhir
   (F1),** atau bangun mekanisme reconciliation otomatis yang menutup sisa
   pembulatan saat `status` menjadi `SETTLED`, supaya wallet DEBT benar-benar
   nol saat cicilan lunas.
7. **[Medium] Tambahkan guard backend agar `INCOME` tidak bisa menyasar
   wallet DEBT (F5),** sejajar dengan guard yang sudah ada untuk `EXPENSE`
   dari wallet `LOAN`.
8. **[Medium] Sinkronkan `skills/financial-logic.skill.md` dengan
   implementasi backend yang sebenarnya (F6)** — khususnya rumus net worth
   dan daftar sumber pembayaran cicilan yang diizinkan — supaya dokumen
   otoritatif tidak lagi menyesatkan pengembang (manusia maupun agent)
   berikutnya.
9. **[Low] Bersihkan atau dokumentasikan model `Transfer` yang tidak
   terpakai (F4)**, dan selaraskan label navigasi dengan `skills/design.md`
   (known-issues #5).
10. **[Low] Lengkapi bukti operasional yang tersisa:** jalankan 4 test
    integrasi Prisma yang di-skip dengan `TEST_DATABASE_URL`
    (known-issues #6), tambahkan `CHANGELOG.md`/release notes
    (known-issues #7), dan lakukan uji backup/restore data produksi yang
    sesungguhnya (known-issues #8).
