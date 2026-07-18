# Pocket Mint — MVP Stable Release Candidate Validation (PM-STAB-010D)

Audit tanggal: **18 Juli 2026**. Ini adalah audit akhir untuk menentukan
apakah Pocket Mint siap menjadi **MVP Stable**. Sesuai instruksi task, status
**tidak** langsung diubah menjadi MVP Stable dalam dokumen ini — dokumen ini
hanya memvalidasi dan merekomendasikan.

Release candidate yang divalidasi: **`v0.3.0-rc.1`** (label evidensi untuk HEAD
kedua repo pada tanggal audit — lihat §9 untuk apa yang termasuk dan catatan
tentang versi/tag yang belum benar-benar dibuat).

> **⚠️ Lihat §17 untuk audit final independen (sesi terpisah, tanggal sama)
> yang menjalankan ulang seluruh verifikasi di atas dari nol, mengonfirmasi
> blocker #1 (infra belum di-commit) sudah selesai, dan menetapkan keputusan
> akhir serta rekomendasi versi `v0.3.0-rc.2`. §1–§16 di bawah adalah hasil
> sesi validasi pertama dan dipertahankan sebagai evidence historis — §17
> adalah sumber kebenaran saat ini.**

Referensi silang: `known-issues.md` (PM-STAB-001–010), `release-status.md`,
`stable-criteria.md`, `mvp-stability-audit.md`,
`pocket-mint-be/docs/deployment-runbook.md`,
`pocket-mint-be/docs/prisma-migration-reconciliation.md`,
`pocket-mint-be/docs/backup-restore-runbook.md`.

---

## 1. Ringkasan eksekutif

**Keputusan akhir: Ready for another RC.** Bukan Not Ready (mayoritas
temuan Critical/High core-flow dari audit sebelumnya sudah diperbaiki dan
diverifikasi ulang dengan bukti langsung hari ini), dan bukan Ready to
promote (dua kriteria wajib eksplisit gagal: **credential rotation High masih
terbuka**, dan **tidak ada production smoke test sungguhan** karena tidak ada
deployment staging/production yang benar-benar berjalan. Lihat §7 dan §8).

Temuan baru paling penting dari audit ini (di luar 10 blocker existing):

- **[Blocker baru, mempengaruhi "Integration test aktif"]** Seluruh
  infrastruktur backup/restore, guard `TEST_DATABASE_URL`, runner integration
  test, dan wiring CI untuk Postgres service **ada di working tree tapi belum
  di-commit** ke git `pocket-mint-be`. Lihat §4 dan §6.

---

## 2. Full backend test

```
cd pocket-mint-be && npx vitest run
```

**Hasil:** `42 test files passed, 1 skipped (43)` / `381 tests passed, 11 skipped (392)`
tanpa `TEST_DATABASE_URL` (11 skip = seluruh isi `test/prismaAdapter.integration.test.ts`,
`describe.skipIf(!TEST_DATABASE_URL)`).

Dijalankan ulang dengan `TEST_DATABASE_URL` mengarah ke database disposable
baru (lihat §5): **392/392 lulus, 0 skip, 0 gagal.**

**Status: PASS.**

## 3. Full frontend test

```
cd pocket-mint-fe && npx vitest run
```

**Hasil:** `27 test files passed (27)` / `170 tests passed (170)`, 0 gagal, 0 skip.

**Status: PASS.**

## 4. Typecheck

```
npx tsc --noEmit
```

- Backend: bersih, tanpa error.
- Frontend: bersih, tanpa error.

**Status: PASS.**

## 5. Lint

- Backend: tidak ada script/config lint (tidak ada ESLint config di repo) —
  tidak dijalankan, tidak ada regresi yang bisa dideteksi lint di sisi ini.
- Frontend: `npm run lint` (`eslint .`) → bersih, tanpa error/warning.

**Status: PASS** (frontend). Backend **N/A** (tidak ada lint yang dikonfigurasi
— bukan kegagalan, tapi dicatat sebagai gap tooling).

## 6. Production build

```
# Backend
npx prisma generate && tsc && node src/scripts/copy-prisma-client.cjs
# Frontend
next build
```

- Backend: build sukses. `dist/generated/prisma/client.js` ada dan
  `require('./dist/generated/prisma/client')` berhasil (verifikasi packaging
  sesuai `agent-rules.skill.md`). `npx prisma validate` → schema valid.
- Frontend: `next build` (Turbopack) sukses, seluruh 14 route (10 halaman +
  proxy middleware) ter-generate tanpa error TypeScript.

**Status: PASS.**

⚠️ **Catatan git state ditemukan selama build (bukan hasil audit ini, kondisi
working tree saat ini):**
- `pocket-mint-be`: `git status` menunjukkan **~29 path berubah/untracked**
  yang **belum di-commit**, termasuk `package.json` (script `test:integration`,
  `db:backup`, `db:restore`, `db:verify`, dependency `embedded-postgres`),
  seluruh isi `scripts/` (`db-backup.mjs`, `db-restore.mjs`, `db-verify.mjs`,
  `run-integration-tests.mjs`), `src/lib/assertTestDatabaseUrl.ts`,
  `test/assertTestDatabaseUrl.test.ts`, `docs/backup-restore-runbook.md`,
  `docs/database-testing.md`, dan perubahan `.github/workflows/ci.yml` yang
  menambahkan Postgres service + `TEST_DATABASE_URL` untuk CI.
- `pocket-mint-fe`: 5 file dokumentasi rilis (`README.md`, `known-issues.md`,
  `release-checklist.md`, `release-status.md`,
  `templates/release-template.md`) memiliki perubahan lokal belum di-commit.
- **Dampak:** seluruh evidence backup/restore dan integration-test runner di
  §4 dan §7 **valid secara fungsional** (sudah diverifikasi berjalan pada
  sesi ini dan pada drill 18 Juli sebelumnya), tapi **tidak reproducible dari
  clone/CI bersih** selama belum di-commit. CI yang ter-commit saat ini hanya
  menjalankan `npx vitest run` tanpa Postgres service — integration suite
  ter-skip di CI walau lulus secara lokal. Ini **memblokir prasyarat
  "Integration test aktif"** sampai perubahan ini benar-benar masuk git
  history. Lihat §11 blocker #1.

## 7. Database provisioning dari kosong + migration deploy

```
EMBEDDED_PG_PORT=55491 node scripts/run-integration-tests.mjs
```

Menjalankan disposable PostgreSQL 18 (`embedded-postgres`), lalu
`prisma migrate deploy` dari database benar-benar kosong:

```
5 migrations found in prisma/migrations
Applying migration `20260710000000_baseline`
Applying migration `20260711172700_remove_local_user_password`
Applying migration `20260711223000_add_transaction_to_wallet`
Applying migration `20260717000000_generalize_wallets_and_bills`
Applying migration `20260718000000_drop_unused_transfer_model`
All migrations have been successfully applied.
```

Diikuti test suite integrasi Prisma penuh terhadap database ini:
`Test Files 1 passed (1)` / `Tests 11 passed (11)`.

Catatan: migration ke-5 (`20260718000000_drop_unused_transfer_model`)
mengonfirmasi model `Transfer` yang mati (PM-STAB-009) **sudah dihapus** dari
schema via migration nyata, bukan hanya diedit di `schema.prisma`.

**Status: PASS** untuk database baru/kosong. Provisioning staging/production
nyata (`migrate resolve --applied` + `migrate deploy` terhadap database
bersama) **masih belum dieksekusi** — tetap manual per
`prisma-migration-reconciliation.md` §11 dan `deployment-runbook.md` §5, dan
di luar cakupan yang aman untuk dijalankan tanpa akses/approval eksplisit ke
database bersama. **Tidak ada seed minimal terpisah yang dibutuhkan** — Prisma
migration sudah membentuk schema lengkap; tidak ada data seed wajib untuk
smoke test (kategori transaksi diverifikasi ter-provision otomatis, lihat §8).

## 8. Manual smoke test core flows (fresh DB) + Cross-user isolation

Dijalankan end-to-end secara live terhadap server yang di-boot melawan
database disposable di atas (server: `ts-node --transpile-only src/server.ts`,
JWT HS256 lokal test-only, dua user berbeda A dan B). Ringkasan hasil nyata
(bukan simulasi):

