# Setup Database di phpMyAdmin

## Lewat phpMyAdmin

1. Buka XAMPP Control Panel.
2. Klik Start pada Apache dan MySQL.
3. Buka browser ke `http://localhost/phpmyadmin`.
4. Klik tab SQL.
5. Buka file `sql/schema.sql`, salin semua isinya, lalu tempel ke tab SQL.
6. Klik Go.
7. Pastikan database `ddn_wallet` muncul dengan tabel:
   - `users`
   - `categories`
   - `transactions`
   - `budgets`
   - `reminders`

## Lewat MySQL Console

```sql
CREATE DATABASE IF NOT EXISTS ddn_wallet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE ddn_wallet;
SOURCE C:/path/ke/project/sql/schema.sql;
```

Jika memakai XAMPP default, `.env.local` bisa diisi:

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=ddn_wallet
DB_PORT=3306
SESSION_SECRET=ganti-dengan-random-secret-yang-panjang
```

Setelah database dibuat, jalankan:

```bash
npm run dev
```

Lalu buka `http://localhost:3000/register` untuk membuat akun pertama.
