# Landing Interaction Polish Design

## Tujuan

Merapikan interaksi landing page agar CTA tetap terbaca saat hover, hero terasa lebih hidup, card privasi memberi respons visual yang halus, dan nomor vertical tabs konsisten dengan sistem nomor pada card privasi.

Spesifikasi ini memperluas desain landing yang sudah ada. Khusus untuk card privasi, kebutuhan animasi dan hover di dokumen ini menggantikan batasan lama yang menyatakan card tidak memiliki hover atau entrance animation.

## Ruang Lingkup

- Tombol `Daftar` pada header dan `Mulai Sekarang` pada hero.
- Pulse beams di belakang hero.
- Tiga card pada section `Data finansial Anda tetap milik Anda.`
- Badge nomor `01` sampai `05` pada vertical tabs.
- Focused regression tests untuk empat perilaku tersebut.

Copy, route, urutan section, data tab, autoplay, gambar, login panel, backend, dan authenticated workspace tidak berubah.

## CTA Hover

- Pertahankan sweep mint yang sudah ada.
- Saat hover atau focus-visible, warna teks berubah secara eksplisit ke token `primary` (`#001414`) agar tampak hitam dan tidak kalah oleh `text-primary-foreground` dari varian tombol.
- Terapkan state yang sama pada `Daftar` dan CTA hero melalui class `landing-cta-sweep`; tidak ada style satu kali yang berbeda per tombol.
- Teks tetap berada di atas pseudo-element sweep dan outline keyboard tetap terlihat.

## Pulse Beams Hero

- Pertahankan satu layer SVG non-interaktif di belakang isi hero.
- Gunakan jalur asimetris yang tampak acak, tetapi endpoint dan arah geraknya secara komposisi berkumpul menuju area tengah CTA `Mulai Sekarang`.
- Sebagian jalur dapat dimulai dari sisi kiri dan kanan agar ruang kosong terisi tanpa menutup headline, deskripsi, CTA, atau screenshot.
- Geometry bersifat deterministik agar hasil render dan test stabil; tidak memakai random value saat runtime.
- Layer tetap `aria-hidden`, melewatkan pointer events, tidak membuat overflow horizontal, dan berhenti pada state statis ketika reduced motion aktif.

## Card Privasi

- Pertahankan semantic list dan komponen `Card` yang sudah ada.
- Setiap card masuk dengan fade dan pergeseran vertikal pendek secara berurutan ketika stack pertama kali memasuki viewport.
- Hover-capable pointer memberi highlight tenang: card terangkat sedikit, border/outline lebih tegas, dan surface berubah tipis. Tidak ada glow besar atau perubahan layout.
- Focus-within memakai treatment yang setara bila card kelak memuat elemen fokus; card tetap informasional dan tidak diberi cursor pointer atau click handler.
- Reduced motion menghapus perpindahan dan stagger tanpa menyembunyikan card.
- Implementasi interaksi ditempatkan dalam komponen client kecil agar keseluruhan landing page tetap menjadi server component.

## Nomor Vertical Tabs

- Nilai tetap `01`, `02`, `03`, `04`, dan `05`.
- Ganti format `/01` yang kecil menjadi badge `size-10`, `rounded-lg`, `bg-mint/15`, `text-primary`, dan tipografi yang sama dengan badge card privasi.
- Badge tetap dekoratif dengan `aria-hidden="true"`; nama tab tetap menjadi label aksesibel utamanya.
- Active state tab boleh mempertegas badge melalui border atau surface yang sedikit lebih kuat, tetapi ukuran badge tidak berubah agar layout stabil.

## Pendekatan Implementasi

- Gunakan CSS/Tailwind untuk hover, focus, dan warna CTA.
- Gunakan Framer Motion yang sudah terpasang hanya untuk entrance sequence card dan animasi beam yang sudah ada.
- Tidak menambah dependency, generator random, abstraction umum, atau perubahan pada shared `Card`.
- Reuse pola token yang sama untuk kedua badge nomor tanpa membuat komponen baru hanya untuk satu class recipe.

## Verifikasi

- Ikuti red-green TDD untuk CTA hover, arah geometry beam, entrance/hover card, dan badge nomor tab.
- Jalankan focused tests landing dan pulse beams, lalu seluruh test suite, lint, dan production build.
- Verifikasi landing pada desktop dan mobile: page identity, tidak blank, tanpa framework overlay, console sehat, tidak ada overflow/clipping, CTA tetap terbaca ketika hover, card merespons hover, beam bergerak menuju CTA, tab dapat dipilih, serta reduced motion tetap aman.
- In-app Browser adalah jalur QA utama. Jika tetap tidak tersedia, Playwright hanya digunakan setelah ada persetujuan fallback.

## Non-goals

- Tidak mengubah copy atau menambah section.
- Tidak membuat animasi mengikuti posisi cursor.
- Tidak membuat card privasi terlihat dapat diklik.
- Tidak mengubah timing autoplay vertical tabs.
- Tidak mengubah varian pulse beams pada halaman login.