| Langkah | Hasil |
| --- | --- |
| `POST /v1/users/sync` (user A, user B) | `201` masing-masing, dua user independen berhasil dibuat |
| `POST /v1/wallets` (Dompet A — CASH, Dompet B — CASH) | `201` masing-masing, `userId` benar sesuai token |
| `GET /v1/categories` | `200`, kategori default ter-provision (Bonus, Belanja, Hiburan, Kesehatan, Lainnya, Makanan, Tagihan, Transportasi) |
| `POST /v1/transactions` INCOME (kategori sesuai) pada Dompet A | `201`, saldo bertambah |
| `POST /v1/transactions` EXPENSE dengan kategori bertipe salah | `400 BAD_REQUEST` "Tipe kategori tidak sesuai dengan tipe transaksi" — validasi type-matching kategori bekerja |
| `POST /v1/wallets` Kartu Kredit A (CREDIT_CARD, creditLimit 5.000.000) | `201` |
| `POST /v1/transactions` INCOME ke wallet CREDIT_CARD (PM-STAB-007) | `400 BAD_REQUEST` "Pemasukan tidak bisa dicatat ke wallet utang (kartu kredit, paylater, atau pinjaman)" — **guard bekerja end-to-end via HTTP nyata** |
| `GET /v1/dashboard/summary` (user A) | `200 {"total_aset":1250000,"total_utang":0,"net_worth":1250000}` — **PD-001 benar** (1.000.000 awal + 250.000 income) |
| `GET /v1/wallets` (user B) | `200`, **hanya** mengembalikan Dompet B — tidak ada data user A bocor |
| `PUT /v1/wallets/{walletA_id}` (token user B) | `404 NOT_FOUND` "Wallet with id ... not found" — user B tidak bisa mengubah wallet user A |
| `DELETE /v1/wallets/{walletA_id}` (token user B) | `404 NOT_FOUND` — user B tidak bisa menghapus wallet user A |
| `GET /v1/dashboard/summary` (user B) | `200 {"total_aset":500000,...}` — angka user B murni, tidak tercampur dengan user A |
| `GET /v1/wallets` tanpa token | `401 UNAUTHORIZED` |

**Status: PASS.** Core flow (identity bootstrap, wallet, transaksi
income/expense, kategori, kartu kredit, dashboard PD-001) dan cross-user
isolation (read, update, delete, dashboard) seluruhnya benar terhadap
database yang benar-benar baru — bukan hanya lulus unit test terisolasi.

## 9. Cross-user isolation

Termasuk dalam tabel §8 di atas (baris `GET/PUT/DELETE` dengan token user B
terhadap resource user A). Seluruhnya lulus: tidak ada baca, ubah, atau hapus
lintas user yang berhasil; user B tidak pernah melihat data finansial user A.
Ini konsisten dengan hasil audit sebelumnya (`mvp-stability-audit.md` bagian
11, delapan test boundary/ownership) — sekarang diverifikasi ulang lewat
permintaan HTTP nyata, bukan hanya lewat test unit.

**Status: PASS.**

## 10. Backup dan restore

**Client tools (`pg_dump`/`pg_restore`/`psql`) tidak tersedia di lingkungan
audit ini** (tidak ter-install, dan `embedded-postgres` sengaja tidak
menyertakan binary client — lihat `backup-restore-runbook.md` §2). Drill baru
tidak dijalankan ulang pada sesi ini karena keterbatasan lingkungan tersebut.

Bukti yang dipakai untuk validasi ini adalah drill yang **sudah didokumentasikan
dan bertanggal 18 Juli 2026 (hari yang sama)** di
`pocket-mint-be/docs/backup-restore-runbook.md` §7, dijalankan terhadap
PostgreSQL 18 disposable (bukan Supabase, bukan database bersama):

- Backup (`pg_dump --format=custom`): sukses, 0.1s, ~20 KB.
- Guard restore diuji (semua ditolak sesuai desain): tanpa `RESTORE_TARGET_URL`,
  host `*.supabase.co`, nama database `postgres`, tanpa `CONFIRM_RESTORE=yes`,
  restore ke database yang sudah berisi tabel tanpa `--force`.
- Restore ke database kosong baru: sukses, 0.4s.
- Verifikasi (`db-verify.mjs`): row count restored == source persis (users: 2,
  wallets: 3, transactions: 3, installments: 1, categories: 3), 0 orphan FK, 9
  FK constraint hadir.
- Smoke test aplikasi terhadap database hasil restore: build + start server
  → `GET /health` 200; `GET /v1/dashboard/summary` dan `GET /v1/wallets`
  dengan JWT nyata → 200, nilai sesuai data yang direstore.

**Status: PASS secara fungsional (evidence tervalidasi dan konsisten),
tapi dengan syarat penting:** skrip yang menjalankan drill ini
(`scripts/db-backup.mjs`, `db-restore.mjs`, `db-verify.mjs`) **belum
di-commit ke git** (lihat §6). Backup/restore terbukti bekerja, tapi belum
"terkunci" sebagai bagian permanen dari repository — lihat blocker #1 di §11.

## 11. Deployment staging atau production candidate

Tidak ditemukan deployment staging/production yang benar-benar berjalan:
tidak ada URL Railway/Vercel/hosting lain yang ter-referensi di repo maupun
env, dan `deployment-runbook.md` §5–§8 secara eksplisit menandai migration
staging/production sebagai **manual, belum dieksekusi** (butuh akses
database bersama + jendela backup + approval eksplisit — di luar cakupan
yang aman untuk task audit ini).

Yang **bisa** dan **sudah** diverifikasi sebagai kandidat:
- Production build lokal (backend `dist/`, frontend `next build`) — PASS
  (§6).
- Server production build backend, dijalankan langsung dari `dist/server.js`
  (bukan `ts-node`), start bersih dan `/health` 200 (dibuktikan ulang lewat
  drill backup/restore §10, bagian smoke-test aplikasi).

**Status: TIDAK ADA production/staging environment nyata untuk diuji.**
Ini secara eksplisit memblokir kriteria "production smoke test Pass" yang
disyaratkan untuk status Ready to promote — build lokal bukan pengganti sah
untuk smoke test production sungguhan.

## 12. Responsive test desktop dan mobile

Dijalankan ulang **hari ini** (bukan memakai screenshot lama 17 Juli, yang
mendahului fix Net Worth) memakai `scripts/capture-authenticated-pages.mjs`
(desktop, 1440×900) dan skrip tambahan sesi ini untuk viewport mobile
(390×844), login sungguhan dengan akun `e2e@pocketmint.test` terhadap
dev server yang sudah berjalan (`localhost:4000` FE, `localhost:5001` BE).

- **Desktop:** Dashboard, Dompet, Transaksi, Cicilan, Analitik — seluruhnya
  ter-capture ulang. Dashboard menunjukkan **Rp 28.664.000** sebagai "Posisi
  keuangan bersih" = Rp 60.950.000 (aset) − Rp 32.286.000 (utang) — **PD-001
  benar secara visual di UI produksi**, bukan hanya di response API
  (mengonfirmasi PM-STAB-001 selesai secara end-to-end).
- **Mobile (390×844):** kelima halaman ter-capture, bottom navigation
  tampil dengan 5 ikon, tidak ada horizontal overflow terlihat, Net Worth di
  Hero Card konsisten dengan desktop, filter "6 bulan" pada Analitik
  menampilkan data cash flow yang terisi (bukan kosong seperti sebelum
  PM-STAB-002 diperbaiki).
- Tombol "Ekspor laporan" di halaman Analitik **masih tanpa handler**
  (`KI-EXPORT`, Medium, sudah tercatat sebelumnya, tidak baru).
- Label navigasi 5-item menampilkan **Analitik**, bukan **Akun** yang
  diwajibkan `skills/design.md`/`skills/ui-system.skill.md` — deviasi ini
  sudah tercatat di `src/lib/changelog.ts` `knownIssues` (item terkait
  "Label navigasi Analitik") sehingga bukan temuan baru, tapi dikonfirmasi
  masih ada di build hari ini.

**Status: PASS** untuk fungsi dan tidak ada regresi visual/overflow;
deviasi label nav dan tombol ekspor tetap Medium/Low tercatat, tidak
blocking.

## 13. Review known issues lengkap (PM-STAB-001 s.d. 010) + prasyarat lain

