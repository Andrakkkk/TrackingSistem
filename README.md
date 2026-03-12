# 🎓 UMM Alumni Tracking (Hybrid Tracking System)

![Status](https://img.shields.io/badge/Status-Completed-success)
![Platform](https://img.shields.io/badge/Platform-Web-blue)
![Tech Stack](https://img.shields.io/badge/Tech-HTML%20%7C%20Tailwind%20%7C%20Vanilla%20JS-orange)

Aplikasi web cerdas untuk melacak, memvalidasi, dan mengelola rekam jejak alumni Universitas Muhammadiyah Malang menggunakan pendekatan **Hibrida** (Algoritma Pakar Lokal dan Artificial Intelligence Gemini Flash).

## 👤 Informasi Pengembang
* **Nama:** Leandra Chelsea Geovani Karyono
* **NIM:** 202310370311421
* **Kelas:** Rekayasa Kebutuhan D

---

## 🔗 Tautan Penting
* **Source Code Github:** https://github.com/Andrakkkk/TrackingSistem.git
* **Live Website:** https://alumni-tracking-umm.netlify.app/

---

## 📖 Deskripsi Sistem
Sistem ini memfasilitasi admin untuk melakukan pelacakan data alumni di berbagai platform eksternal. Sistem dilengkapi dengan dua metode validasi pencocokan profil:
1. **Lacak Lokal (Algoritma Pakar):** Menggunakan logika validasi *rule-based* untuk mendeteksi anomali input, kemiripan string, variasi nama (alias), dan relevansi URL.
2. **Lacak AI (Gemini Flash API):** Menggunakan *Natural Language Processing* (NLP) untuk menganalisis dan memberikan argumen kontekstual terhadap kecocokan profil alumni.

## 🚀 Fitur Utama
1. **Pusat Trace (Tracking):** Eksekusi pencarian ganda (Lokal & AI) untuk mendapatkan skor relevansi profil kandidat.
2. **Verifikasi Manual:** Fitur bagi admin untuk meninjau ulang dan menetapkan/menolak profil dengan status ambigu.
3. **Laporan Trace (Dashboard):** Visualisasi data interaktif menggunakan Chart.js untuk memantau distribusi status kelulusan/pelacakan alumni.
4. **Export CSV:** Unduh laporan hasil pelacakan lengkap beserta alasan dari sistem.

---

## 🧪 Pengujian Aspek Kualitas Sistem

Berikut adalah hasil pengujian sistem berdasarkan skenario dan aspek kualitas perangkat lunak:

| ID | Skenario Pengujian | Aspek Kualitas | Hasil Aktual | Status |
| :---: | :--- | :--- | :--- | :---: |
| **01** | Input data target alumni via form HTML. | *Functional Suitability* | Data berhasil disimpan di *LocalStorage* dan muncul di tabel Pusat Trace. | ✅ PASS |
| **02** | Eksekusi "Lacak Lokal" pada tabel. | *Performance Efficiency* | Sistem memproses algoritma dan menghitung skor di bawah 1 detik tanpa membebani browser. | ✅ PASS |
| **03** | Eksekusi "Lacak AI" via integrasi Gemini. | *Reliability* | Sistem berhasil mengirim *prompt*, menerima JSON, dan mengubah status UI sesuai *response* AI. | ✅ PASS |
| **04** | Penanganan Error Limit API (429). | *Reliability* | Sistem memberikan pesan *fallback* (koneksi gagal) di UI alih-alih mengalami *crash* total. | ✅ PASS |
| **05** | Admin memverifikasi kandidat secara manual. | *Functional Suitability* | Menekan "Tetapkan/Tolak" berhasil mengubah status kandidat dan menyembunyikannya dari antrean verifikasi. | ✅ PASS |
| **06** | Merender visualisasi Laporan Trace. | *Usability* | *Doughnut chart* (Chart.js) tampil akurat, responsif, dan *tooltip* berfungsi saat kursor diarahkan. | ✅ PASS |
| **07** | Mengunduh hasil pelacakan. | *Functional Suitability* | File `.csv` terunduh dengan kolom format yang sesuai (termasuk kolom 'Metode Lacak'). | ✅ PASS |
| **08** | Menguji UI pada ukuran layar kecil/HP. | *Usability* | Tata letak (Tailwind CSS) beradaptasi menjadi format tumpuk vertikal dan tabel dapat di-*scroll* menyamping. | ✅ PASS |

---

## 🛠️ Cara Menjalankan Secara Lokal

Aplikasi ini berjalan di sisi Klien (Vanilla JS) menggunakan penyimpanan *LocalStorage*. Tidak diperlukan instalasi backend.

1. Lakukan kloning repository ini:
   ```bash
   git clone [MASUKKAN LINK GITHUB KAMU DI SINI]
   cd TrackingSistem

2.Buka file index.html menggunakan browser standar (Chrome/Edge/Firefox) atau jalankan melalui Live Server di VS Code.

3.Gunakan kredensial berikut untuk masuk ke sistem:

Username: admin

Password: umm123
