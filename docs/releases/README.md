# Pocket Mint — Release Workflow

Dokumen ini adalah panduan proses rilis Pocket Mint. Ini bukan laporan
status (lihat `release-status.md`) dan bukan daftar kriteria stable (lihat
`stable-criteria.md`) — ini adalah **cara kerja**: kapan sesuatu masuk
changelog, bagaimana menentukan versi, dan langkah membuat rilis.

Cakupan tahap ini: dokumentasi dan template saja. Tidak ada perubahan
aplikasi atau automation CI yang ditambahkan oleh workflow ini.

## Dokumen terkait

| Dokumen | Isi |
| --- | --- |
| `release-checklist.md` | Checklist yang dicentang sebelum setiap rilis. |
| `templates/release-template.md` | Template kosong untuk menulis entri rilis baru. |
| `stable-criteria.md` | Kriteria target untuk mencapai MVP Stable / Public Stable. |
| `release-status.md` | Status terkini produk (audit terakhir, bukan changelog). |
| `known-issues.md` | Temuan yang belum diperbaiki, dengan severity. |

## 1. Kapan perubahan masuk changelog

Masuk changelog hanya perubahan yang **terlihat atau berdampak** pada
pengguna, operator, atau integrator:

- Fitur baru atau perubahan perilaku fitur (`Added`, `Improved`).
- Perbaikan bug yang sebelumnya berdampak ke pengguna (`Fixed`).
- Perubahan yang berkaitan dengan keamanan, autentikasi, atau data pengguna
  (`Security`).
- Masalah yang diketahui tetapi sengaja belum diperbaiki pada rilis ini
  (`Known Issues`).

**Tidak** masuk changelog: refactor internal tanpa perubahan perilaku,
perubahan test, perubahan dokumentasi internal, perubahan tooling/dev
dependency, perbaikan typo di kode yang tidak terlihat pengguna. Jika
ragu, tanyakan: "apakah pengguna atau operator perlu tahu ini terjadi?" —
kalau tidak, bukan entri changelog.

## 1a. Dokumen internal dan RC tidak otomatis masuk changelog publik

Menyelesaikan dokumentasi rilis internal — `release-status.md`,
`mvp-stable-rc-validation.md`, laporan validasi RC lainnya di
`docs/releases/` — **tidak** membuat entri apa pun muncul di changelog
publik. Kedua hal ini terpisah secara sengaja:

- Dokumen internal mencatat **bukti dan status audit** untuk keperluan tim
  (apakah kriteria stable terpenuhi, apa yang masih blocker, dsb.).
- `src/lib/changelog.ts` mencatat **apa yang diumumkan ke pengguna**, dan
  hanya berubah lewat langkah eksplisit di bagian 6 di bawah.

Ini adalah akar masalah yang menyebabkan rilis MVP Stable 0.3.0 sempat
tidak punya entri changelog publik meski dokumentasi rilis internalnya
sudah lengkap — lihat `release-checklist.md` untuk gerbang wajib yang kini
mencegah ini terulang.

**Release candidate (RC)** — versi berakhiran `-rc.N` yang dicatat di
`release-status.md`/laporan validasi — **tidak** ditambahkan ke
`src/lib/changelog.ts`, kecuali produk secara sengaja memutuskan untuk
mempublikasikan pre-release ke pengguna publik (mis. beta program publik).
Jika RC tersebut kemudian dipromosikan menjadi rilis publik, entri
changelog dibuat untuk **versi finalnya** (tanpa suffix `-rc.N`), bukan
untuk RC-nya.

## 2. Cara menentukan patch, minor, dan major

Format versi: `MAJOR.MINOR.PATCH` (SemVer).

| Jenis perubahan | Naikkan | Contoh |
| --- | --- | --- |
| Perbaikan bug, tanpa fitur baru, tanpa perubahan perilaku yang disengaja | **Patch** | Saldo dompet salah dibulatkan diperbaiki |
| Fitur baru yang backward compatible (tidak menghapus/mengubah perilaku lama) | **Minor** | Menambah filter kategori di halaman Transaksi |
| Perubahan besar atau breaking behavior (menghapus fitur, mengubah kontrak API, mengubah alur inti) | **Major** | Mengganti model perhitungan cicilan |

Aturan khusus Pocket Mint:

