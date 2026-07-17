# Pocket Mint — MVP Stable Criteria

Pocket Mint dapat diberi label MVP Stable apabila seluruh kriteria berikut
telah terpenuhi **dengan bukti** (test otomatis, hasil QA bertanggal, atau
log/dokumen operasional) — bukan hanya berdasarkan keberadaan kode atau UI.
Status saat ini (18 Juli 2026) ada di `release-status.md`; temuan yang
memblokir kriteria di bawah ada di `known-issues.md`. Dokumen ini adalah
kriteria target, bukan laporan status — kotak dicentang hanya ketika ada
bukti yang dapat ditelusuri di repo atau operasional nyata.

## Core Features

- [ ] Pengguna dapat mendaftar, login, logout, dan membuka kembali session.
- [ ] Pengguna dapat membuat, mengubah, dan menghapus dompet.
- [ ] Pengguna dapat mencatat pemasukan dan pengeluaran.
- [ ] Pengguna dapat melakukan transfer antar-dompet.
- [ ] Pengguna dapat membuat dan membayar cicilan atau tagihan.
- [ ] Dashboard menampilkan data aktual dari backend.
- [ ] Analitik menggunakan transaksi aktual dan rentang waktu yang benar.

## Financial Integrity

- [ ] Saldo dompet sama dengan hasil perhitungan seluruh transaksi terkait.
- [ ] Transfer tidak mengubah nilai kekayaan bersih.
- [ ] Transaksi kredit menambah hutang dengan benar.
- [ ] Pembayaran hutang menurunkan saldo aset dan saldo hutang tepat satu kali.
- [ ] Cicilan lunas tidak lagi dihitung sebagai hutang aktif.
- [ ] Transaksi gagal tidak meninggalkan perubahan data parsial.
- [ ] Seluruh perhitungan memiliki automated test.

## Reliability

- [ ] Tidak ada bug Critical atau High yang masih terbuka.
- [ ] Seluruh core flow lolos smoke test.
- [ ] Seluruh migration dapat dijalankan pada database baru.
- [ ] Deployment production berhasil tanpa langkah manual yang tidak terdokumentasi.
- [ ] Error penting tercatat pada logging.
- [ ] Backup dan proses pemulihan data telah diuji.

## User Experience

- [ ] Loading, empty, error, dan success state tersedia.
- [ ] Form mencegah submission ganda.
- [ ] Validasi nominal dan field wajib konsisten.
- [ ] Desktop dan mobile mendukung seluruh core flow.
- [ ] Tidak ada broken navigation atau dead-end flow.

## Security and Privacy

- [ ] Semua endpoint membutuhkan autentikasi yang sesuai.
- [ ] Pengguna hanya dapat mengakses datanya sendiri.
- [ ] Secret tidak tersimpan di repository.
- [ ] Production tidak mengekspos stack trace atau data sensitif.
- [ ] Input pengguna divalidasi di backend.

## Release Readiness

- [ ] Changelog tersedia.
- [ ] Release notes tersedia.
- [ ] Versi aplikasi ditentukan.
- [ ] Known issues didokumentasikan.
- [ ] Rollback plan tersedia.