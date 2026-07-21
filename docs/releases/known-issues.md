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

**Update 18 Juli 2026 (sinkronisasi final, `v0.3.0-rc.2`):** Statuses di bawah
disinkronkan dengan hasil audit final independen §17 pada
`mvp-stable-rc-validation.md` (sumber kebenaran validasi saat ini). PM-STAB-001
dan PM-STAB-002 diturunkan ke **Resolved** — keduanya sudah dikonfirmasi lewat
pembacaan kode langsung, automated test, smoke test HTTP nyata, dan capture
screenshot desktop/mobile pada sesi audit tersebut, bukan hanya klaim. PM-STAB-006
dan PM-STAB-007 diturunkan dari "needs confirmation" ke **Resolved** karena
konfirmasi eksplisit yang diminta (angka before/after) sudah diperoleh lewat
smoke test HTTP §17.6. PM-STAB-010 diturunkan ke **Resolved** karena seluruh
3 sub-item (integration test ter-commit permanen, changelog, backup/restore
dengan client tools nyata) sudah tuntas. PM-STAB-003 dan PM-STAB-004 (sisa
staging/production) **tetap Open/High** — keduanya butuh akses/persetujuan di
luar repository dan tidak berubah sejak rc.1. Tidak ada issue yang ditandai
selesai hanya berdasarkan perubahan kode tanpa bukti validasi terpisah.

Severity: **Critical** (data/keamanan salah atau bocor), **High** (menyesatkan
pengguna atau memblokir rilis), **Medium** (fungsional tapi tidak lengkap),
**Low** (kosmetik/dokumentasi).

