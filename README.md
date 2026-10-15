# Clars Angkringan & Billiard

Website customer + sistem kasir dan stok dalam satu project Next.js.

- **Website publik**: beranda, menu lengkap, tentang kami (`/`, `/menu`, `/tentang`)
- **Kasir & stok** (perlu login): `/login` → `/admin`

## Menjalankan lokal

```bash
npm install
cp .env.example .env       # isi DATABASE_URL (Neon, branch dev) dan SESSION_SECRET
npx prisma migrate deploy  # buat tabel di database
npm run db:seed            # isi menu Clars, bahan, resep, meja, dan akun awal
npm run dev                # http://localhost:3000
```

Akun awal ada di `prisma/seed.ts` (owner dan kasir). **Ganti password setelah login pertama**
(menu Password di sidebar atau Pengaturan → Akun). Database memakai PostgreSQL (Neon).

## Fitur

| Area | Isi |
| --- | --- |
| Kasir | Pilih menu, catatan per item, dine-in/bungkus, simpan pesanan aktif, bayar tunai/QRIS/transfer, split bill, diskon, kembalian, struk cetak (58mm) |
| Billiard | Mulai/stop sesi per meja dengan timer, tagihan dibulatkan per 15 menit, pesanan makanan ditambah ke meja yang sedang main, **min charge Rp150.000 = gratis 1 jam** otomatis |
| Stok | Bahan baku + stok minimum, barang masuk, stok opname, barang terbuang, riwayat pergerakan, supplier, **resep per menu** (stok berkurang otomatis saat terjual, kembali saat pesanan dibatalkan) |
| Menu | Owner edit harga, tandai habis, favorit, tambah/hapus. Langsung tampil di kasir dan website |
| Laporan | Omzet per hari, menu terlaris, metode bayar, per kasir, export CSV (buka di Excel) |
| Pengaturan | Info toko dan jam buka, aturan billiard, meja, akun user |
| Role | **Owner**: semua fitur. **Kasir**: kasir, billiard, riwayat pesanan, lihat stok |

Website publik membaca menu dan status meja (kosong/dipakai) langsung dari database, jadi tidak perlu diedit dua kali.

## Struktur

```
prisma/schema.prisma      model database
prisma/seed.ts            data awal (menu dari poster)
src/app/(site)/           website publik
src/app/admin/            kasir, billiard, stok, menu, laporan, pengaturan
src/lib/actions/          server action (semua mutasi, divalidasi di server)
src/lib/billing.ts        aturan tarif billiard dan min charge
src/lib/auth.ts           sesi login (cookie JWT httpOnly)
```

## Yang perlu diganti sebelum live

1. Alamat, nomor WhatsApp, link Maps, jam buka: **Admin → Pengaturan** (sekarang masih contoh).
2. Foto di `public/img/` di-crop dari poster menu, resolusinya rendah. Ganti dengan foto asli
   (nama file sama, atau ubah path di kode). Foto menu per item bisa diisi lewat Kelola Menu.
3. Teks visi/misi di `src/app/(site)/tentang/page.tsx` adalah contoh.
4. Isi rekening dan keterangan QRIS di Pengaturan.
5. `SESSION_SECRET` di `.env` production harus string acak panjang.

Panduan deploy: lihat [DEPLOY.md](DEPLOY.md).
