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

## 6. Cara memperbarui source of truth changelog

Source of truth changelog adalah `CHANGELOG.md` di root masing-masing
repo (`pocket-mint-fe/CHANGELOG.md` dan `pocket-mint-be/CHANGELOG.md`).
Belum ada file ini di kedua repo (lihat `known-issues.md` #7) — buat saat
rilis pertama dibuat menggunakan `templates/release-template.md`.

Langkah:

1. Salin `templates/release-template.md`, isi seluruh bagian yang relevan
   (lihat bagian 4 di atas).
2. Tambahkan entri baru **di bagian paling atas** `CHANGELOG.md`, di bawah
   judul file, sebelum entri versi sebelumnya (urutan terbaru → terlama).
3. Simpan di repo yang perubahannya benar-benar terjadi. Jika suatu rilis
   mencakup perubahan FE dan BE, catat di kedua `CHANGELOG.md` masing-masing
   dengan scope yang jelas — jangan menggabungkan changelog dua repo jadi
   satu file.
4. Commit `CHANGELOG.md` sebagai bagian dari PR rilis, direview sebelum
   merge — bukan ditambahkan setelah tag dibuat.

## 7. Cara membuat Git tag

Setelah `CHANGELOG.md` di-merge ke branch utama:

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
- Tag dibuat pada commit yang sama dengan commit merge `CHANGELOG.md`,
  bukan commit sesudahnya.
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
