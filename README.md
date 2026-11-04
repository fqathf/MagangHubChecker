# MagangHub Checker (Personal Edition)

Alat inspeksi status lamaran dan eksplorasi lowongan magang nasional Kemnaker RI ([maganghub.kemnaker.go.id](https://maganghub.kemnaker.go.id)).

Aplikasi ini merupakan klon personal non-komersial dari platform sejenis, dibangun 100% gratis tanpa paywall, tanpa antrean buatan, dan tanpa penyimpanan data pengguna di server pihak ketiga (seluruh token dan riwayat disimpan secara lokal di browser melalui `localStorage`).

**Live Website (GitHub Pages):**  
[https://fqathf.github.io/MagangHubChecker/](https://fqathf.github.io/MagangHubChecker/)

---

## Fitur Utama

1. **Inspeksi Sinyal Kelolosan Dini (`selected_at`)**  
   Mendeteksi field timestamp `selected_at` pada respons API resmi Kemnaker yang menandakan bahwa mitra penyelenggara telah memilih berkas pelamar sebelum penetapan surat keputusan (SK) diumumkan.

2. **Deteksi Pembaruan Pasca-Wawancara (`updated_at`)**  
   Mendeteksi aktivitas pembaruan internal oleh tim seleksi mitra setelah sesi wawancara dilakukan.

3. **Status Verifikasi PDDIKTI & Dukcapil**  
   Menampilkan ringkasan status kelayakan peserta, perguruan tinggi, program studi, IPK, dan nomor ijazah yang tersinkronisasi dengan PDDIKTI.

4. **Eksplorasi Lowongan & Rasio Persaingan Live**  
   Menjelajahi katalog puluhan ribu lowongan aktif langsung dari API publik Kemnaker lengkap dengan rasio pelamar terhadap kuota (`total_applications / quantity_needed`), skor persaingan, dan silabus bulanan (`curriculums`).

5. **Multi-Akun Lokal & Inspeksi Raw JSON**  
   Dukungan penyimpanan beberapa sesi akun SIAPkerja secara lokal dan penampil payload JSON mentah langsung dari endpoint Kemnaker.

6. **100% Client-Side & Privat**  
   Tidak ada server backend perantara. Request HTTP dikirimkan langsung dari browser pengguna ke `https://api.kemnaker.go.id`.

---

## Panduan Mengambil Token Akses (`naco_access_token`)

Untuk memeriksa status lamaran akun Anda:

1. Buka dan masuk (login) ke portal resmi [maganghub.kemnaker.go.id](https://maganghub.kemnaker.go.id) menggunakan akun SIAPkerja Anda.
2. Buka **Chrome Developer Tools** dengan menekan tombol **F12** (atau klik kanan pada halaman lalu pilih **Inspect / Periksa**).
3. Pilih tab **Application** pada menu atas DevTools (jika tidak terlihat, klik tanda `>>`).
4. Pada panel sebelah kiri di bawah menu **Storage**, klik panah **Cookies** lalu klik `https://maganghub.kemnaker.go.id`.
5. Temukan baris dengan nama **`naco_access_token`**.
6. Klik ganda pada kolom **Value** dan salin seluruh teks token (teks panjang yang berawalan `eyJ...`).
7. Buka web MagangHub Checker, klik **+ Hubungkan Akun SIAPkerja**, tempelkan token tersebut, dan klik **Periksa Sesi & Simpan Akun**.

> **Catatan Teknis (Mengapa tidak bisa via Console?):**  
> Cookie `naco_access_token` dilindungi dengan atribut **`HttpOnly`** oleh server Kemnaker demi keamanan. Atribut ini membuat peramban secara otomatis melarang script JavaScript (`document.cookie`) di tab Console untuk membacanya. Oleh karena itu, token harus disalin manual melalui tab **Application > Cookies** atau melalui tab **Network** (klik salah satu request `api.kemnaker.go.id` &rarr; buka tab **Headers** &rarr; salin nilai `Authorization: Bearer eyJ...`).

---

## Pengembangan Lokal (Local Development)

```bash
# Clone repositori
git clone https://github.com/fqathf/MagangHubChecker.git
cd MagangHubChecker

# Pasang dependensi
npm install

# Jalankan server pengembangan
npm run dev

# Bangun versi statis untuk hosting
npm run build
```

Buka `http://localhost:3000` di peramban Anda.

---

## Lisensi

Dibuat untuk keperluan riset dan edukasi pribadi. Seluruh hak cipta data dan layanan resmi merupakan milik Kementerian Ketenagakerjaan Republik Indonesia (Kemnaker RI).