| ID | Severity | Status hasil audit ini | Bukti |
| --- | --- | --- | --- |
| PM-STAB-001 | Critical | **Resolved** (kode + screenshot + live API hari ini) | §12, §8 (`dashboardA` net_worth benar) |
| PM-STAB-002 | High | **Resolved** (kode `period.ts`, `/transactions/all`, screenshot Analitik "6 bulan" terisi) | §12 |
| PM-STAB-003 | High | **Masih Open** — rotasi kredensial & purge history masih "PENDING EXPLICIT APPROVAL (do not execute)" per `deployment-runbook.md` §10–11, tidak ada dokumen lebih baru yang mengonfirmasi selesai | tidak berubah sejak audit sebelumnya |
| PM-STAB-004 | High | **Resolved untuk database baru/kosong** (§7); **masih Open untuk staging/production** karena belum ada environment staging/production nyata sama sekali untuk dijalankan | §7, §11 |
| PM-STAB-005 | High | **Resolved** — `profile/page.tsx` memanggil `signInWithPassword` + `updateUser` sungguhan, 19 test kontrak, bagian dari 170 test FE yang lulus | kode + test suite §3 |
| PM-STAB-006 | Medium | **Resolved secara kode dan test** (bagian dari 392 test BE yang lulus, termasuk kasus PM-STAB-006 di `installmentPaymentService.test.ts`) | §2 |
| PM-STAB-007 | Medium | **Resolved** — dikonfirmasi lewat unit test **dan** smoke test HTTP langsung (§8: `txIncomeToDebtRejected` → 400) | §2, §8 |
| PM-STAB-008 | Medium | **Resolved dengan 1 sisa cacat kecil**: `pocket-mint-fe/skills/financial-logic.skill.md` dan `.claude/skills/financial-logic.skill.md` masih menulis `PAYLOAD` (typo) alih-alih `PAYLATER` pada baris daftar tipe wallet DEBT (baris ~18), padahal dua baris di bawahnya di file yang sama sudah benar menulis `PAYLATER` — kontradiksi internal kecil dalam satu file. Backend punya versi yang benar. | ditemukan sesi ini, lihat §11 blocker #2 |
| PM-STAB-009 | Low | **Sebagian resolved** — model Prisma `Transfer` **sudah dihapus** via migration `20260718000000_drop_unused_transfer_model` (dikonfirmasi §7); label nav "Cicilan" sudah benar. Sisa deviasi: nav 5-item menampilkan "Analitik", bukan "Akun" yang diwajibkan kontrak desain — sudah tercatat di `changelog.ts`, dikonfirmasi masih ada (§12). | §7, §12 |
| PM-STAB-010 | Low | Sub-item 1 (integration test skip) **resolved secara fungsional** (392/392 lulus dengan `TEST_DATABASE_URL`, §2/§7) **tapi belum aktif secara permanen** karena runner + CI wiring belum di-commit (§6 blocker #1). Sub-item 2 (changelog FE) **resolved**, changelog BE tetap belum ada (minor, tidak blocking). Sub-item 3 (backup/restore) **resolved secara evidence** (§10) dengan syarat commit yang sama. | §2, §6, §10 |

**Prasyarat tambahan dari task ini:**

- ✅ Password flow nyata tersedia (PM-STAB-005 resolved, bukan dihapus dari UI — direplace dengan flow nyata).
- ⚠️ Financial documentation sinkron — **hampir**: benar secara substansi
  (formula, aturan, guard semuanya cocok dengan kode), tapi ada 1 typo
  `PAYLOAD`/`PAYLATER` yang belum diperbaiki di 2 salinan file FE (lihat
  PM-STAB-008 di atas).
- ✅ Integration test **ada dan lulus** secara fungsional, tapi ⚠️ **belum
  "aktif" dalam artian permanen/CI** karena kodenya belum di-commit — lihat
  blocker #1.
- ✅ Backup dan restore **sudah diuji** (evidence tervalidasi, §10), dengan
  syarat commit yang sama.
- ✅ Changelog tersedia (`pocket-mint-fe/src/lib/changelog.ts`, versi `0.1.0`
  MVP Beta); **belum ada entri untuk RC ini** — lihat §14.

---

## 14. Matriks Pass/Fail ringkas

| Item | Hasil |
| --- | --- |
| Full backend test | ✅ PASS (392/392 dengan DB, 381/381 tanpa DB) |
| Full frontend test | ✅ PASS (170/170) |
| Typecheck (BE+FE) | ✅ PASS |
| Lint (FE) | ✅ PASS |
| Lint (BE) | ➖ N/A (tidak dikonfigurasi) |
| Production build (BE+FE) | ✅ PASS |
| Provisioning database kosong + migration deploy | ✅ PASS |
| Seed minimal | ➖ Tidak dibutuhkan (tidak ada seed wajib di luar migration) |
| Manual smoke test core flow | ✅ PASS |
| Cross-user isolation | ✅ PASS |
| Backup | ✅ PASS (evidence 18 Juli 2026, kode belum di-commit) |
| Restore ke database baru | ✅ PASS (evidence 18 Juli 2026, kode belum di-commit) |
| Smoke test database hasil restore | ✅ PASS (evidence 18 Juli 2026) |
| Deployment staging/production nyata | ❌ TIDAK ADA — hanya production build lokal |
| Responsive desktop | ✅ PASS |
| Responsive mobile | ✅ PASS |
| Critical open | ✅ 0 |
| High core-flow open | ✅ 0 (PM-STAB-001/002/005 resolved) |
| High non-core-flow open | ❌ 2 (PM-STAB-003 kredensial, PM-STAB-004 staging/production) |
| Known issues tersisa hanya Medium/Low | ❌ Tidak — 2 High masih terbuka (di atas) |

---

## 15. Blocker tersisa (menuju Ready to promote)

1. **[Blocker, prioritas tertinggi]** Commit seluruh infrastruktur backup/restore,
   integration-test runner, guard `TEST_DATABASE_URL`, dan wiring CI Postgres
   di `pocket-mint-be` (§6) ke git. Tanpa ini, "Integration test aktif" dan
   "Backup dan restore telah diuji" tidak bertahan lebih lama dari sesi lokal
   ini — CI dan kontributor lain tidak akan melihatnya.
2. **[Blocker, High, PM-STAB-003]** Eksekusi rotasi kredensial database
   Supabase dan API key lama, lalu putuskan/eksekusi rencana purge git
   history (`deployment-runbook.md` §10–11) — perlu persetujuan eksplisit
   dan akses di luar repo (Supabase dashboard).
3. **[Blocker, High, PM-STAB-004 sisa]** Jalankan `migrate resolve --applied`
   + `migrate deploy` terhadap database staging/production nyata begitu
   environment tersebut ada — atau, jika belum ada environment staging/
   production sama sekali, buat environment tersebut lebih dulu (di luar
   cakupan audit ini, butuh keputusan/infra terpisah).
4. **[Blocker untuk "production smoke test Pass"]** Deploy ke staging atau
   production sungguhan dan jalankan smoke-test matrix
   (`deployment-runbook.md` §9) terhadap deployment nyata tersebut. Build
   lokal yang sudah PASS (§6) tidak dapat menggantikan ini.
5. **[Minor, tidak blocking promosi tapi harus diperbaiki sebelum RC berikut]**
   Perbaiki typo `PAYLOAD` → `PAYLATER` di
   `pocket-mint-fe/skills/financial-logic.skill.md` dan
   `pocket-mint-fe/.claude/skills/financial-logic.skill.md` (baris ~18).
6. **[Kosmetik, Low, sudah tercatat]** Selaraskan label navigasi 5-item
   dengan kontrak desain (`Akun` vs `Analitik` saat ini) atau perbarui
   `skills/design.md`/`skills/ui-system.skill.md` jika keputusan produk
   memang menambah item ke-6/menukar item — perlu keputusan produk eksplisit,
   bukan sekadar perbaikan kode.
7. **[Kosmetik, Low, sudah tercatat]** Tombol "Ekspor laporan" di Analitik
   (`KI-EXPORT`) masih tanpa fungsi.

## 16. Rekomendasi keputusan

### Ready for another RC

Alasan:
- Seluruh Critical dan seluruh High **core-flow** (net worth, analytics
  period, password) tertutup dengan bukti kode, test otomatis, **dan**
  verifikasi end-to-end langsung (HTTP nyata + screenshot) pada sesi audit
  ini — bukan hanya klaim dokumen lama.
- Financial integrity, migration database baru, cross-user isolation, build,
  dan backup/restore (secara evidence) seluruhnya **PASS** dengan bukti
  konkret dan dapat ditelusuri.
- Namun **dua kriteria wajib untuk Ready to promote gagal secara eksplisit**:
  tidak ada production smoke test sungguhan (tidak ada deployment nyata untuk
  diuji), dan masih ada 2 known issue **High** yang terbuka (kredensial,
  migration staging/production) — bukan hanya Medium/Low seperti disyaratkan.
- Temuan baru (infrastruktur backup/restore & integration test belum
  di-commit) berarti sebagian bukti yang sudah valid secara fungsional belum
  "terkunci" ke dalam repository — risiko regresi diam-diam jika working
  tree ini hilang.

**Rekomendasi konkret sebelum RC berikutnya:** selesaikan 4 blocker di §15
(commit infra, rotasi kredensial, migration staging/production, deployment +
smoke test production nyata), lalu jalankan ulang validasi ini. Setelah itu,
"Ready to promote to MVP Stable" menjadi realistis tanpa syarat tambahan yang
berat.

**v0.3.0-rc.1 tidak di-tag/commit dalam task ini** (task eksplisit meminta
tidak membuat rilis final, dan `pocket-mint-be` memiliki working tree yang
belum bersih — lihat §6). Nomor versi ini adalah label evidensi untuk hasil
validasi di dokumen ini; keputusan untuk benar-benar melakukan version bump +
git tag diserahkan ke pemilik repo setelah blocker #1 (commit) diselesaikan.

---

## 17. Audit final independen (sesi terpisah, 18 Juli 2026) — sumber kebenaran saat ini

Ini adalah audit final terpisah yang menjalankan ulang **seluruh** verifikasi
di §1–§16 dari nol (bukan mempercayai hasil sesi sebelumnya begitu saja),
memverifikasi klaim kode secara langsung (baca file, bukan hanya baca
dokumen lain), dan memutuskan status akhir sesuai kriteria di
`stable-criteria.md`/instruksi task. Tidak ada fitur baru ditambahkan; hanya
verifikasi, plus dua perbaikan dokumentasi trivial (lihat §17.9).

### 17.1 Yang berubah sejak §1–§16 (rc.1)

- **Blocker #1 (§15 poin 1) — RESOLVED.** Seluruh infrastruktur backup/restore,
  integration-test runner, guard `TEST_DATABASE_URL`, dan wiring CI Postgres
  di `pocket-mint-be` **sudah ter-commit**: `git log --oneline -3 -- scripts/
  .github/workflows/ci.yml` menunjukkan commit `0c6c370 ci: wire disposable
  Postgres service for Prisma integration tests` sebagai commit teratas.
  `pocket-mint-be` working tree **bersih** (`git status` clean) di awal dan
  akhir audit ini — bukan lagi ~29 path uncommitted seperti temuan rc.1 §6.
- **Blocker #2 (§15 poin 5, typo `PAYLOAD`/`PAYLATER`) — RESOLVED sesi ini.**
  Diperbaiki di `pocket-mint-fe/skills/financial-logic.skill.md:18` dan
  `pocket-mint-fe/.claude/skills/financial-logic.skill.md:18` (`PAYLOAD` →
  `PAYLATER`), konsisten dengan baris lain di file yang sama dan dengan
  backend. Perubahan dokumentasi murni, tidak menyentuh kode aplikasi.
- **Blocker kredensial (PM-STAB-003, §15 poin 2) — TETAP OPEN, tidak berubah.**
  `docs/deployment-runbook.md` §10 (baris 316) masih menandai password
  database Supabase "Rotation required ... still in history"; §11 (baris 326)
  masih "PENDING EXPLICIT APPROVAL (do not execute)". Ini butuh akses
  Supabase dashboard nyata dan persetujuan eksplisit di luar cakupan audit
  berbasis-repo — tidak dieksekusi di sesi ini, sesuai batas kewenangan yang
  sama seperti rc.1.
- **Blocker staging/production (PM-STAB-004 sisa, §15 poin 3–4) — TETAP OPEN,
  tidak berubah.** Tidak ada environment staging/production nyata untuk
  di-deploy atau diuji; tetap di luar cakupan audit ini.

### 17.2 Full backend test — re-run independen

```
cd pocket-mint-be && npm run test
```

`42 test files passed, 1 skipped (43)` / `382 tests passed, 11 skipped (393)`
tanpa `TEST_DATABASE_URL` (naik 1 test dari hasil rc.1 yang mencatat 381 —
bukan regresi, hanya cakupan test yang bertambah sejak rc.1).

**Status: PASS.**

### 17.3 Integration test Prisma — re-run independen via `npm run test:integration`

`node scripts/run-integration-tests.mjs` (kini ter-commit, lihat §17.1) dengan
`EMBEDDED_PG_PORT=55433` (port default 55432 terpakai socket basi tak terkait
aplikasi di mesin ini). 5 migrasi diterapkan ke database kosong
(`20260710000000_baseline` s.d. `20260718000000_drop_unused_transfer_model`),
diikuti `All migrations have been successfully applied.`, lalu
`Test Files 1 passed (1)` / `Tests 11 passed (11)`.

**Status: PASS.**

### 17.4 Typecheck, lint, production build — re-run independen

- Backend: `npx tsc --noEmit` bersih. `npm run build` sukses;
  `dist/generated/prisma/client.js` ada dan `require(...)` berhasil. Tidak ada
  lint script/config di backend — tetap N/A, tidak ditambahkan (di luar
  cakupan audit ini).
- Frontend: `npx vitest run` → `27 test files passed (27)` / `170 tests
  passed (170)`. `npx tsc --noEmit` bersih. `npm run lint` bersih. `next
  build` sukses, 14 route ter-generate (cocok dengan hitungan rc.1).

**Status: PASS (semua).**

### 17.5 Provisioning database kosong + `migrate deploy` + `migrate status`

Database embedded-postgres baru (port 55440) di-provision dari kosong,
`prisma migrate deploy` menerapkan seluruh 5 migrasi, lalu `prisma migrate
status` dijalankan terhadap database yang sama dan mengonfirmasi:
**"Database schema is up to date!"**.

*(Catatan lingkungan, bukan defect: `npx prisma migrate deploy` melalui
wrapper shell lokal sesi ini kadang mencetak banner `[FAIL]` palsu meski
migrasi benar-benar sukses — dikonfirmasi salah lewat `migrate status`
berikutnya dan lewat pemanggilan langsung `node
node_modules/prisma/build/index.js migrate deploy`. Ini noise proxy/hook
shell lokal, bukan kegagalan Prisma atau aplikasi.)*

**Status: PASS.**

### 17.6 Manual smoke test, cross-user isolation, dan financial integrity — re-run independen (37/37 check)

Server backend (`ts-node --transpile-only src/server.ts`) di-boot melawan
database disposable baru (port 55440), JWT HS256 lokal test-only, dua user
berbeda A dan B. Seluruh 37 pemeriksaan berikut **lulus**:

**Core flow:**
- Sync dua user independen (201, lalu re-sync idempotent 200).
- Wallet CRUD: dompet aset `CASH`, dompet utang `CREDIT_CARD` (`creditLimit`
  5.000.000), update, delete (dan delete-oleh-user-lain ditolak — lihat
  isolasi di bawah).
- INCOME 200.000 dan EXPENSE 50.000 pada dompet aset, keduanya `201` dengan
  nilai integer eksak.
- Pembuatan cicilan: EXPENSE 300.000 / 3 termin pada dompet `CREDIT_CARD`.
- Pembayaran cicilan sampai termin terakhir (3/3).
- Pembayaran utang via TRANSFER dari dompet aset ke dompet utang.
- Dashboard summary.

**Financial integrity (kriteria wajib task ini):**
- **Net Worth = total aset − total utang**: diverifikasi eksak lewat
  `GET /v1/dashboard/summary` (`net_worth == total_aset - total_utang`,
  selisih dihitung eksplisit = 0).
- **Transfer tidak mengubah Net Worth**: transfer 100.000 antar dompet milik
  user yang sama — net worth **identik** sebelum dan sesudah transfer,
  dikonfirmasi lewat perbandingan langsung.
- **Pembayaran cicilan terakhir menghasilkan outstanding tepat nol**:
  outstanding dan balance dompet cicilan setelah termin 3/3 = **0 tepat**,
  bukan sisa pembulatan (PM-STAB-006 dikonfirmasi selesai).
- **Pembayaran debt tidak double deduction**: outstanding turun dari
  **75.000 → 45.000**, penurunan tepat **30.000** (sama dengan nilai
  transfer), diverifikasi sekali, tidak ada pengurangan ganda.
- **Transaksi gagal tidak meninggalkan partial write**: transaksi dengan
  nominal negatif dan transaksi tanpa nominal wajib keduanya ditolak `400`,
  saldo dompet **tidak berubah** setelah kedua percobaan gagal tersebut.
- **Tidak ada floating-point drift**: seluruh nilai uang pada respons wallet
  dan transaction diperiksa — tidak ditemukan nilai seperti
  `1499999.9999999998`; semua nilai integer/desimal eksak.
- **Kategori tipe-mismatch ditolak**: EXPENSE dengan kategori bertipe salah
  → `400`.
- **Guard INCOME ke DEBT wallet**: `400` (PM-STAB-007 dikonfirmasi bekerja
  lewat HTTP nyata).

**Cross-user isolation:**
- Daftar dompet user B tidak pernah berisi id dompet user A.
- `PUT`/`DELETE` dompet A dengan token user B → `404` keduanya; dompet A
  tidak berubah setelahnya.
- Dashboard user A dan user B murni terpisah, tidak tercampur.
- Request tanpa token ke route terproteksi → `401`.

**Status: PASS (37/37).** Sepenuhnya konsisten dengan §8/§9 rc.1, kini
dengan angka before/after eksplisit untuk setiap kriteria financial-integrity
yang diminta task ini (bukan hanya "PASS" generik).

### 17.7 Backup dan restore — re-run independen dengan client tools nyata

Berbeda dari sesi rc.1 (§10) yang **tidak** memiliki `pg_dump`/`pg_restore`/
`psql` di lingkungan audit, sesi ini menemukan binary tersebut di
`C:\Program Files\PostgreSQL\18\bin\` dan benar-benar menjalankan drill
penuh (bukan hanya mengutip drill lama):

- `npm run db:backup` terhadap database smoke test terisi (port 55440) →
  sukses, file `.dump` custom-format ~0.02 MiB, 0.2 detik.
- Database kosong baru ke-2 di-provision (port 55441).
- `npm run db:restore` (`CONFIRM_RESTORE=yes`, `RESTORE_TARGET_URL` diarahkan
  ke database kosong tersebut) → sukses, 0.3 detik.
- Guard restore diuji ulang secara eksplisit: tanpa `CONFIRM_RESTORE` →
  ditolak exit 1; host menyerupai Supabase (`db.abcdefgh.supabase.co`) →
  ditolak exit 1.
- `npm run db:verify` pada source **dan** target hasil restore — row count
  **identik persis**: `users: 8, wallets: 12, transactions: 21,
  installments: 3, categories: 96`; 0 baris FK orphan; 9 FK constraint hadir
  di kedua database; `VERIFY OK` pada keduanya.
- Backend di-start melawan database hasil restore (port 5502) —
  `GET /health` → `200 {"status":"ok"}`; `GET /v1/dashboard/summary` dengan
  JWT nyata untuk user hasil restore → data tersaji benar dari database yang
  dipulihkan.

**Status: PASS — evidence lebih kuat dari rc.1** karena dijalankan
end-to-end sungguhan sesi ini dengan client tools nyata, bukan mengandalkan
log drill tertulis sebelumnya.

### 17.8 Responsive desktop dan mobile — re-run independen

Dev server (`localhost:4000` FE, `localhost:5001` BE) dan Supabase project
nyata dikonfirmasi reachable. Login sungguhan dengan akun
`e2e@pocketmint.test`, capture ulang Dashboard, Dompet, Transaksi, Cicilan,
Analitik pada 1440×900 dan 390×844 lewat Playwright.

- Tidak ada horizontal overflow pada 5 halaman × 2 viewport (10 pemeriksaan).
- Dashboard (mobile, capture baru sesi ini): "Posisi keuangan bersih" =
  **Rp 28.664.000** = Rp 60.950.000 (aset) − Rp 32.286.000 (utang) — cocok
  persis dengan angka rc.1, dikonfirmasi ulang secara live.
- Analitik filter "6 bulan": Cash Flow **+Rp 23.944.000**, badge "Real data",
  Savings Rate 89%, Debt Ratio 92% — terisi, bukan kosong.
- Bottom nav mobile: **6 ikon** (Dashboard, Dompet, Transaksi, Cicilan,
  Analitik, + trigger dropdown akun terpisah) — deviasi dari kontrak desain
  5-item "Akun" tetap ada dan tetap tercatat sebagai PM-STAB-009/Low
  (`changelog.ts` `knownIssues`), bukan temuan baru.
- Tombol "Ekspor laporan" tetap tanpa handler (`KI-EXPORT`, Medium, sudah
  tercatat).

**Status: PASS**, tidak ada regresi visual/overflow.

### 17.9 Temuan baru sesi ini (di luar 10 blocker existing)

Perbaikan dokumentasi diterapkan langsung (trivial, tidak menyentuh kode
aplikasi):

- **[Diperbaiki]** Typo `PAYLOAD` → `PAYLATER` di dua salinan
  `financial-logic.skill.md` (lihat §17.1). Ini menutup sisa cacat kecil
  PM-STAB-008.

Temuan yang **dilaporkan tapi sengaja tidak diperbaiki** (di luar cakupan
audit — audit hanya memvalidasi, tidak menambah/mengubah fitur atau
memperbaiki bug produk):

- **[Dokumentasi tidak sinkron, Low]** `pocket-mint-fe/src/lib/changelog.ts`
  `knownIssues` (baris ~38–42) masih mendaftarkan "form ubah password belum
  memanggil API" sebagai issue terbuka, padahal PM-STAB-005 sudah **Resolved**
  (kode memanggil `supabase.auth.signInWithPassword` +
  `auth.updateUser` sungguhan — dikonfirmasi baca kode langsung,
  `app/(app)/profile/page.tsx:110,122`). Perlu diperbarui sebelum copy
  changelog RC berikutnya ditulis.
- **[Dokumentasi tidak sinkron, sudah ada sejak rc.1, dikonfirmasi lagi]**
  `docs/releases/known-issues.md` masih menandai PM-STAB-001, PM-STAB-002
  sebagai **Status: Open**, padahal kode dan smoke test langsung (§17.6,
  §17.8) mengonfirmasi keduanya **sudah resolved** secara fungsional
  (`app/(app)/dashboard/page.tsx:168-169` memanggil `useDashboardSummary` →
  `GET /v1/dashboard/summary`, bukan menghitung ulang lokal; `analytics/
  page.tsx` memakai `useAllTransactions` → `/transactions/all`). Dokumen ini
  ditulis dalam commit yang sama dengan `mvp-stable-rc-validation.md` (§1–§16)
  namun isinya tidak diperbarui untuk mencerminkan hasil validasi tersebut —
  **rekomendasi: pemilik repo memperbarui `known-issues.md` agar konsisten
  dengan §13 dokumen ini**, sebelum RC berikutnya dipotong, supaya kedua
  dokumen tidak lagi saling bertentangan.
- **[Bug minor, tidak memengaruhi financial integrity]**
  `src/controllers/account.controller.ts` — respons `createWallet` (POST
  `/v1/wallets`, sekitar baris 197–200) menyerialisasi field `Decimal`
  (`balance`, `creditLimit`, dst.) sebagai **string** JSON (mis. `"1000000"`),
  sedangkan `GET /v1/wallets` dan `PUT /v1/wallets/:id` menjalankan field yang
  sama lewat `serializeWallet` sehingga menjadi **number**. Nilai tetap eksak
  di kedua kasus (bukan financial-integrity bug), tapi tipe data berbeda
  antar-endpoint bisa menjebak client frontend yang strict-typed. Layak
  dibuatkan ticket terpisah, tidak blocking RC ini.

### 17.10 Matriks Pass/Fail final (menggantikan §14 untuk keputusan akhir)

| Item | Hasil |
| --- | --- |
| Full backend test | ✅ PASS (382/382 tanpa DB terpisah, 11 skip butuh `TEST_DATABASE_URL`) |
| Integration test Prisma | ✅ PASS (11/11), **kini permanen ter-commit** (bukan lagi working-tree lokal) |
| Full frontend test | ✅ PASS (170/170) |
| Typecheck (BE+FE) | ✅ PASS |
| Lint (FE) | ✅ PASS |
| Lint (BE) | ➖ N/A (tidak dikonfigurasi, bukan kegagalan) |
| Production build (BE+FE) | ✅ PASS |
| Provisioning database kosong + `migrate deploy` | ✅ PASS |
| `migrate status` | ✅ PASS ("Database schema is up to date!") |
| Generate Prisma Client | ✅ PASS |
| Start backend dengan database baru | ✅ PASS |
| Smoke test seluruh core flow | ✅ PASS (37/37 check) |
| Cross-user isolation | ✅ PASS |
| Financial integrity (7 kriteria task ini) | ✅ PASS — seluruh 7 kriteria diverifikasi eksplisit dengan angka before/after (§17.6) |
| Backup | ✅ PASS — dijalankan sungguhan dengan client tools nyata sesi ini (lebih kuat dari rc.1) |
| Restore ke database kosong | ✅ PASS |
| Smoke test database hasil restore | ✅ PASS |
| Deployment staging/production nyata | ❌ TIDAK ADA — tetap hanya production build lokal, tidak berubah dari rc.1 |
| Responsive desktop | ✅ PASS |
| Responsive mobile | ✅ PASS |
| Critical open | ✅ 0 |
| High core-flow open | ✅ 0 |
| High non-core-flow open | ❌ 2 — PM-STAB-003 (kredensial, tetap open), PM-STAB-004 sisa (migration staging/production, tetap open) |
| Known issues tersisa hanya Medium/Low | ❌ Tidak — 2 High di atas masih terbuka |
| Infrastruktur test/backup ter-commit permanen | ✅ PASS — blocker #1 rc.1 **resolved** sesi ini |

### 17.11 Keputusan akhir

**Ready for another RC.**

Tidak berubah dari rekomendasi rc.1, dengan alasan yang sama persis dan
masih berlaku: seluruh Critical/High core-flow tertutup dengan bukti kuat
(diverifikasi ulang independen sesi ini, bukan hanya dikutip dari rc.1), dan
seluruh 20 langkah verifikasi yang diminta task (§1–§20 pada instruksi) **PASS**
kecuali langkah yang secara struktural membutuhkan environment
staging/production nyata (yang belum ada sama sekali di luar repo ini). Dua
known issue **High** (`PM-STAB-003` rotasi kredensial, `PM-STAB-004` sisa
migration staging/production) tetap terbuka dan **bukan** sesuatu yang bisa
diselesaikan lewat perubahan kode di repo — keduanya butuh akses/approval di
luar repository (Supabase dashboard, environment infra baru).

Bukan **Not Ready**: tidak ada regresi ditemukan, tidak ada Critical/High
core-flow baru, seluruh test/build/migration/smoke/isolation/financial-
integrity/backup-restore lulus 100% dengan bukti langsung hari ini.

Bukan **Ready to promote to MVP Stable**: kriteria wajib "known issues
tersisa hanya Medium/Low" **gagal** secara eksplisit (2 High terbuka), dan
kriteria implisit "production smoke test Pass" tidak dapat dipenuhi karena
tidak ada deployment staging/production nyata untuk diuji — build lokal
bukan pengganti sah untuk ini, konsisten dengan penilaian rc.1.

**Versi yang direkomendasikan: `v0.3.0-rc.2`** (naik dari `v0.3.0-rc.1` sesuai
instruksi task — RC sebelumnya sudah ada di §1–§16, dan HEAD kedua repo
sudah berubah sejak rc.1: blocker #1 resolved lewat commit `0c6c370`, plus dua
typo fix dokumentasi sesi ini). Seperti rc.1, **versi ini tidak di-tag/commit
sebagai rilis** dalam audit ini — task eksplisit meminta status tidak
langsung dinaikkan; ini murni label evidensi untuk hasil validasi §17.

**Sebelum RC berikutnya dapat menjadi "Ready to promote":**
1. Eksekusi rotasi kredensial Supabase (PM-STAB-003) — butuh akses dashboard
   dan persetujuan eksplisit di luar repo.
2. Sediakan environment staging/production nyata, jalankan `migrate resolve
   --applied` + `migrate deploy` terhadapnya (PM-STAB-004 sisa), lalu deploy
   dan jalankan smoke-test matrix production sungguhan
   (`deployment-runbook.md` §9).
3. Perbarui `known-issues.md` dan `src/lib/changelog.ts` `knownIssues` agar
   konsisten dengan status resolved yang sudah diverifikasi (§17.9) — murni
   dokumentasi, tidak blocking secara teknis tapi penting untuk kejelasan
   sebelum promosi.
4. (Opsional, tidak blocking) Perbaiki inkonsistensi tipe respons
   `createWallet` (§17.9) dan selaraskan label navigasi 5-item dengan
   kontrak desain jika keputusan produk mengonfirmasi itu yang diinginkan.

Tidak ada blocker teknis baru yang ditemukan di dalam kendali repo ini —
seluruh yang tersisa membutuhkan tindakan/akses di luar kode.

---

## 18. Staging validation (sesi terpisah, 18 Juli 2026) — lihat `v0.3.0-rc.2-staging-validation.md`

Sesi validasi terpisah menjalankan langkah §2 rekomendasi §17.11 di atas
("Sediakan environment staging/production nyata... jalankan smoke-test
matrix") dengan cakupan yang disesuaikan keputusan produk baru: **Pocket
Mint tidak akan memiliki environment staging cloud terpisah** (proyek
pribadi — hanya local/dev dan production; lihat
`v0.3.0-rc.2-staging-validation.md` §0).

Ringkasan (detail lengkap ada di dokumen terpisah tersebut, tidak diduplikasi
di sini):

- Migration dijalankan nyata dari database kosong (bukan lagi hanya via
  `run-integration-tests.mjs` yang dikutip §17.5, melainkan sesi provisioning
  terpisah): 5 migrasi PASS, `migrate status` "up to date".
- Aplikasi (`ts-node --transpile-only src/server.ts`, `NODE_ENV=production`)
  di-boot melawan database tersebut, `/health` 200.
- **42/42 HTTP smoke test PASS** — cakupan lebih luas dari §17.6 (37/37):
  menambahkan pemeriksaan operational eksplisit (validasi error 400 bukan
  500, tidak ada stack trace/connection string di response error) dan
  konfirmasi ulang seluruh kriteria financial integrity (Net Worth, transfer
  tidak mengubah Net Worth, outstanding cicilan tepat nol, guard INCOME→DEBT).
- **Backup/restore diulang dengan drill baru** (bukan mengutip §17.7): row
  count source vs restored identik (`users: 2, wallets: 3, transactions: 6,
  installments: 1, categories: 24`), 0 orphan FK, smoke test HTTP terhadap
  database hasil restore mengembalikan data yang benar.
- Frontend build/lint/test (170/170) dan backend unit test (382/382, 11
  skip) re-run bersih, tidak ada regresi.

**Keputusan sesi staging validation: "Staging Validation Pass with
Non-blocking Issues"** — bukan "Ready to promote" karena sub-item inti
PM-STAB-004 (menjalankan `migrate resolve --applied` terhadap database
production yang **sudah berjalan** dan berisi data pengguna nyata) sengaja
tidak dijalankan pada sesi ini — itu membutuhkan persetujuan eksplisit
terpisah dan jendela backup sebelum menyentuh data produksi sungguhan, bukan
sesuatu yang aman dieksekusi otomatis. PM-STAB-003 dan PM-STAB-004 karenanya
**tetap Open** dan keputusan akhir §17.11 ("Ready for another RC", bukan
"Ready to promote") **tidak berubah** oleh sesi ini.

---

## 19. Audit final independen v0.3.0-rc.2 — sesi verifikasi ulang (18 Juli 2026, ~22:00–22:20 WIB)

**Konteks tugas:** Sesi ini diminta sebagai "final validation setelah
penyelesaian PM-STAB-003 dan PM-STAB-004", dengan instruksi eksplisit untuk
tidak mempercayai hasil validasi sebelumnya dan menjalankan ulang seluruh
pemeriksaan yang relevan. **Temuan pertama sesi ini: premis tugas tersebut
tidak akurat** — tidak ada bukti di repository bahwa PM-STAB-003 atau
PM-STAB-004 sudah selesai; keduanya **tetap Open**, identik dengan status di
§17–§18. `docs/security/credential-rotation-log.md` yang diminta untuk
dibaca **tidak ada di repository manapun** (`pocket-mint-fe`,
`pocket-mint-be`, `pocket-mint-docs`) — dikonfirmasi dengan pencarian
menyeluruh berbasis nama file dan grep isi (`credential.rotation`,
`PM-STAB-003`) di seluruh repo. Laporan ini melanjutkan sebagai audit
independen sesuai instruksi, bukan menerima premis "sudah selesai" begitu
saja.

### 19.1 Repository state

| Item | Hasil |
| --- | --- |
| Commit `pocket-mint-fe` (HEAD saat audit) | `37f8f076cd3a89477d8273f14e208aaae65cc509` |
| Commit `pocket-mint-be` (HEAD saat audit) | `1c47213cdd90b424627005495d926edbb51fd945` |
| Working tree `pocket-mint-fe` | **TIDAK bersih** — `docs/releases/known-issues.md` dan `docs/releases/mvp-stable-rc-validation.md` modified (belum di-commit), `docs/releases/v0.3.0-rc.2-staging-validation.md` untracked (isinya sudah dikutip di §18, tapi file itu sendiri belum pernah di-commit) |
| Working tree `pocket-mint-be` | **TIDAK bersih** — `src/controllers/account.controller.ts`, `test/walletControllerBoundary.test.ts`, `test/walletUpdate.test.ts`, `dist/controllers/account.controller.{js,js.map,d.ts.map}`, `docs/architecture-wallet-service.md` modified. Diperiksa: ini adalah perbaikan `serializeWallet()` untuk PM-STAB-011 (inkonsistensi tipe respons `createWallet`/`updateWallet`, Medium non-blocking) — perbaikan sah, tapi **belum di-commit**, sehingga bertentangan langsung dengan acceptance criteria `v0.3.0-rc.2-repository-baseline.md` ("Working tree release bersih ... `git status` clean") |
| Clean clone reproducible | **Tidak diverifikasi ulang pada sesi ini** (working tree dirty membuat clean-clone-dari-HEAD tidak representatif dari apa yang sedang diaudit; evidence lama di `v0.3.0-rc.2-repository-baseline.md` tetap valid untuk commit `ca50d6a1`/`1c47213c` yang ia deskripsikan, tapi HEAD FE sudah maju 2 commit sejak itu) |
| Secret di repository (HEAD, tracked files) | **Tidak ditemukan** — grep pola `postgres://user:pass@`, kunci literal, dsb. pada file ter-track hanya menemukan placeholder di `.env.example` dan `TEST_DATABASE_URL` test/CI (`postgres:postgres@localhost`, bukan credential nyata). `.env`/`.env.local` tetap git-ignored, tidak ter-track sejak commit `a900b69` (perilaku tidak berubah, riwayat lama sebelum commit itu masih berisi secret lama sesuai §10 runbook — itulah PM-STAB-003) |
| CI | `.github/workflows/ci.yml` ada di kedua repo (config-level verified); **tidak dijalankan live** pada sesi ini (tidak ada akses GitHub Actions dari sandbox lokal) |

**Kesimpulan 19.1:** Kriteria "frontend working tree clean; backend working
tree clean" **GAGAL** pada saat audit ini dijalankan — regresi dari kondisi
bersih yang didokumentasikan di `v0.3.0-rc.2-repository-baseline.md`. Ini
harus diperbaiki (commit atau discard) sebelum snapshot berikutnya diberi
label RC.

### 19.2 Backend — dijalankan ulang independen

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| Unit test | `npx vitest run` | **PASS (386) / FAIL (0) / skipped (11)** |
| Prisma integration test (database kosong disposable, embedded-postgres, port lokal terpisah) | `npm run test:integration` | 5 migrasi ter-apply bersih dari nol, **11/11 PASS** |
| Typecheck | `npx tsc --noEmit` | No errors |
| Prisma schema validate | `prisma validate` | Schema valid |
| Lint | — | N/A, tidak dikonfigurasi di backend (tidak berubah dari §17) |
| Production build | `npm run build` (`prisma generate && tsc && copy-prisma-client.cjs`) | PASS, Prisma Client packaging (`dist/generated/prisma/client.js`) ter-verifikasi `require()`-able |

### 19.3 Frontend — dijalankan ulang independen

| Pemeriksaan | Perintah | Hasil |
| --- | --- | --- |
| Test | `npx vitest run` | **PASS (170) / FAIL (0)** |
| Typecheck | `npx tsc --noEmit` | No errors |
| Lint | `npx eslint .` | No issues |
| Production build | `npx next build` (dengan 4 env var `NEXT_PUBLIC_*` placeholder, public/client-safe) | PASS — **14 routes** ter-generate (dikonfirmasi lewat output mentah `next build`, bukan ringkasan proxy tool lokal yang sempat melaporkan angka salah "1 routes" pada percobaan pertama — known tooling quirk, bukan masalah build) |

### 19.4 Database — provisioning kosong, independen dari sesi manapun sebelumnya

Instance PostgreSQL disposable baru (`embedded-postgres`, port lokal
terpisah dari sesi §17/§18, dibongkar otomatis setelah selesai):

- `prisma migrate deploy` dari database kosong → **5 migrasi ter-apply
  tanpa error** (`20260710000000_baseline` s.d.
  `20260718000000_drop_unused_transfer_model`).
- `prisma migrate status` → **"Database schema is up to date!"**.
- Backend (`ts-node --transpile-only src/server.ts`) berhasil start melawan
  database ini, `GET /health` → `200`.

Konsisten dengan §17.5/§18 — tidak ada regresi.

### 19.5 HTTP smoke test — end-to-end nyata terhadap database disposable di atas

Dijalankan dengan skrip Node sekali-pakai (JWT HS256 di-mint langsung
memakai `jose`, meniru token Supabase asli persis seperti pola
`test/helpers.ts`; **bukan mock** — request HTTP nyata ke server yang
sedang berjalan). Dua identitas user independen dipakai untuk isolasi.

| # | Pemeriksaan | Hasil |
| --- | --- | --- |
| 1 | Backend start + `/health` 200 | PASS |
| 2 | Auth: bootstrap user via JWT terverifikasi (`POST /v1/users/sync`, 2 user) | PASS |
| 3 | Auth: request tanpa token ditolak 401 | PASS |
| 4 | Wallet: create CASH, BANK, CREDIT_CARD (dengan `creditLimit`/`cutoffDay`/`paymentDueDay`) | PASS (semua) |
| 5 | Income: `POST /v1/transactions` type INCOME ke wallet ASSET | PASS |
| 6 | Expense: `POST /v1/transactions` type EXPENSE ke wallet ASSET | PASS |
| 7 | Transfer: asset→asset, satu baris `TRANSFER` dengan `toWalletId` | PASS |
| 8 | Debt: EXPENSE kredit pada wallet `CREDIT_CARD` (`installmentMonths: 3`) membuat installment | PASS |
| 9 | Debt guard: INCOME ke wallet `CREDIT_CARD` ditolak `400 BAD_REQUEST` | PASS |
| 10 | Installment: `GET /v1/installments?status=ACTIVE` menampilkan installment yang baru dibuat | PASS |
| 11 | Installment: `POST /v1/installments/:id/pay` (`sourceWalletId`) — bayar sampai lunas | PASS |
| 12 | Net Worth: `GET /v1/dashboard/summary` — `net_worth == total_aset − total_utang` diverifikasi angka eksplisit (1.650.000 − 300.000 = 1.350.000 sebelum bayar cicilan; 1.350.000 − 0 = 1.350.000 setelah cicilan lunas — outstanding tepat nol, konsisten dengan PM-STAB-006) | PASS |
| 13 | Historical analytics: `GET /v1/transactions/all` mengembalikan seluruh riwayat lintas tipe transaksi (5 transaksi: income, expense, transfer, debt-expense, tanpa filter bulan) | PASS |
| 14 | User isolation: user B tidak melihat wallet user A di `GET /v1/wallets` | PASS |
| 15 | User isolation: user B tidak bisa `PUT` wallet milik user A (`404 NOT_FOUND`, bukan bocor lewat `403` vs `404` yang membedakan eksistensi — desain existing, bukan regresi) | PASS |
| 16 | Password change | **Tidak dapat diuji lewat backend HTTP by design** — kredensial dimiliki penuh oleh Supabase Auth, tidak ada kolom password maupun endpoint ubah-password di backend Pocket Mint (konsisten dengan `financial-logic.skill.md` dan resolusi PM-STAB-005 yang diuji di level frontend via `tests/profile-page.test.ts`, 19 assertion — bukan gap, melainkan batas arsitektur yang terdokumentasi) |

**Hasil akhir: 22/22 pemeriksaan PASS** (setelah 3 iterasi memperbaiki bug
pada skrip smoke test itu sendiri — field `categoryId` wajib untuk
income/expense, `cutoffDay`/`paymentDueDay` wajib untuk membuat installment
dari wallet kredit, dan `sourceWalletId` bukan `walletId` pada endpoint
pembayaran cicilan; ketiganya adalah kesalahan penulisan skrip audit, bukan
bug produk — dikonfirmasi dengan membaca kontrak request langsung dari
`src/controllers/*.ts` sebelum revisi). Tidak ada temuan baru yang
mengontradiksi PM-STAB-001, 002, 005, 006, 007 yang sudah diklaim Resolved
di §17 — seluruhnya berperilaku benar pada percobaan independen ini.

### 19.6 Staging / production

Tidak ada environment staging cloud terpisah (keputusan produk permanen,
lihat §18 §0) dan **tidak ada bukti deployment production aktif** di
repository manapun pada sesi ini (tidak ada config Railway/Vercel/Fly/Docker,
tidak ada laporan deployment bertanggal). "Staging validation" dalam
pengertian literal (verifikasi commit yang di-deploy, health endpoint di URL
staging nyata, log server nyata) **tidak dapat dijalankan** karena target
tersebut tidak ada — bukan kegagalan pemeriksaan, melainkan tidak-ada-nya
subjek yang diperiksa. §19.4–§19.5 di atas adalah pengganti yang sama
persis dengan metodologi §18 (database disposable lokal yang benar-benar
di-provision dan dijalankan, bukan mock).

### 19.7 Security — PM-STAB-003

- **Status: tetap Open, TIDAK ada evidence rotasi.**
- `pocket-mint-be/docs/deployment-runbook.md` §10 ("Credential rotation")
  masih eksplisit menandai password database Supabase sebagai "Rotation
  required — was in git-tracked `.env`, still in history" dan API key lama
  sebagai "Retired" (bukan "Rotated" — tidak ada perubahan status).
- §11 ("Git-history purge plan") masih **"PENDING EXPLICIT APPROVAL (do not
  execute)"**, tanggal tidak berubah dari 13 Juli 2026.
