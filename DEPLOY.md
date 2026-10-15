# Deploy ke Vercel + Neon Postgres

Lokal memakai SQLite. Production memakai Postgres (Neon). Schema Prisma sengaja tidak memakai fitur
khusus SQLite, jadi pindahnya cuma ganti provider.

> Catatan: paket gratis Vercel (Hobby) hanya untuk penggunaan non-komersial. Untuk usaha yang berjualan,
> pakai paket Pro.

## 1. Buat database Neon

1. Daftar di neon.tech, buat project, pilih region **Singapore**.
2. Salin connection string (`postgresql://...?sslmode=require`).

## 2. Ganti provider ke Postgres

Di `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Migrasi SQLite tidak bisa dipakai di Postgres, jadi buat ulang dari awal (data lokal tidak ikut):

```bash
rm -rf prisma/migrations
DATABASE_URL="postgresql://..." npx prisma migrate dev --name init
DATABASE_URL="postgresql://..." npm run db:seed
```

Commit folder `prisma/migrations` yang baru.

## 3. Deploy ke Vercel

1. Push project ke GitHub, lalu Import di vercel.com.
2. Environment Variables (Production dan Preview):
   - `DATABASE_URL` = connection string Neon
   - `SESSION_SECRET` = hasil `openssl rand -base64 32`
3. Build Command: `prisma migrate deploy && next build`
4. Settings → Functions → Region: **Singapore (sin1)**, supaya dekat dengan database dan pengguna.
5. Deploy. Login dengan akun hasil seed, lalu **ganti password**.

Domain `.id` dari Niagahoster tetap bisa dipakai: arahkan DNS (A/CNAME) sesuai petunjuk Vercel.

## Catatan

- Halaman publik (`/`, `/menu`, `/tentang`) di-render saat build lalu diperbarui tiap 60 detik, dan
  langsung diperbarui saat owner mengubah menu/pengaturan. Database harus bisa diakses saat build.
- Pembatasan percobaan login (5 kali salah = tunggu 5 menit) tersimpan di memori proses, jadi di
  serverless sifatnya best-effort. Untuk keamanan lebih, tambahkan rate limit (mis. Upstash) di `login/actions.ts`.
- Cadangan data: aktifkan backup/branching di Neon, dan ekspor laporan CSV berkala.
- Kalau nanti pindah ke Niagahoster Cloud/VPS: provider `mysql` atau tetap `postgresql`, jalankan
  `npm run build && npm start` dengan Node 20+ dan `DATABASE_URL` yang sesuai.