**Update 19 Juli 2026 (penutupan `PM-STAB-004`):** Migrasi database
production dijalankan dan diverifikasi (`prisma migrate status` → "Database
schema is up to date!"; `prisma migrate diff --from-config-datasource
--to-schema prisma/schema.prisma --script` → "This is an empty migration.";
deployment Railway production sehat; `GET /health` → `200`). `PM-STAB-004`
diperbarui menjadi **Resolved** — lihat entri di bawah untuk detail closure.
Dengan `PM-STAB-003` dan `PM-STAB-004` sama-sama tidak lagi Open, tidak ada
lagi blocker High/Critical menuju MVP Stable; lihat `release-status.md`
untuk status terkini (**MVP Stable**, `0.3.0`, 19 Juli 2026).

Issue PM-STAB-001 s.d. PM-STAB-010 adalah **blocker menuju MVP Stable**,
diurutkan dari severity/risiko tertinggi ke terendah, sesuai
`mvp-stability-audit.md` bagian "Blocker terurut dari risiko tertinggi". ID
ini adalah identitas resmi yang dipakai lintas dokumen (`release-status.md`,
`stable-criteria.md`) — jangan diganti nomor lain di masa depan. PM-STAB-011
ditambahkan pada audit `v0.3.0-rc.2` sebagai temuan Medium **non-blocking**
(bukan bagian dari 10 blocker asli), lihat entri di bawah.

---

## PM-STAB-001 — [Critical] Dashboard Net Worth ignores debt

- **Status:** Resolved (18 Juli 2026).
- **Resolution:** `dashboard/page.tsx` sekarang memanggil
  `useDashboardSummary` → `GET /v1/dashboard/summary` untuk Net Worth,
  bukan menghitung ulang lokal. Dikonfirmasi lewat pembacaan kode langsung,
  smoke test HTTP nyata (`mvp-stable-rc-validation.md` §17.6:
  `net_worth == total_aset - total_utang`, selisih 0), dan capture
  screenshot desktop **dan** mobile hari ini yang menunjukkan
  **Rp 28.664.000** = Rp 60.950.000 (aset) − Rp 32.286.000 (utang) di UI
  produksi (§17.8) — bukan hanya di response API.
- **Evidence:** `mvp-stable-rc-validation.md` §17.1, §17.6, §17.8.
- **Affected area (historis):** Frontend — `app/(app)/dashboard/page.tsx` (Hero Card,
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

- **Status:** Resolved (18 Juli 2026).
- **Resolution:** `analytics/page.tsx` sekarang memakai `useAllTransactions`
  → `GET /transactions/all` (bukan `GET /transactions` yang auto-filtered
  bulan berjalan), dengan filter tanggal di sisi client. Dikonfirmasi lewat
  pembacaan kode langsung dan capture screenshot mobile hari ini: filter
  "6 bulan" pada Analitik menampilkan Cash Flow **+Rp 23.944.000** dengan
  badge "Real data" dan grafik cash flow terisi lintas bulan, bukan kosong
  seperti sebelum perbaikan (`mvp-stable-rc-validation.md` §17.8).
- **Evidence:** `mvp-stable-rc-validation.md` §17.1, §17.8.
- **Affected area (historis):** Frontend — `app/(app)/analytics/page.tsx` (filter
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

## PM-STAB-003 — [Resolved after forensic verification] Exposed credentials require rotation

- **Status:** **Resolved after forensic verification** (19 Juli 2026).
  *(Was: Open/High. Severity history: Medium → High (18 Juli 2026, lihat
  catatan rekonsiliasi lama di bawah) → Resolved after forensic
  verification (19 Juli 2026, lihat catatan di bawah).)*
- **Affected area:** Operasional/infrastruktur — git history
  `pocket-mint-be` dan `pocket-mint-fe`.
- **Initial incident response assumption (13–18 Juli 2026):** `.env` /
  `.env.local` pernah ter-track sebelum commit `a900b69`, dan
  `deployment-runbook.md` §10 waktu itu menyatakan password database
  Supabase dan API key lama pernah ter-hardcode/ter-commit — diasumsikan
  kredensial database produksi mungkin ikut terekspos.
- **Forensic re-verification (19 Juli 2026):** Full-history forensic
  analysis atas **setiap** `.env*` historis, setiap git blob, setiap commit
  yang menambah/menghapus file env, setiap pola connection-string
  PostgreSQL, setiap occurrence `DATABASE_URL`/`DIRECT_URL`, dan semua
  branch di **kedua** repo (`pocket-mint-be`, `pocket-mint-fe`) menemukan:
  tidak ada `DATABASE_URL`, `DIRECT_URL`, password database, Supabase
  service-role key, atau kredensial database privileged lain di git object
  manapun yang ter-track. Satu-satunya nilai yang pernah ter-commit adalah
  konfigurasi client publik proyek **Development**
  (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`) milik project ref
  `clambteumrweoektkejl`, plus API key lama (`kunci_...`) yang memang
  ter-hardcode di source frontend (temuan ini **tetap valid** — lihat
  Residual Risk). Project **Production** (`wvrdnmiuyeecqatlwbpp`) **tidak
  pernah muncul** di git history repo manapun.
- **Evidence / lokasi kode:** `pocket-mint-be/docs/deployment-runbook.md`
  §10–11 (diperbarui 19 Juli 2026 dengan hasil forensik yang sama).
- **Resolution rationale:**
  - Full git history kedua repo sudah diaudit (semua commit, semua branch,
    semua blob historis, bukan hanya HEAD).
  - Production Supabase project tidak terdampak — tidak pernah muncul di
    history manapun.
  - Tidak ada eksposur kredensial database privileged yang terkonfirmasi
    (password DB, `DATABASE_URL`/`DIRECT_URL`, service-role key).
  - Hanya konfigurasi client-side publik proyek Development
    (`NEXT_PUBLIC_*`) yang pernah ter-commit secara historis.
  - **Tidak direkomendasikan** merotasi kredensial database Production atau
    Supabase secret Production berdasarkan evidence saat ini — lihat
    Residual Risk untuk item yang tetap terbuka.
- **Acceptance criteria (terpenuhi):** Forensic audit berbasis-repo selesai
  dan didokumentasikan; tidak ada kredensial privileged yang ditemukan;
  kesimpulan konsisten di `deployment-runbook.md` dan dokumen ini.