- `docs/security/credential-rotation-log.md` **tidak ada** di repository
  manapun — dicari dengan nama file dan isi di seluruh working directory,
  nihil.
- Tidak ada dokumen operasional baru (di luar repo atau di dalam repo) yang
  mengonfirmasi rotasi Supabase dashboard sudah dieksekusi.
- **Kesimpulan: PM-STAB-003 belum terpenuhi. "Old credential invalid" tidak
  dapat diverifikasi Pass karena tidak ada bukti rotasi terjadi sama
  sekali** — bukan "Pass dengan evidence tersembunyi", melainkan "belum
  dikerjakan", persis seperti yang sudah dilaporkan sejak rc.1.

### 19.8 Operational — PM-STAB-004

- Sub-item database kosong/baru: **Resolved dan diverifikasi ulang
  independen ketiga kalinya** (§17.5, §18, §19.4 — tiga sesi terpisah,
  hasil konsisten).
- Sub-item staging/production nyata (`migrate resolve --applied` +
  `migrate deploy` terhadap database yang sudah berjalan dan berisi data
  pengguna): **tetap tidak pernah dijalankan**. Tidak ada environment
  staging terpisah (keputusan produk, §18 §0); production nyata sengaja
  tidak disentuh (butuh persetujuan eksplisit + jendela backup terpisah,
  sesuai `agent-rules.skill.md`).