- **Selama produk belum mencapai Public Stable, major version tetap `0`.**
  Perubahan yang secara normal layak jadi major (breaking behavior) tetap
  menaikkan **minor** selama masih `0.x.y` — ini konsisten dengan konvensi
  SemVer bahwa `0.x` adalah rentang pengembangan awal yang belum stabil.
- **`v1.0.0` hanya diberikan setelah seluruh kriteria di `stable-criteria.md`
  terpenuhi untuk Public Stable**, bukan berdasarkan tanggal atau tekanan
  jadwal.
- Jika satu rilis berisi campuran patch dan minor, gunakan level tertinggi
  (minor mengalahkan patch).

## 3. Perbedaan Internal MVP, MVP Beta, MVP Stable, Public Stable

Definisi berikut sama dengan yang dipakai di `release-status.md` —
jangan didefinisikan ulang secara berbeda di tempat lain.

| Status | Arti |
| --- | --- |
| **Internal MVP** | Alur inti berjalan untuk penggunaan internal/dogfooding; pengujian ad hoc; belum tentu ter-deploy dengan hardening. |
| **MVP Beta** | Fitur inti terhubung end-to-end (FE ↔ BE ↔ DB), punya automated test, dan ada CI gate. Sebagian kriteria stable belum terpenuhi atau belum terverifikasi dengan bukti. |
| **MVP Stable** | Seluruh item di `stable-criteria.md` terpenuhi dengan bukti pengujian, termasuk deployment production dan reconciliation database yang sudah dijalankan dan diverifikasi. |
| **Public Stable** | MVP Stable + siap dipakai pengguna publik (SLA, dukungan, monitoring produksi berjalan). Prasyarat untuk `v1.0.0`. |

Setiap entri release harus mencantumkan status ini secara eksplisit (lihat
template), karena status menentukan seberapa besar klaim yang boleh dibuat
tentang rilis tersebut — mis. rilis berstatus MVP Beta tidak boleh
mengklaim "siap produksi" atau "stabil".

## 4. Cara mengisi Added, Improved, Fixed, Security, Known Issues

Setiap baris entri harus:

- Ditulis dari sudut pandang dampak ke pengguna/operator, bukan istilah
  implementasi internal (hindari nama variabel, nama file, nama commit).
- **Dapat ditelusuri ke bukti**: PR, commit, atau hasil test. Jangan
  menulis entri dari ingatan atau asumsi.
- Satu baris = satu perubahan. Jangan gabungkan beberapa perubahan tak
  terkait dalam satu baris.

| Kategori | Isi |
| --- | --- |
| `Added` | Fitur atau kemampuan yang benar-benar baru dan sudah berfungsi end-to-end. |
| `Improved` | Perubahan pada fitur yang sudah ada: performa, UX, validasi, pesan error. |
| `Fixed` | Bug yang sebelumnya berdampak ke pengguna, sekarang sudah diperbaiki dan diverifikasi. |
| `Security` | Perbaikan atau perubahan terkait autentikasi, otorisasi, data sensitif, atau dependency dengan kerentanan. Jika detail kerentanan berbahaya untuk diungkap publik, tulis dampak dan status perbaikan tanpa detail eksploitasi. |
| `Known Issues` | Masalah yang sudah teridentifikasi (lihat `known-issues.md`) tetapi belum diperbaiki pada rilis ini. Sertakan severity dan link ke known-issues.md. |

Jika sebuah kategori tidak punya entri pada suatu rilis, hapus kategori
tersebut dari catatan rilis — jangan tulis "Tidak ada perubahan" sebagai
pengisi.

## 5. Checklist sebelum release

Lihat `release-checklist.md`. Wajib dicentang seluruhnya sebelum tag
dibuat dan rilis diumumkan.