- **Required regression tests:** Tidak ada test kode yang relevan (temuan
  operasional/dokumentasi). Jika evidence baru muncul (mis. kredensial
  privileged ditemukan lewat scan lanjutan seperti `gitleaks`/`trufflehog`),
  buka ulang issue ini dengan severity sesuai temuan.
- **Catatan rekonsiliasi (historis, dipertahankan):** `known-issues.md`
  versi sebelumnya menandai ini Medium; `mvp-stability-audit.md` §12
  menilai ulang risiko ini sebagai High karena diasumsikan memblokir
  kriteria Security di `stable-criteria.md`. Update 18 Juli 2026
  mengonfirmasi status Open berdasarkan asumsi awal tersebut, sebelum
  forensic re-verification 19 Juli 2026 di atas.

### Lessons Learned

- **Jangan pernah commit file `.env`** — sekali ter-track, nilainya tetap
  ada di history walau file kemudian di-`git rm`/untrack.
- **`.gitignore` bersifat preventif, bukan korektif** — menambahkan pola ke
  `.gitignore` mencegah kebocoran berikutnya, tapi tidak menghapus apa yang
  sudah ter-commit sebelumnya.
- **Lakukan verifikasi forensik berbasis evidence sebelum merotasi
  kredensial production** — asumsi insiden awal berguna untuk respons
  cepat, tapi keputusan rotasi/purge production sebaiknya menunggu
  konfirmasi konkret dari full-history scan, supaya effort operasional
  (rotasi, koordinasi downtime, invalidasi sesi) diarahkan ke risiko yang
  benar-benar ada.
- **Pemisahan environment Development/Production membatasi dampak** —
  karena backend/frontend tidak pernah menunjuk ke project Production
  secara langsung dalam file yang ter-track, kebocoran historis di repo ini
  terbatas pada konfigurasi Development, tidak pernah menyentuh Production.

### Residual Risk

