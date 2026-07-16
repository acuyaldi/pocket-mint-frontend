# Wallet and Billing Flow QA

Tanggal: 17 Juli 2026  
Environment: production build lokal, frontend `http://localhost:4000`, backend `http://localhost:5001`, Microsoft Edge via Playwright.

## Hasil

| Area | Pemeriksaan | Hasil |
| --- | --- | --- |
| Private routes | Dashboard, Dompet, Transaksi, Tagihan, dan Analitik berakhir di URL yang diminta serta menampilkan konten khusus halaman | Lulus |
| Dompet | Modal Tambah Akun menampilkan Tunai, Bank, E-Wallet, Kartu Kredit, Paylater, dan Pinjaman | Lulus |
| Kategori | Placeholder `Pilih kategori` tidak dapat dipilih | Lulus |
| Transfer | Picker Dompet sumber dan Dompet tujuan muncul; menu sumber memiliki opsi akun | Lulus |
| Kredit | Kartu kredit tersedia sebagai sumber pengeluaran; kelayakan mengikuti sisa limit, bukan batas minimum nominal | Lulus |
| Tagihan | Halaman Tagihan selesai dimuat dan menampilkan empty state untuk akun tanpa tagihan aktif | Lulus |
| Responsif | Halaman Tagihan dan navigasi bawah tampil pada viewport 390 x 844 | Lulus |
| Screenshot | Kontrol development Next.js disembunyikan dan capture memvalidasi URL serta konten sebelum menyimpan gambar | Lulus |

## Catatan data uji

Akun uji memiliki debt ratio 100%, sehingga kartu kredit tidak dapat dipakai untuk pengeluaran Rp200.000 karena sisa limit tidak cukup. Ini sesuai policy limit kredit. Dukungan pembayaran penuh maupun cicilan untuk setiap nominal positif, serta badge tagihan dari hari ini sampai tiga hari ke depan, diverifikasi oleh automated tests.

Playwright mencatat `ERR_NETWORK_ACCESS_DENIED` untuk refresh sesi Supabase langsung dari browser sandbox. Request API Pocket Mint tidak menghasilkan response gagal, session tersimpan tetap valid, dan seluruh halaman produk selesai dimuat.
