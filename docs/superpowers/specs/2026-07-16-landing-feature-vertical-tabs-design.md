# Landing Feature Vertical Tabs Design

## Tujuan

Mengganti section fitur Dashboard, Wallet, Transaction, Installment, dan Analytics pada landing page menjadi satu showcase vertical tabs. Hero, section privasi, CTA, dan footer tetap dipertahankan.

## Struktur

- Tambahkan satu client component reusable di `components/ui/vertical-tabs.tsx`.
- Render komponen tersebut pada `app/page.tsx` sebagai satu section fitur dengan anchor `#features`.
- Data kelima tab tetap lokal dan statis karena hanya dipakai oleh landing page: judul, deskripsi, path aset, alt text, serta dimensi intrinsik gambar.
- Gunakan aset yang sudah tersedia di `public/landing`: `dashboard.png`, `wallet.png`, `transaction.png`, `installment.png`, dan `analytics.png`.
- Hapus section fitur lama yang terpisah. Screenshot Dashboard di hero tetap ada.

## Tata Letak dan Visual

- Desktop memakai dua kolom: daftar tab vertikal di kiri dan media aktif yang lebih dominan di kanan.
- Mobile menampilkan media aktif terlebih dahulu, lalu daftar tab vertikal agar produk langsung terlihat tanpa horizontal overflow.
- Gaya mengikuti design contract Pocket Mint: canvas off-white, surface putih, border semantik, tipografi Inter, radius 16px, bayangan minimal, dan tanpa gradient atau glassmorphism.
- Semua tab memakai frame media dengan tinggi responsif yang sama agar layout tidak berubah saat tab berganti.
- Screenshot dirender selebar penuh, diratakan ke sisi atas dan tengah secara horizontal, serta mempertahankan rasio intrinsiknya. Frame memotong bagian bawah gambar; area topbar sampai sekitar separuh layar produk harus tetap terlihat dan tidak ada crop pada sisi kiri atau kanan.

## Interaksi

- Tab aktif dapat dipilih melalui click/tap dan keyboard menggunakan native `button`.
- Tab berganti otomatis setiap tiga detik.
- Auto-play berhenti saat pointer berada pada showcase atau ketika fokus keyboard berada di dalam showcase, lalu dilanjutkan setelah interaksi selesai.
- Tombol previous dan next tersedia pada frame media dengan ikon Lucide yang sudah terpasang.
- Pergantian media bergerak vertikal sesuai arah navigasi menggunakan `framer-motion` yang sudah terpasang.
- Saat pengguna memilih tab secara manual, timer dimulai ulang dari tab tersebut.
- Pengguna dengan `prefers-reduced-motion` mendapat pergantian instan atau fade singkat tanpa pergerakan vertikal dan tanpa progress animation yang mengganggu.

## Aksesibilitas

- Container memakai semantik tab yang sesuai: `role="tablist"`, setiap pemilih memiliki `role="tab"`, `aria-selected`, `aria-controls`, dan focus indicator yang terlihat.
- Panel aktif memiliki `role="tabpanel"`, label yang terhubung, dan alt text Bahasa Indonesia yang menjelaskan layar produk.
- Tab tidak aktif tetap memiliki target sentuh minimal 44px dan status aktif ditandai secara struktural, bukan hanya melalui warna.
- Kontrol previous/next memiliki accessible name Bahasa Indonesia.

## Dependency dan Batasan

- Tidak menambah dependency. Gunakan `framer-motion`, `lucide-react`, `next/image`, dan helper `cn` yang sudah ada.
- Tidak mengubah backend, autentikasi, route aplikasi, data finansial, atau komponen hero.
- Tidak membuat abstraction atau provider baru karena state hanya lokal pada satu showcase.

## Verifikasi

- Jalankan lint, test, dan production build.
- Uji landing page pada viewport desktop dan mobile.
- Verifikasi click/tap, keyboard focus, previous/next, auto-play, pause saat hover/focus, serta reduced-motion.
- Bandingkan screenshot browser dengan desain yang disetujui: hero tidak berubah, semua lima fitur berada dalam satu vertical-tabs showcase, seluruh frame memiliki tinggi yang sama, gambar rata atas dan terpusat secara horizontal, serta bagian bawah gambar terpotong tanpa menyembunyikan topbar sampai sekitar separuh layar produk.
