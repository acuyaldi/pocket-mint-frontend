# Pocket Mint — Release Checklist

Checklist ini dicentang untuk **setiap rilis**, terlepas dari ukurannya.
Ini bukan kriteria MVP Stable (lihat `stable-criteria.md` untuk itu) —
ini adalah syarat minimum agar satu rilis boleh di-tag dan diumumkan.
Lihat `README.md` di folder ini untuk penjelasan tiap langkah.

## Sebelum membuat tag

- [ ] **[WAJIB, release-blocking]** `src/lib/changelog.ts` (`RELEASES`)
      diperbarui dengan entri publik baru untuk versi ini, mengikuti bentuk
      pada `templates/release-template.md`. Dokumen internal di
      `docs/releases/` (termasuk RC validation report, audit status, dan
      dokumen sejenis) **tidak pernah otomatis muncul** di changelog
      publik — menyelesaikan dokumentasi internal bukan pengganti langkah
      ini. Lihat README.md bagian 1 dan 1a.
- [ ] Nomor versi (`version`) pada entri baru sesuai aturan patch/minor/major
      di `README.md` bagian 2, termasuk aturan major tetap `0` selama belum
      Public Stable, dan **cocok persis** dengan versi yang akan di-tag.
- [ ] Status (`status: "internal" | "beta" | "stable"`) dan `publishedAt`
      pada entri baru sesuai dengan status rilis sebenarnya di
      `release-status.md` terkini — jangan menulis `"stable"` jika
      `release-status.md` masih menyatakan status lebih rendah, dan jangan
      menulis tanggal publikasi sebelum rilis benar-benar akan diumumkan.
- [ ] Entri rilis lama pada array `RELEASES` **tidak diubah** — hanya entri
      baru yang ditambahkan. Riwayat rilis sebelumnya adalah catatan
      historis dan harus tetap seperti apa adanya.
- [ ] Jika rilis ini adalah release candidate (RC) yang **tidak**
      dipublikasikan secara sengaja sebagai pre-release publik, entri RC
      tersebut **tidak** ditambahkan ke `src/lib/changelog.ts` — lihat
      README.md bagian 1a untuk kapan RC boleh dipublikasikan.
- [ ] Setelah entri ditambahkan, jalankan urutan validasi berikut dan
      pastikan semua lulus:
      1. `npx vitest run tests/changelog.test.ts` (validasi field wajib,
         format versi/tanggal, dan versi duplikat pada `RELEASES`).
      2. `npx tsc --noEmit` (typecheck).
      3. `npm run test` (seluruh suite test frontend, bukan hanya
         `changelog.test.ts`).
      4. `npm run build` (production build).
- [ ] Tidak ada bug **Critical** yang masih terbuka dan relevan dengan
      scope rilis ini (cek `known-issues.md`).
- [ ] Setiap entri `added`/`improved`/`fixed`/`security` sudah diverifikasi
      end-to-end (bukan UI-only) — lihat README.md bagian 10.
- [ ] `knownIssues` pada entri rilis konsisten dengan `known-issues.md`
      (tidak ada temuan relevan yang hilang atau disembunyikan).
- [ ] Setelah entri ditambahkan, verifikasi secara visual (lokal atau
      preview) bahwa rilis baru ini muncul **paling atas** (newest-first) di
      landing page ("Yang Baru di Pocket Mint") **dan** di `/changelog`, dan
      bahwa entri rilis lama masih tampil di bawahnya tanpa perubahan.
- [ ] Perubahan `src/lib/changelog.ts` sudah direview dan merge ke branch
      utama.

**Release-blocking:** rilis publik ini tidak boleh dipromosikan ke `main`
sampai entri `src/lib/changelog.ts` untuk versi ini ada, lulus
`tests/changelog.test.ts`, dan langkah verifikasi newest-first di atas
selesai. Dokumentasi rilis internal yang lengkap (`release-status.md`,
laporan validasi RC, dsb.) **tidak menggantikan** syarat ini.

## Tag dan deployment

- [ ] Git tag annotated dibuat pada commit merge `src/lib/changelog.ts`
      (lihat README.md bagian 7).
- [ ] Tag di-push ke remote.
- [ ] Deployment ke target environment selesai dijalankan.

## Setelah deployment

- [ ] Versi yang berjalan di production sesuai dengan tag yang baru dibuat.
- [ ] Smoke test core flow dijalankan dan lulus (login, dashboard, wallet,
      transaksi).
- [ ] Log error diperiksa, tidak ada error baru pasca-deploy.
- [ ] Rollback plan untuk rilis ini sudah jelas (versi tujuan rollback
      diketahui) — lihat README.md bagian 9.

## Jika salah satu poin gagal

Jangan lanjutkan pengumuman rilis. Tangani kegagalan dulu, atau jalankan
rollback (README.md bagian 9) jika kegagalan ditemukan setelah deploy.

## Urutan rilis Production (promosi ke MVP Stable)

Untuk rilis yang mencakup promosi ke branch `main` / production — termasuk,
bila berlaku, reconciliation migration database (lihat
`pocket-mint-be/docs/prisma-migration-reconciliation.md` §0 dan
`pocket-mint-be/docs/deployment-runbook.md` §6–§9) — checklist di atas
dijalankan **di dalam** urutan tetap berikut. Setiap tahap harus selesai dan
terverifikasi sebelum lanjut ke tahap berikutnya:

```text
Database backup completed
        ↓
Migration executed
        ↓
Migration verified
        ↓
Backend deployed
        ↓
Frontend deployed
        ↓
Smoke tests passed
        ↓
Tag release
        ↓
GitHub Release
        ↓
Pocket Mint MVP Stable
```

Setiap panah adalah gerbang, bukan formalitas — jangan lanjut ke langkah
berikutnya jika langkah sebelumnya gagal atau belum terverifikasi. Jika
kegagalan ditemukan setelah "Backend deployed" atau "Frontend deployed",
ikuti rollback (README.md bagian 9) sebelum mencoba lanjut lagi dari awal
urutan.

**Catatan urutan (agar tidak tampak kontradiktif dengan dokumen BE):**

- **"Migration executed"** di atas bukan satu langkah atomik — untuk detail
  urutan migrasi additive/destruktif di dalamnya (mis. migrasi additive
  dijalankan sebelum backend deploy, migrasi destruktif setelahnya), ikuti
  `pocket-mint-be/docs/deployment-runbook.md` §6.
- **"Backend deployed → Frontend deployed"** di atas adalah urutan **default**
  untuk rilis yang backend-nya backward-compatible (endpoint/kontrak lama
  tetap berfungsi untuk frontend versi sebelumnya). Untuk rilis yang mengubah
  kontrak auth/API secara breaking di backend — seperti migrasi JWT-only yang
  dijelaskan sebagai "golden rule" di awal
  `pocket-mint-be/docs/deployment-runbook.md` — urutan itu **terbalik**:
  frontend yang Bearer-capable harus deploy lebih dulu, baru backend JWT-only.
  Ini satu-satunya pengecualian yang sah terhadap urutan default di atas;
  tentukan di awal perencanaan rilis mana yang berlaku dan catat itu secara
  eksplisit di rencana rilis, jangan asumsikan default tanpa memeriksa apakah
  rilis ini mengubah kontrak backend secara breaking.
