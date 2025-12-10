# Monthly Income & Outcome Tracker

Aplikasi untuk mencatat pemasukan dan pengeluaran bulanan dengan Next.js dan Supabase.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Buat file `.env.local` di root project:
```bash
cp .env.example .env.local
```
atau copy isi dari `.env.example` ke `.env.local`

3. Jalankan migration di Supabase:
   - Buka Supabase Dashboard: https://supabase.com/dashboard
   - Pilih project Anda
   - Masuk ke SQL Editor
   - Copy isi file `supabase/migrations/20250131_create_users_table.sql`
   - Paste dan jalankan di SQL Editor

4. Jalankan development server:
```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser.

## Migration

File migration ada di `supabase/migrations/20250131_create_users_table.sql`. 

Untuk menjalankan migration:
1. Buka Supabase Dashboard
2. Pilih project
3. Masuk ke SQL Editor
4. Copy dan paste SQL dari file migration
5. Klik Run

## Fitur

- User Management (Register, Login, Logout)
- Pencatatan Income & Outcome (akan ditambahkan)