- Rollback procedure: `docs/backup-restore-runbook.md` dan
  `scripts/db-backup.mjs`/`db-restore.mjs`/`db-verify.mjs` tersedia dan
  ter-commit (tidak dijalankan ulang end-to-end pada sesi ini — sudah
  divalidasi nyata di §17.7 dan §18 dengan `pg_dump`/`pg_restore` sungguhan,
  tidak ada indikasi regresi).
- **Kesimpulan: PM-STAB-004 (sisa staging/production) belum terpenuhi**,
  identik dengan status sejak rc.1.

### 19.9 Documentation sync

- `known-issues.md`, `release-status.md`, `src/lib/changelog.ts` saling
  konsisten: PM-STAB-003 dan PM-STAB-004 (sisa) sama-sama tercatat
  High/Open di ketiganya; `changelog.ts` `knownIssues` untuk versi "0.1.0"
  secara eksplisit masih menyebut kedua blocker ini — tidak ada klaim
  palsu bahwa keduanya selesai.
- Tidak ditemukan issue Resolved yang ternyata masih rusak pada
  pemeriksaan ulang independen (§19.5) — PM-STAB-001, 002, 005, 006, 007
  seluruhnya berperilaku benar.
- Tidak ditemukan "fake known issue" (klaim masalah yang sebenarnya tidak
  ada) pada tinjauan `known-issues.md`.
