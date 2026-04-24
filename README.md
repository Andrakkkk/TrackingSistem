# 🎓 UMM Alumni Tracking (Sistem Pelacakan Alumni Hibrida)

![UMM Alumni Tracking Banner](https://img.shields.io/badge/Status-Active-brightgreen) ![Version](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-orange)

Sistem Pelacakan Alumni cerdas berbasis web yang dirancang untuk menemukan, memvalidasi, dan mengelola rekam jejak alumni Universitas Muhammadiyah Malang (UMM). Sistem ini menggunakan **Pendekatan Hibrida**—menggabungkan keandalan **Algoritma Pakar Lokal** dan kecerdasan **Gemini Flash AI** untuk ekstraksi dan validasi data secara instan.

**Informasi Pengembang:**
* **Nama:** Leandra Chelsea Geovani Karyono
* **NIM:** 202310370311421
* **Kelas:** Rekayasa Kebutuhan D

---

## 🔗 Tautan Penting
* **Source Code Github:** [Andrakkkk/TrackingSistem](https://github.com/Andrakkkk/TrackingSistem)
* **Live Website:** [Tautan Live Akan Tersedia Setelah Deploy]

---

## 📖 Deskripsi Sistem

Aplikasi web ini merupakan implementasi dari perancangan arsitektur dan antarmuka untuk manajemen data alumni tingkat lanjut. Dirancang khusus untuk memproses volume data besar secara efisien, sistem ini secara otomatis menelusuri jejak alumni di dunia maya.

Sistem ini menggunakan dua metode pelacakan inti:
1. **Lacak Lokal (Algoritma Pakar):** Menggunakan logika validasi *rule-based* untuk mencocokkan kemiripan data, pola karir, dan pembobotan *scoring* secara internal, memastikan privasi data dan kecepatan pemrosesan tanpa bergantung pada API eksternal.
2. **Lacak AI (Gemini API):** Menggunakan *Natural Language Processing* (NLP) terdepan untuk mengevaluasi data semantik, mengekstrak profil dari berbagai *platform* sosial, dan memberikan tingkat kecocokan yang sangat akurat.

---

## 🚀 Fitur Unggulan

* **⚡ Otomatisasi Cerdas (*Background Processing*):** Proses muat ribuan data CSV, *Data Scraping* (simulasi ekstraksi profil media sosial pintar), dan Pelacakan Lokal berjalan secara otomatis di latar belakang menggunakan *Web Workers* sesaat setelah login. Tidak ada *lag* pada UI!
* **📊 Dashboard Analitik Komprehensif:** Menyajikan statistik *real-time*, grafik distribusi volume kelulusan, dan status pelacakan keseluruhan (menggunakan `Chart.js`).
* **🎯 Penilaian Kualitas Data (Data Quality Score):** Metrik interaktif yang mengukur *Coverage* (Cakupan), *Accuracy* (Akurasi), dan *Completeness* (Kelengkapan) dari hasil pelacakan sistem.
* **🔎 Pusat Disambiguasi Identitas:** Menampilkan tabel interaktif yang mendukung pencarian, penyaringan (*filtering*), pengurutan, serta **Aksi Massal** (*Bulk Actions*) seperti Lacak AI, Lacak Lokal, dan Scrapping Data serentak.
* **🌐 Ekstraksi Profil Dinamis:** Mampu menghasilkan profil sosial media target secara instan (LinkedIn, Instagram, Google Scholar, dll.) berdasarkan program studi dan nama alumni.
* **✅ Verifikasi Manual:** Alur peninjauan (Quality Control) bagi admin untuk menyetujui (Valid) atau menolak data yang meragukan.
* **💾 Export Data Terintegrasi:** Unduh hasil analisis langsung ke format `.CSV` dengan sekali klik.

---

## 💻 Teknologi yang Digunakan

* **Frontend:** HTML5, *Vanilla* JavaScript, CSS3
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (melalui CDN)
* **Database Lokal:** [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API) (untuk manajemen data luring dalam volume besar)
* **Charts:** [Chart.js](https://www.chartjs.org/)
* **AI Integration:** Google Gemini API
* **Icons:** FontAwesome

---

## 🛠️ Cara Menjalankan Secara Lokal (Instalasi)

Aplikasi ini dibangun menggunakan arsitektur *Client-side*, sehingga **tidak memerlukan instalasi *backend* server**. Sangat ringan dan mudah dijalankan!

1. **Clone Repository:**
   ```bash
   git clone https://github.com/Andrakkkk/TrackingSistem.git
   cd TrackingSistem
   ```

2. **Jalankan Aplikasi:**
   - Opsi 1: Cukup buka file `index.html` menggunakan browser modern (Chrome/Edge/Firefox).
   - Opsi 2 (Direkomendasikan): Gunakan ekstensi **Live Server** di VS Code untuk pengalaman interaktif yang lebih lancar.

3. **Login ke Sistem:**
   - **Username:** `admin`
   - **Password:** `umm123`
   > **Catatan:** Setelah login, sistem akan otomatis memuat file `Alumni 2000-2025.xlsx - Sheet1.csv` dari direktori lokal dan memproses data di latar belakang.

---

## 📖 Panduan Penggunaan Singkat

1. **Pantau Dashboard:** Setelah login, lihat pergerakan data di Dashboard. Grafik dan Skor Kualitas akan diperbarui secara *real-time* seiring pemrosesan data.
2. **Pusat Tracking:** Buka menu **Pusat Tracking**. Di sini Anda bisa menggunakan **Aksi Massal** untuk melacak ratusan alumni sekaligus menggunakan AI atau Lokal, atau melakukan *Scrapping Data* profil sosial media baru.
3. **Detail & Lacak Individual:** Klik baris nama alumni untuk melihat Detail Profil. Di dalam modal detail, Anda bisa melakukan pengecekan satu per satu.
4. **Export CSV:** Kapan saja, klik tombol **Export CSV** di menu navigasi kiri untuk menyimpan seluruh data pelacakan yang telah sukses teridentifikasi maupun yang ditolak.

---

*Dibuat untuk memenuhi tugas Daily Project Rekayasa Kebutuhan D Universitas Muhammadiyah Malang.*
