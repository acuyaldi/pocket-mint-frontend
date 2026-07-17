# Landing CTA Hover Sweep Design

## Tujuan

Memberikan kedua CTA `Mulai Sekarang` pada landing page animasi fill yang menyapu dari kiri ke kanan saat hover, tanpa mengubah tujuan link atau tombol lain di aplikasi.

## Visual dan Interaksi

- Terapkan satu utility class landing-page khusus pada CTA hero dan CTA akhir.
- Tombol tetap berbentuk pill dengan radius 40px, teks putih, font weight 500, dan border satu piksel.
- Gunakan pseudo-element `::before` sebagai lapisan fill yang awalnya berada di luar sisi kiri dan bergerak memenuhi tombol dalam 300ms saat hover.
- Teks berada di atas pseudo-element agar tetap terbaca selama animasi.
- Warna mengikuti token Pocket Mint yang sudah ada agar konsisten dengan identitas landing page; tidak menambahkan warna ungu `#711FE3` yang tidak dipakai oleh sistem desain saat ini.
- Focus-visible mendapatkan state fill yang sama sehingga interaksi keyboard setara dengan hover.
- Pada `prefers-reduced-motion: reduce`, perpindahan fill berlangsung instan.

## Struktur

- Tambahkan utility `.landing-cta-sweep` dan pseudo-element-nya di `app/globals.css`.
- Gunakan class tersebut pada CTA di `components/ui/pocket-mint-hero.tsx` dan `app/page.tsx`.
- Pertahankan komponen `Link`, href `/login`, copy, ukuran target sentuh, serta focus outline yang sudah ada.

## Batasan

- Tidak menambah dependency atau JavaScript state.
- Tidak mengubah tombol `Login`, `Daftar`, navigasi header, tombol tab, maupun kontrol previous/next.
- Tidak mengubah backend, autentikasi, dan route.

## Verifikasi

- Regression test memastikan kedua CTA memakai class baru dan stylesheet memiliki pseudo-element serta transform hover/focus-visible.
- Jalankan test, lint, dan production build.
- Verifikasi hover dan focus keyboard pada desktop serta layout CTA pada mobile.