- **Anon key Development historis tetap terlihat** —
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` project Development
  (`clambteumrweoektkejl`) pernah ter-commit. Ini adalah public client key
  by design (dilindungi oleh RLS di sisi Supabase), bukan kredensial
  privileged, tapi tetap tercatat sebagai residual visibility.
- **Git history kedua repo masih menyimpan konfigurasi publik Development**
  (`NEXT_PUBLIC_*`) di commit-commit lama — belum di-purge dari history
  (lihat `deployment-runbook.md` §11, masih "PENDING EXPLICIT APPROVAL").
- **API key lama (`kunci_...`) tetap ter-hardcode di history frontend** —
  sudah retired dan backend tidak lagi menerimanya, tapi nilainya masih
  terlihat di git history sampai purge (§11) dieksekusi.
- **Purge git-history opsional** dapat dilakukan kapan pun untuk
  menghilangkan residual visibility di atas, tapi bukan blocker keamanan
  karena tidak ada kredensial privileged yang perlu dilindungi olehnya.

## PM-STAB-004 — [Resolved] Database baseline migration is incomplete

- **Status:** **Resolved** (19 Juli 2026). *(Severity history: Medium → High
  (18 Juli 2026, lihat catatan rekonsiliasi di bawah) → Resolved (19 Juli
  2026, migrasi production dijalankan — lihat "Penutupan" di bawah).)*
- **Penutupan (19 Juli 2026):** Sub-item terakhir yang menahan status Open —
  `migrate resolve --applied` + `migrate deploy` terhadap database production
  nyata — sudah dijalankan dan diverifikasi:
  - `npx prisma migrate status` → `Database schema is up to date!`
  - `npx prisma migrate diff --from-config-datasource --to-schema
    prisma/schema.prisma --script` → `-- This is an empty migration.`
  - Deployment Railway production sehat.
  - `GET /health` → `200`.
  Acceptance criteria PM-STAB-004 (lihat di bawah) sekarang terpenuhi
  sepenuhnya — baseline migration terverifikasi **dan** `migrate resolve
  --applied` + `migrate deploy` sudah dijalankan terhadap production nyata.
  Lihat juga Addendum "Penutupan PM-STAB-004" di
  `mvp-stable-rc-validation.md` dan `release-status.md`.
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
  sepenuhnya (historis, per 18 Juli 2026 — lihat "Penutupan (19 Juli 2026)"
  di atas untuk status terkini):** `migrate resolve --applied
  20260710000000_baseline` + `migrate deploy` (untuk 3 migration terbaru,
  termasuk migration ke-4) masih ditandai eksplisit **"⚠ MANUAL — run
  yourself after review"** dan **belum dieksekusi** terhadap staging/production
  nyata — ini butuh akses ke database bersama, backup/PITR window, dan
  persetujuan eksplisit yang di luar cakupan task ini (lihat
  `agent-rules.skill.md`: migration command hanya boleh dijalankan terhadap
  database disposable). Jangan tandai PM-STAB-004 resolved sampai langkah
  staging/production ini benar-benar dijalankan dan diverifikasi. **(Ini
  sudah terjadi 19 Juli 2026 — lihat "Penutupan" di atas.)**
- **Acceptance criteria:** Baseline migration direkonstruksi agar cocok
  dengan skema remote (**terpenuhi** — dan sekarang terverifikasi mencakup
  seluruh 4 migration, bukan hanya 3); `migrate resolve --applied` +
  `migrate deploy` dijalankan dan diverifikasi pada production nyata
  (**terpenuhi 19 Juli 2026** — lihat "Penutupan" di atas).
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
- **Update 18 Juli 2026 (audit final `v0.3.0-rc.2`):** Bagian database
  kosong/baru dikonfirmasi ulang independen — **Resolved untuk kasus ini**
  (5 migrasi, termasuk migration ke-5 yang menghapus model `Transfer`,
  ter-apply bersih dari nol; `prisma migrate status` "up to date";
  `mvp-stable-rc-validation.md` §17.5). Bagian staging/production **tetap
  Open, tidak berubah** — tidak ada environment staging/production nyata
  yang bisa dijalankan `migrate resolve --applied` + `migrate deploy`
  terhadapnya (§17.1). Ini adalah blocker High kedua yang tersisa menuju
  "Ready to promote to MVP Stable", bersama PM-STAB-003.
- **Update 18 Juli 2026 (sesi staging validation, `v0.3.0-rc.2-staging-validation.md`):**
  Keputusan produk dikonfirmasi ke pemilik repo: Pocket Mint **tidak akan
  punya environment staging cloud terpisah** (proyek pribadi) — hanya
  local/dev dan production. Ini menggantikan asumsi lama di
  `agent-rules.skill.md` backend ("`dev` branch → Railway Staging") yang
  **tidak pernah benar-benar dibuat** (dikonfirmasi ulang: tidak ada config
  Railway/Vercel/Fly/Docker di kedua repo). Sesi ini menjalankan validasi
  penuh terhadap **database PostgreSQL disposable lokal yang benar-benar
  di-provision dan dijalankan** (bukan mock, bukan hanya `npx vitest run`)
  sebagai pengganti staging cloud: `prisma migrate deploy` dari kosong
  (5 migrasi, PASS), aplikasi di-boot dan `/health` 200, **42/42 HTTP smoke
  test PASS** (auth, wallet, transaksi, cicilan, dashboard, analytics,
  isolasi, operational — lihat detail lengkap di
  `v0.3.0-rc.2-staging-validation.md` §4), dan **backup/restore penuh
  dengan `pg_dump`/`pg_restore` nyata PASS** (row count identik, 0 orphan
  FK, smoke test terhadap database hasil restore 200 dengan data benar).
  **Status TETAP Open** — validasi ini memperkuat bukti "provisioning
  database kosong" (sudah Resolved sejak sebelumnya) tapi **tidak**
  menjalankan sub-item inti yang menahan Resolved: `migrate resolve
  --applied` + `migrate deploy` terhadap database **production yang sudah
  berjalan** dan berisi data pengguna nyata (Supabase, `.env`
  `DATABASE_URL`) — ini sengaja tidak disentuh pada sesi ini karena
  membutuhkan persetujuan eksplisit terpisah dan jendela backup sebelum
  migration dijalankan terhadap data pengguna nyata, sesuai
  `agent-rules.skill.md` ("Common Mistakes": jangan jalankan migration
  terhadap `.env` "untuk testing"). Lihat
  `v0.3.0-rc.2-staging-validation.md` untuk matriks lengkap dan keputusan
  "Staging Validation Pass with Non-blocking Issues".

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

- **Status:** Resolved (18 Juli 2026).
- **Update 18 Juli 2026 (PM-STAB-008 reconciliation):** Code fix found
  already in `installment-payment.service.ts:60-72`. `payInstallment` now
  computes `expectedAmount` via `computeFinalMonthlyAmount` for the final
  term and rejects the regular `monthlyAmount` on that term (`INVALID_AMOUNT`).
  Test `installmentPaymentService.test.ts` covers the PM-STAB-006 case
  (non-divisible grandTotal, finalMonthlyAmount used, debt wallet reaches
  exactly zero after SETTLED). Schema unchanged — `finalMonthlyAmount` is
  derived from stored fields at payment time.
- **Update 18 Juli 2026 (audit final, explicit confirmation):** HTTP smoke
  test independen membayar cicilan sampai termin terakhir (3/3) dan
  memverifikasi outstanding/balance dompet cicilan = **0 tepat**, bukan sisa
  pembulatan (`mvp-stable-rc-validation.md` §17.6). Ini menutup satu-satunya
  item "awaiting confirmation" yang tersisa.
- **Affected area:** Backend — `installment-payment.service.ts:payInstallment`,
  domain `domain/installment.ts` (`computeInstallmentPlan`,
  `computeFinalMonthlyAmount`).
- **Evidence / lokasi kode:** `installment-payment.service.ts:60-72`
  (final term detection + expectedAmount),
  `installmentPaymentService.test.ts` (PM-STAB-006 test cases),
  `mvp-stable-rc-validation.md` §17.6 (HTTP confirmation).
- **Acceptance criteria:** ✅ `finalMonthlyAmount` used in final term
  validation; ✅ regular `monthlyAmount` rejected on final term; ✅ debt
  wallet = 0 after SETTLED, confirmed via HTTP.
- **Required regression tests:** Already in `installmentPaymentService.test.ts`.

## PM-STAB-007 — [Medium] Backend allows INCOME targeting DEBT wallet

- **Status:** Resolved (18 Juli 2026).
- **Update 18 Juli 2026 (PM-STAB-008 reconciliation):** Code fix found
  already in `transaction.service.ts:141-143`. Backend now rejects INCOME
  targeting CREDIT_CARD, PAYLATER, or LOAN (`classifyWalletForNetWorth(wallet.type)
  === 'DEBT'`) with 400 BAD_REQUEST before any database write. Guard also
  active on the update path (re-targeting and type-flip cases). Tested:
  `transactionService.test.ts` — 5 PM-STAB-007 cases covering create
  (ASSET allowed, all 3 DEBT types rejected, user isolation) and update
  (re-target, type-flip).
- **Update 18 Juli 2026 (audit final, explicit confirmation):** HTTP smoke
  test independen — `POST /v1/transactions` INCOME ke wallet CREDIT_CARD →
  `400 BAD_REQUEST` end-to-end lewat request HTTP nyata, bukan hanya unit
  test (`mvp-stable-rc-validation.md` §17.6, §8). Ini menutup satu-satunya
  item "awaiting confirmation" yang tersisa.
- **Affected area:** Backend — `transaction.service.ts:createTransaction`
  (line 141-143) and `updateTransaction` (line 342-344).
- **Evidence / lokasi kode:** `transaction.service.ts:141-143`
  (`classifyWalletForNetWorth(wallet.type) === 'DEBT'` guard),
  `transactionService.test.ts` (PM-STAB-007 test cases),
  `mvp-stable-rc-validation.md` §17.6 (HTTP confirmation).
- **Acceptance criteria:** ✅ Backend rejects INCOME to all three DEBT types;
  ✅ Guard fires before any write (no `$transaction` call); ✅ User isolation
  preserved; ✅ Update path also guarded; ✅ Confirmed via HTTP smoke test.
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
- **Update 18 Juli 2026 (audit final, residual typo):** Audit `v0.3.0-rc.2`
  menemukan typo `PAYLOAD` (seharusnya `PAYLATER`) masih tersisa di baris
  ~18 pada dua salinan `financial-logic.skill.md`
  (`pocket-mint-fe/skills/` dan `pocket-mint-fe/.claude/skills/`) —
  kontradiksi internal kecil dengan baris lain di file yang sama. Diperbaiki
  langsung pada sesi audit tersebut (`mvp-stable-rc-validation.md` §17.1,
  §17.9). Status Resolved di atas tetap berlaku; ini catatan bahwa satu
  residual minor sempat lolos sebelum ditutup permanen.

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
- **Update 18 Juli 2026 (audit final, sub-item 1 resolved):** Model Prisma
  `Transfer` **sudah dihapus** via migration nyata
  `20260718000000_drop_unused_transfer_model` (dikonfirmasi replay dari
  database kosong, `mvp-stable-rc-validation.md` §7, §17.1). Sub-item 1
  ditutup. Sub-item 2 (label navigasi) **tetap Open** dan makin dikonfirmasi
  pada audit final: bottom nav mobile sekarang menampilkan **6 ikon**
  (Dashboard, Dompet, Transaksi, Cicilan, Analitik, + trigger dropdown akun
  terpisah) — bukan 5 item "Akun" sesuai kontrak desain
  (`mvp-stable-rc-validation.md` §17.8). Butuh keputusan produk eksplisit,
  bukan sekadar perbaikan kode.

## PM-STAB-010 — [Low] Missing integration test coverage, backup, and restore validation

- **Status:** Resolved (18 Juli 2026, audit final `v0.3.0-rc.2`).
- **Update 18 Juli 2026 (audit final):** Seluruh 3 sub-item sekarang tuntas
  dengan bukti:
  1. **Sub-item 1 (integration test) — Resolved.** Test integrasi Prisma
     tidak lagi skip: 11/11 lulus (`npm run test:integration`), **dan**
     seluruh infrastruktur pendukungnya (`scripts/run-integration-tests.mjs`,
     guard `TEST_DATABASE_URL`, wiring CI Postgres service) sudah **ter-commit
     permanen** ke git (commit `0c6c370 ci: wire disposable Postgres service
     for Prisma integration tests`) — bukan lagi working-tree lokal yang bisa
     hilang. Lihat `mvp-stable-rc-validation.md` §17.1, §17.3.
  2. **Sub-item 2 (changelog `pocket-mint-fe`) — Resolved** (tidak berubah
     dari update sebelumnya, lihat di bawah).
  3. **Sub-item 3 (backup/restore) — Resolved.** Drill penuh dijalankan
     ulang dengan client tools nyata (`pg_dump`/`pg_restore`/`psql`, bukan
     hanya mengutip log lama): backup sukses, restore ke database kosong
     sukses, guard restore ditolak sesuai desain, row count sumber dan hasil
     restore **identik persis** (users: 8, wallets: 12, transactions: 21,
     installments: 3, categories: 96), 0 orphan FK, smoke test aplikasi
     terhadap database hasil restore → `200` di seluruh endpoint yang diuji.
     Lihat `mvp-stable-rc-validation.md` §17.7.
- **Update 18 Juli 2026, PM-STAB-010B (historis):** bagian changelog
  resolved di `pocket-mint-fe`, lihat sub-item 2 di atas.
- **Affected area:** Operasional — `pocket-mint-be` test suite, prosedur
  disaster recovery. (Sub-item changelog sebelumnya di sini sudah
  diselesaikan di `pocket-mint-fe`; lihat catatan sub-item 2.)
- **Expected behavior:** Seluruh test integrasi backend dijalankan dan
  lulus dengan bukti; changelog/release notes tersedia
  (`stable-criteria.md` — Release Readiness); backup dan proses pemulihan
  data telah diuji (`stable-criteria.md` — Reliability).
- **Actual behavior (historis, sebelum resolved):**
  1. Empat test integrasi Prisma di-skip:
     `pocket-mint-be/test/prismaAdapter.integration.test.ts` memakai
     `describe.skipIf(!TEST_DATABASE_URL)`; `npx vitest run` melaporkan
     366 lulus, 0 gagal, **4 skip** karena `TEST_DATABASE_URL` tidak diset
     di lingkungan audit. **Resolved 18 Juli 2026 — lihat update audit
     final di atas** (11/11 lulus, infra ter-commit permanen).
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
     skema, bukan uji backup/restore data pengguna. **Resolved 18 Juli
     2026 — lihat update audit final di atas** (drill penuh dengan
     `pg_dump`/`pg_restore`/`psql` nyata, row count identik, smoke test
     database hasil restore PASS).
- **Evidence / lokasi kode:**
  `pocket-mint-be/test/prismaAdapter.integration.test.ts`;
  `pocket-mint-fe/src/lib/changelog.ts`, `pocket-mint-fe/src/types/changelog.ts`,
  `pocket-mint-fe/app/changelog/page.tsx`, `pocket-mint-fe/app/page.tsx`,
  `pocket-mint-fe/tests/changelog.test.ts` (sub-item 2, FE);
  `pocket-mint-be/docs/prisma-migration-reconciliation.md` §6 (sub-item 3,
  historis); `mvp-stable-rc-validation.md` §17.3, §17.7 (sub-item 1 dan 3,
  bukti resolved).
- **User impact:** Ketiga sub-item tidak lagi menghambat Release Readiness
  atau kriteria Reliability — integration test permanen ter-CI, changelog
  terstruktur tersedia, dan disaster recovery data finansial pengguna sudah
  terbukti lewat drill nyata dari repository.
- **Acceptance criteria:** ✅ 4→11 test integrasi Prisma dijalankan dengan
  `TEST_DATABASE_URL` dan hasilnya didokumentasikan (permanen di CI); ✅
  changelog terstruktur ditambahkan dan dipelihara per rilis di
  `pocket-mint-fe` (backend tetap tidak punya struktur setara — minor, tidak
  blocking, backend tidak memiliki changelog konsumen publik); ✅ uji
  backup/restore data produksi (bukan hanya skema) dilakukan dan hasilnya
  didokumentasikan dengan tanggal.
- **Required regression tests:** `npm run test:integration` (CI-wired) —
  11/11 lulus; `tests/changelog.test.ts` untuk sub-item 2 (FE); `npm run
  db:backup` / `db:restore` / `db:verify` untuk sub-item 3, didokumentasikan
  di `backup-restore-runbook.md` §7.

## PM-STAB-011 — [Medium] `createWallet` response serializes Decimal fields as string, inconsistent with GET/PUT

- **Status:** Resolved (20 Juli 2026, Phase 13B). `createWallet` dan
  `updateWallet` di `account.controller.ts` sudah memanggil `serializeWallet`
  yang sama dengan `getAllWallets` — satu jalur serialisasi kanonik untuk
  ketiganya (commit `335515e`, "fix: serialize wallet response consistently
  on create/update (PM-STAB-011)"). Dikonfirmasi lewat pembacaan kode
  langsung pada `pocket-mint-be/src/controllers/account.controller.ts` di
  base branch Phase 13B (`feature/phase-13b-wallet-stability`, dari
  `origin/dev` commit `c0e0b0e`) — field `Decimal` (`balance`, `creditLimit`,
  `initialBalance`, `interestRate`, `adminFee`) semuanya `parseFloat` ke
  `number` di ketiga operasi.
- **Evidence:** `pocket-mint-be/test/walletControllerBoundary.test.ts`
  (`describe("wallet mutation controllers — Decimal→number serialization
  contract (matches GET/list)")`, 4 test) dan
  `pocket-mint-be/test/walletUpdate.test.ts` sudah menegaskan
  `typeof res.body.data.balance === "number"` untuk create dan update,
  termasuk nilai fraksional dan nilai besar tanpa hilang presisi.
- **Status sebelumnya (arsip, sudah tidak berlaku):**
- **Affected area:** Backend — `pocket-mint-be/src/controllers/account.controller.ts`
  (`createWallet`, sekitar baris 197–200).
- **Expected behavior:** Field `Decimal` (`balance`, `creditLimit`, dst.)
  diserialisasi dengan tipe JSON yang konsisten di seluruh endpoint wallet.
- **Actual behavior:** Respons `createWallet` (`POST /v1/wallets`)
  menyerialisasi field `Decimal` sebagai **string** (mis. `"1000000"`),
  sedangkan `GET /v1/wallets` dan `PUT /v1/wallets/:id` menjalankan field
  yang sama lewat `serializeWallet` sehingga menjadi **number**. Nilai tetap
  eksak di kedua kasus — ini bukan bug financial-integrity — tapi
  perbedaan tipe data antar-endpoint dapat menjebak client frontend yang
  strict-typed.
- **Evidence / lokasi kode:** `account.controller.ts` (`createWallet` vs
  `serializeWallet`); ditemukan dan didokumentasikan di
  `mvp-stable-rc-validation.md` §17.9.
- **User impact:** Tidak ada dampak finansial nyata (nilai eksak, hanya
  representasi tipe berbeda). Berpotensi menyebabkan bug integrasi di sisi
  client bila kode frontend mengasumsikan tipe `number` secara konsisten
  dari respons `POST /v1/wallets`.
- **Severity rationale:** Diklasifikasikan **Medium** (bukan Low) karena ini
  adalah inkonsistensi kontrak API yang nyata dan dapat memicu bug runtime
  di client strict-typed — bukan sekadar kosmetik/dokumentasi. **Bukan
  blocker promosi** ke MVP Stable kecuali ditemukan dampak finansial nyata
  di masa depan.
- **Acceptance criteria:** `createWallet` menggunakan `serializeWallet` yang
  sama dengan `GET`/`PUT` sehingga tipe field `Decimal` konsisten `number`
  di seluruh endpoint wallet.
- **Required regression tests:** Tambahkan assertion tipe (`typeof balance
  === "number"`) pada test controller `POST /v1/wallets` yang menegaskan
  konsistensi dengan `GET`/`PUT`.

---

## Known issue lain (di luar blocker MVP Stable PM-STAB-001–010)

## KI-EXPORT — [Medium] Tombol "Ekspor laporan" di halaman Analitik tidak berfungsi

- **Status:** Resolved (20 Juli 2026).
- **Lokasi:** `pocket-mint-fe/app/(app)/analytics/page.tsx` (tombol dengan
  ikon `Download`, sekitar baris 261–281).
- **Perbaikan:** tombol kini memanggil `exportTransactionsCsv(period,
  getJakartaMonthKey(new Date()))` dari
  `src/features/transactions/hooks/useTransactions.ts`, dengan `isExporting`
  disabled-state dan `toast(..., "error")` saat gagal. Diuji di
  `tests/analytics-export.test.ts`.
- **Catatan historis:** Item ini sudah ada sebelum audit stabilitas MVP 18
  Juli 2026 dan tidak termasuk dalam 10 blocker PM-STAB yang diminta audit
  tersebut (`mvp-stability-audit.md` menyebutnya sebagai item kosmetik yang
  levelnya lebih rendah dibanding temuan Analytics period — lihat
  PM-STAB-002). Dipertahankan di sini dengan ID lama agar tidak hilang dari
  catatan.

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