- `release-status.md` "Validation decision" masih **"Ready for another
  RC"** — konsisten dengan temuan sesi ini, tidak perlu diubah.
- **Satu gap dokumentasi ditemukan:** tidak ada dokumen manapun yang
  mencatat bahwa working tree FE dan BE saat ini **tidak bersih** (lihat
  §19.1) — ini adalah regresi state yang terjadi setelah
  `v0.3.0-rc.2-repository-baseline.md` ditulis, dan belum tercatat di
  tempat lain.

### 19.10 Matriks Pass/Fail final

| Kriteria | Hasil |
| --- | --- |
| Critical open | **0** |
| High open | **2** (`PM-STAB-003`, `PM-STAB-004` sisa staging/production) — **tidak nol** |
| Automated tests (BE unit + integration, FE) | **Pass** (386+11 BE, 170 FE, 0 gagal) |
| Financial integrity (net worth, transfer, debt, cicilan lunas) | **Pass** (diverifikasi ulang via HTTP nyata, §19.5) |
| User isolation | **Pass** |
| Fresh migration (database kosong) | **Pass** |
| Staging migration (environment nyata) | **Tidak berlaku / tidak dapat dijalankan** — tidak ada environment staging (keputusan produk); production nyata sengaja tidak disentuh |
| Staging smoke test | Diganti dengan smoke test terhadap database disposable lokal — **Pass** (22/22, §19.5), bukan staging cloud sungguhan |
| Credential rotation | **Fail / belum dikerjakan** |
| Backup/restore | **Pass** (evidence §17.7/§18, tidak diulang di sesi ini, tidak ada indikasi regresi) |
| Production build (BE+FE) | **Pass** |
| Repository working tree bersih | **Fail** (§19.1 — regresi baru) |
| Known issues tersisa hanya Medium/Low | **Fail** — 2 High (`PM-STAB-003`, `PM-STAB-004`) masih Open |