**Kenapa langkah ini bukan CI gate otomatis:** CI (`.github/workflows/ci.yml`)
sudah menjalankan `npx vitest run` (termasuk `tests/changelog.test.ts`),
`npx tsc --noEmit`, dan `npm run build` di setiap PR ke `dev`/`main` — jadi
entri changelog yang **sudah ditambahkan** selalu tervalidasi otomatis.
Tapi mewajibkan CI untuk **mendeteksi bahwa suatu PR seharusnya berisi
entri changelog baru** ditolak secara sengaja: satu-satunya sinyal murah
yang tersedia adalah heuristik nama file (mis. "jika `release-status.md`
berubah, wajib ada versi baru di `changelog.ts`"), dan itu rapuh — akan
salah positif untuk PR yang mengedit `release-status.md` karena alasan lain
(koreksi audit, update known-issues) dan salah negatif untuk rilis yang
lupa menyentuh `release-status.md` sama sekali. Tidak ada sinyal terpercaya
di repo yang menandai "PR ini adalah rilis publik" tanpa keterlibatan
manusia. Karena itu `release-checklist.md` bagian "Sebelum membuat tag"
tetap menjadi gerbang otoritatif untuk syarat ini, ditegakkan lewat review
PR rilis, bukan lewat CI.

## 6. Cara memperbarui source of truth changelog

Source of truth changelog `pocket-mint-fe` adalah
`pocket-mint-fe/src/lib/changelog.ts` (array `RELEASES`, tervalidasi oleh
`validateRelease`/`assertValidReleases` dan diuji di `tests/changelog.test.ts`)
— **bukan** file Markdown terpisah. `/changelog` dan bagian "Yang Baru di
Pocket Mint" pada landing page (`app/page.tsx`) sama-sama mengimpor
`getReleases()`/`getLatestRelease()` dari file ini, jadi tidak ada data
rilis yang di-hardcode dua kali. Format data mengikuti `src/types/changelog.ts`
(`Release`, `ReleaseChanges`, `ReleaseStatus`).

`pocket-mint-be` belum punya perubahan yang butuh changelog terpisah; jika
suatu rilis nanti mencakup perubahan backend yang terlihat pengguna/operator,
buat struktur setara (`pocket-mint-be/src/lib/changelog.ts` atau sejenisnya)
mengikuti pola yang sama — jangan gabungkan changelog dua repo jadi satu
sumber data.

Langkah menambah rilis baru:

1. Salin bentuk objek pada `templates/release-template.md`, isi seluruh
   bagian yang relevan (lihat bagian 4 di atas) sebagai objek `Release`.
2. Tambahkan objek baru ke array `RELEASES` di `src/lib/changelog.ts`.
   Urutan penulisan dalam array tidak penting — `getReleases()` selalu
   mengurutkan newest-first berdasarkan `version` lalu `publishedAt` lewat
   `sortReleases()`.
3. Jalankan `npx vitest run tests/changelog.test.ts` — `assertValidReleases`
   akan melempar error jika field wajib hilang, format `version`/`publishedAt`
   salah, atau ada `version` duplikat.
4. Commit perubahan `src/lib/changelog.ts` sebagai bagian dari PR rilis,
   direview sebelum merge — bukan ditambahkan setelah tag dibuat.

## 7. Cara membuat Git tag

Setelah perubahan pada `src/lib/changelog.ts` di-merge ke branch utama:

```bash
git checkout main
git pull
git tag -a v0.2.0 -m "Pocket Mint FE v0.2.0"
git push origin v0.2.0
```

Aturan tag:

- Format `vMAJOR.MINOR.PATCH`, selalu dengan prefix `v`.
- Selalu annotated tag (`-a`), bukan lightweight tag, agar punya pesan dan
  metadata author/tanggal.
- Tag dibuat pada commit yang sama dengan commit merge perubahan
  `src/lib/changelog.ts`, bukan commit sesudahnya.
- Tag FE dan BE independen — beri nama sama hanya jika kebetulan rilis
  bersamaan, jangan dipaksakan sinkron.

## 8. Cara memverifikasi deployment

Setelah deploy, sebelum mengumumkan rilis:

1. Ikuti langkah verifikasi di `deployment-runbook.md` (repo BE) untuk
   environment yang dituju.
2. Jalankan smoke test manual pada core flow: login, lihat dashboard,
   buat/lihat transaksi, lihat dompet — sesuai cakupan
   `docs/qa/wallet-billing-flow.md`.
3. Periksa versi yang berjalan di production sesuai dengan tag yang baru
   dibuat (mis. lewat endpoint health/version jika tersedia, atau commit
   hash yang di-deploy).
4. Periksa log error segera setelah deploy untuk memastikan tidak ada
   error baru yang muncul.

Rilis tidak dianggap selesai sampai keempat langkah ini dilakukan dan
hasilnya dicatat (lihat `release-checklist.md`).

## 9. Cara melakukan rollback

1. Identifikasi tag/versi stabil terakhir sebelum rilis bermasalah.
2. Deploy ulang artifact/commit dari tag tersebut mengikuti prosedur
   deployment yang sama seperti rilis normal (lihat `deployment-runbook.md`),
   bukan hotfix di atas versi bermasalah.
3. Jika rilis bermasalah sudah mengubah skema database, rollback kode saja
   tidak cukup — evaluasi apakah migration perlu di-revert juga sebelum
   rollback kode dijalankan, agar skema dan kode tetap konsisten.
4. Verifikasi ulang menggunakan langkah di bagian 8 setelah rollback.
5. Catat insiden: versi bermasalah, gejala, versi tujuan rollback, dan
   waktu — tambahkan sebagai entri di `known-issues.md` jika akar masalah
   belum diperbaiki.

## 10. Larangan menulis klaim fitur yang belum tersedia

Changelog dan release notes hanya boleh mencantumkan fitur yang:

- Sudah terhubung end-to-end (bukan UI-only — lihat contoh form ubah
  password di `known-issues.md` #1 sebagai kasus yang **tidak boleh**
  diklaim selesai).
- Sudah punya bukti verifikasi: automated test, atau QA manual bertanggal.

Dilarang keras:

- Menulis fitur sebagai "Added"/"Fixed" berdasarkan kode yang ada di UI
  tapi tidak memanggil backend/logic sungguhan.
- Menulis "coming soon" atau roadmap sebagai bagian dari `Added`/`Improved`
  — roadmap bukan bagian dari changelog rilis.
- Mengklaim status yang lebih tinggi dari yang didukung bukti (mis.
  menyebut rilis "stable" padahal status sebenarnya MVP Beta).

Jika tidak yakin suatu fitur benar-benar berfungsi end-to-end, verifikasi
dulu ke kode (FE hook → API client → route backend → service) sebelum
menulis entri — jangan menulis dari asumsi bahwa komponen UI berarti
fitur sudah bekerja.

## 11. Cara membuat GitHub Release

Langkah "GitHub Release" di `release-checklist.md` (urutan production, setelah
"Tag release") merujuk ke prosedur berikut. Berlaku sama untuk `pocket-mint-fe`
dan `pocket-mint-be` (lihat `pocket-mint-be/docs/deployment-runbook.md` §13
untuk ringkasan sisi backend) — hanya repository dan isi body yang berbeda.

- **Dibuat di mana:** GitHub Release dibuat di repository yang tag-nya berasal
  — rilis FE di `pocket-mint-fe`, rilis BE di `pocket-mint-be`. Tidak ada
  release gabungan lintas repo; masing-masing repo punya riwayat Release
  sendiri, sejalan dengan aturan tag independen di bagian 7.
- **Kapan:** setelah tag annotated dibuat (bagian 7) **dan** langkah verifikasi
  deployment (bagian 8) selesai dengan hasil baik — bukan sebelum production
  terverifikasi sehat.
- **Draft vs published:** boleh disiapkan sebagai **draft** sambil menulis body
  release, tapi harus di-**publish** sebelum rilis dianggap selesai di
  `release-checklist.md`. Draft yang tidak pernah di-publish tidak memenuhi
  langkah "GitHub Release" pada checklist.
- **Format judul:** `Pocket Mint FE vX.Y.Z` (atau `Pocket Mint BE vX.Y.Z` di
  repo backend), sama persis dengan versi pada tag.
- **Isi body:** ringkasan `Added`/`Improved`/`Fixed`/`Security`/`Known Issues`
  untuk rilis tersebut, level bahasa dan larangan yang sama seperti bagian 4
  dan 10 di atas (dampak ke pengguna/operator, bukan istilah implementasi;
  tidak ada klaim fitur yang belum terhubung end-to-end).
- **Hubungan dengan changelog:** body GitHub Release **bukan** sumber data
  baru — ia meringkas entri yang sudah ada di `src/lib/changelog.ts` (bagian 6)
  untuk versi yang sama. Jangan menulis entri changelog hanya di body GitHub
  Release tanpa menambahkannya ke `src/lib/changelog.ts` terlebih dahulu;
  `src/lib/changelog.ts` tetap satu-satunya source of truth yang ditampilkan
  di `/changelog` dan landing page.
