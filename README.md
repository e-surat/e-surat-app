# e-Surat — Yayasan JaRI

Sistem manajemen surat (surat masuk, surat keluar, disposisi, arsip, laporan) berbasis web.

## Teknologi

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- Supabase (PostgreSQL, Auth, Storage, RLS)

## Fitur

- Autentikasi & peran: Admin/TU, Pimpinan, Staf
- Surat Masuk & Surat Keluar (nomor surat keluar otomatis: `{urut}/JaRI-Sekr/{kode}/{bulan}/{tahun}`)
- Upload lampiran (PDF/gambar) ke Supabase Storage
- Disposisi berjenjang + notifikasi in-app
- Arsip dengan filter (cari, arah, status, rentang tanggal) + Export CSV
- Laporan rekap bulanan & per kategori

## Setup Lokal

1. Install dependency:

```bash
npm install
```

2. Salin `.env.example` menjadi `.env.local`, lalu isi:

```
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
```

3. Terapkan skema database: jalankan isi file pada `supabase/migrations/` (urut `0001` → `0005`) lewat Supabase SQL Editor, lalu `supabase/seed.sql`.

4. Jalankan dev server:

```bash
npm run dev
```

Buka http://localhost:3000.

## Membuat Akun Admin

1. Supabase → Authentication → Add user (email + password).
2. Table Editor → `profiles` → ubah kolom `role` menjadi `admin`.

## Deploy ke Vercel

1. Import repo ini di Vercel.
2. Set Environment Variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Deploy (Next.js terdeteksi otomatis).