### 19.11 Keputusan

Karena **dua issue High masih terbuka** (`PM-STAB-003`, `PM-STAB-004` sisa
staging/production) — dan sesuai instruksi eksplisit tugas ini ("Jika ada
satu High/Critical issue terbuka, jangan promosikan") — keputusan
**bukan** "Ready to promote to MVP Stable", terlepas dari seluruh hasil
teknis lain yang Pass bersih pada audit independen ini.

Antara "Not Ready" dan "Ready for another RC": seluruh core flow, financial
integrity, user isolation, dan fresh-migration lulus bersih pada
pemeriksaan independen ulang (bukan sekadar mengutip klaim lama) — tidak
ada regresi fungsional. Dua blocker yang tersisa murni operasional
(butuh akses/persetujuan di luar repository), persis seperti kondisi sejak
rc.1, sehingga **tidak ada alasan baru untuk menurunkan status ke "Not
Ready"** dari sisi produk.

**Keputusan: Ready for another RC** (tidak berubah dari §17.11/§18) —
dengan syarat tambahan yang harus dipenuhi SEBELUM snapshot RC berikutnya
diambil:

1. Commit atau discard perubahan working tree yang saat ini pending di
   kedua repo (§19.1) — sebuah RC harus berasal dari commit yang bersih,
   bukan working tree yang sedang berubah.
2. `docs/security/credential-rotation-log.md` yang direferensikan oleh
   instruksi validasi **harus benar-benar dibuat setelah rotasi
   dieksekusi** — saat ini tidak ada, dan tidak boleh diasumsikan ada.
3. PM-STAB-003 dan PM-STAB-004 (sisa) tetap memblokir "Ready to promote"
   sampai keduanya dieksekusi dan diverifikasi dengan bukti operasional
   nyata di luar repository — bukan sesuatu yang bisa diselesaikan lewat
   perubahan kode lagi.

**v0.3.0 belum dapat dipromosikan ke MVP Stable pada titik waktu audit
ini.**
