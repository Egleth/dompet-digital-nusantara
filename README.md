# Dompet Digital Nusantara Web

Personal Finance Management System berbasis Next.js dan MySQL untuk studi kasus PT Dompet Digital Nusantara.

## Scope Implementasi

- Login dan daftar akun terhubung ke tabel `users`.
- CRUD kategori untuk pemasukan dan pengeluaran.
- CRUD transaksi dengan filter tanggal, tipe, kategori, dan kata kunci.
- CRUD budget bulanan per kategori.
- CRUD reminder pembayaran atau target pengeluaran.
- Dashboard dan laporan ringkas dari data yang tersimpan di database.
- Tidak ada fallback bawaan di aplikasi. Jika database kosong, halaman menampilkan state kosong.

## Cara Menjalankan

1. Jalankan Apache dan MySQL dari XAMPP.
2. Buka `http://localhost/phpmyadmin`.
3. Import file `sql/schema.sql`.
4. Salin `.env.example` menjadi `.env.local`.
5. Sesuaikan kredensial database di `.env.local`.
6. Install dependency:

```bash
npm install
```

7. Jalankan aplikasi:

```bash
npm run dev
```

8. Buka `http://localhost:3000`, daftar akun baru, lalu mulai input kategori, transaksi, budget, dan reminder.

## Struktur Penting

- `app/` berisi halaman Next.js App Router dan server actions CRUD.
- `components/` berisi navigasi dan komponen kecil.
- `lib/db.js` berisi koneksi MySQL.
- `lib/auth.js` berisi autentikasi, password hashing, dan session cookie.
- `lib/finance.js` berisi query dan perhitungan ringkasan keuangan.
- `sql/schema.sql` berisi struktur database.
- `docs/setup-phpmyadmin.md` berisi langkah phpMyAdmin dan perintah MySQL.
