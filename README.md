# ToDoApp
ToDoApp adalah aplikasi manajemen tugas berbasis web yang memungkinkan pengguna untuk mengatur tugas harian mereka secara efektif. Aplikasi ini terintegrasi dengan **Google Calendar** untuk sinkronisasi jadwal dan **Google Authentication** untuk login yang aman.

## Fitur Utama
- **Manajemen Tugas**: Buat, baca, perbarui, dan hapus tugas dengan mudah.
- **Integrasi Google Calendar**: Secara otomatis menambahkan tugas ke kalender Google pengguna untuk manajemen waktu yang lebih baik.
- **Google Authentication**: Login aman menggunakan akun Google, menjaga privasi dan keamanan pengguna.
- **Tampilan Responsif**: Desain yang mendukung berbagai perangkat (desktop, tablet, dan ponsel).

## Teknologi yang Digunakan
- **Frontend**: HTML, CSS, dan JavaScript.
- **Backend**: Node.js dan Express.js.
- **Database**: (Opsional, tambahkan jika Anda menggunakan database, seperti MongoDB atau Firebase).
- **API**: Google Calendar API dan Google OAuth 2.0.

## Cara Menggunakan
1. Clone repositori ini:
   ```bash
   git clone https://github.com/ugihub/ToDoApp.git
   ```
2. Masuk ke direktori proyek:
   ```bash
   cd ToDoApp
   ```
3. Instal dependensi:
   ```bash
   npm install
   ```
4. Konfigurasikan file `.env` dengan kredensial Google API Anda:
   ```
   GOOGLE_CLIENT_ID=<client-id-anda>
   GOOGLE_CLIENT_SECRET=<client-secret-anda>
   REDIRECT_URI=<redirect-uri-anda>
   ```
5. Jalankan server:
   ```bash
   node server.js
   ```
6. Akses aplikasi di browser Anda pada `http://localhost:3000`.
