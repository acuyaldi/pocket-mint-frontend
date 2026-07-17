<!--
TEMPLATE — bukan release aktual. Salin blok di bawah "## [vX.Y.Z] ..." ke
paling atas CHANGELOG.md, isi, lalu hapus komentar ini dan bagian yang
tidak dipakai. Lihat README.md di folder ini untuk aturan pengisian tiap
bagian dan cara menentukan patch/minor/major.
-->

## [vX.Y.Z] - YYYY-MM-DD

**Repo:** pocket-mint-fe | pocket-mint-be
**Status:** Internal MVP | MVP Beta | MVP Stable | Public Stable
**Jenis rilis:** Patch | Minor | Major

### Added
<!-- Fitur baru yang berfungsi end-to-end, dengan bukti (PR/commit/test). -->
- ...

### Improved
<!-- Perubahan pada fitur yang sudah ada: performa, UX, validasi, pesan error. -->
- ...

### Fixed
<!-- Bug yang sebelumnya berdampak ke pengguna, sudah diperbaiki dan diverifikasi. -->
- ...

### Security
<!-- Perubahan terkait autentikasi, otorisasi, atau data sensitif. Tulis dampak dan status perbaikan tanpa detail eksploitasi. -->
- ...

### Known Issues
<!-- Masalah yang sudah diketahui tapi sengaja belum diperbaiki pada rilis ini. Sertakan severity dan link ke known-issues.md. -->
- [Severity] ...

<!--
Hapus kategori yang tidak punya entri pada rilis ini — jangan menulis
"Tidak ada perubahan" sebagai pengisi.
-->

---

### Contoh terisi (ilustrasi format saja, BUKAN release aktual Pocket Mint)

```
## [v0.2.0] - 2026-08-01

**Repo:** pocket-mint-fe
**Status:** MVP Beta
**Jenis rilis:** Minor

### Added
- Filter kategori pada halaman Transaksi.

### Improved
- Pesan error validasi nominal transaksi kini menyebutkan field yang salah.

### Fixed
- Saldo dompet DEBT tidak lagi salah dibulatkan saat menampilkan sisa tagihan.

### Known Issues
- [Medium] Tombol "Ekspor laporan" di halaman Analitik belum berfungsi — lihat known-issues.md #2.
```
