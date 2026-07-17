# Pocket Mint — Release Checklist

Checklist ini dicentang untuk **setiap rilis**, terlepas dari ukurannya.
Ini bukan kriteria MVP Stable (lihat `stable-criteria.md` untuk itu) —
ini adalah syarat minimum agar satu rilis boleh di-tag dan diumumkan.
Lihat `README.md` di folder ini untuk penjelasan tiap langkah.

## Sebelum membuat tag

- [ ] Seluruh automated test lulus di repo yang dirilis (`npx vitest run`
      atau setara).
- [ ] Tidak ada bug **Critical** yang masih terbuka dan relevan dengan
      scope rilis ini (cek `known-issues.md`).
- [ ] Nomor versi ditentukan sesuai aturan patch/minor/major di
      `README.md` bagian 2, termasuk aturan major tetap `0` selama belum
      Public Stable.
- [ ] `CHANGELOG.md` diperbarui menggunakan `templates/release-template.md`,
      ditambahkan di paling atas file.
- [ ] Setiap entri `Added`/`Improved`/`Fixed`/`Security` sudah diverifikasi
      end-to-end (bukan UI-only) — lihat README.md bagian 10.
- [ ] `Known Issues` pada entri rilis konsisten dengan `known-issues.md`
      (tidak ada temuan relevan yang hilang atau disembunyikan).
- [ ] Status rilis (Internal MVP / MVP Beta / MVP Stable / Public Stable)
      dicantumkan dan sesuai dengan `release-status.md` terkini.
- [ ] `CHANGELOG.md` sudah direview dan merge ke branch utama.

## Tag dan deployment

- [ ] Git tag annotated dibuat pada commit merge `CHANGELOG.md` (lihat
      README.md bagian 7).
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
