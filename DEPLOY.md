# Deploy ke Vercel + Neon Postgres

Lokal memakai SQLite. Production memakai Postgres (Neon). Schema Prisma sengaja tidak memakai fitur
khusus SQLite, jadi pindahnya cuma ganti provider.

> Catatan: paket gratis Vercel (Hobby) hanya untuk penggunaan non-komersial. Untuk usaha yang berjualan,
> pakai paket Pro.

## Cara paling mudah (dashboard Vercel)

1. Daftar di vercel.com dengan akun GitHub, lalu **Add New → Project** dan import repo ini.
2. Di Environment Variables isi `SESSION_SECRET` (hasil `openssl rand -base64 32`). Deploy pertama
   akan gagal karena database belum ada, itu normal.
3. Buka tab **Storage → Create Database → Neon**. Pilih region **Singapore**, paket **Free**, lalu
   hubungkan ke project. `DATABASE_URL` dan `DATABASE_URL_UNPOOLED` terisi otomatis.
4. **Settings → Functions → Region: Singapore (sin1)**.
5. **Deployments → Redeploy.** Build menjalankan `prisma migrate deploy` (membuat tabel) lalu `next build`.
6. Isi data awal sekali saja dari komputer: salin `DATABASE_URL_UNPOOLED` dari Vercel (Settings →
   Environment Variables) ke `.env` lokal, lalu jalankan `npm run db:seed`.
7. Buka website, masuk lewat `/login`, dan **ganti password** akun awal.

## Catatan
- Halaman publik (`/`, `/menu`, `/tentang`) di-render saat build lalu diperbarui tiap 60 detik, dan
  langsung diperbarui saat owner mengubah menu/pengaturan. Database harus bisa diakses saat build.
- Pembatasan percobaan login (5 kali salah = tunggu 5 menit) tersimpan di memori proses, jadi di
  serverless sifatnya best-effort. Untuk keamanan lebih, tambahkan rate limit (mis. Upstash) di `login/actions.ts`.
- Cadangan data: aktifkan backup/branching di Neon, dan ekspor laporan CSV berkala.
- Kalau nanti pindah ke Niagahoster Cloud/VPS: provider `mysql` atau tetap `postgresql`, jalankan
  `npm run build && npm start` dengan Node 20+ dan `DATABASE_URL` yang sesuai.
