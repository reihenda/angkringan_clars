-- Ganti foto menu favorit ke foto baru (berlisensi terbuka, lihat halaman /kredit-foto)
UPDATE "MenuItem" SET "imageUrl" = '/img/mie-goreng-telur.jpg' WHERE "name" = 'Mie Goreng Telur' AND "imageUrl" = '/img/mie-goreng.png';
UPDATE "MenuItem" SET "imageUrl" = '/img/nasi-goreng.jpg' WHERE "name" = 'Nasi Goreng Spesial' AND "imageUrl" = '/img/nasi-bungkus.png';
