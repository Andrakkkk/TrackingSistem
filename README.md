

---

```markdown
# 🎓 UMM Alumni Trace (Sistem Pelacakan Alumni Hibrida)

Sistem Pelacakan Alumni cerdas berbasis web yang dirancang untuk menemukan, memvalidasi, dan mengelola rekam jejak alumni Universitas Muhammadiyah Malang (UMM) menggunakan pendekatan Hibrida (Algoritma Pakar Lokal dan Gemini Flash AI).

**Informasi Pengembang:**
* [cite_start]**Nama:** Leandra Chelsea Geovani Karyono [cite: 1]
* [cite_start]**NIM:** 202310370311421 [cite: 2]
* [cite_start]**Kelas:** Rekayasa Kebutuhan D [cite: 3]

---

## 🔗 Tautan Penting
* **Source Code Github:** [Masukkan Link Repository Github Anda Di Sini]
* **Live Website / Publish Web:** [Masukkan Link Web Hosting (misal: Vercel/Netlify/Github Pages) Di Sini]

---

## 📖 Deskripsi Sistem
Aplikasi web ini merupakan implementasi dari perancangan arsitektur dan antarmuka pada Daily Project sebelumnya. [cite_start]Sistem Pelacakan Alumni ini dirancang agar Admin dapat memasukkan data dasar alumni [cite: 240, 258][cite_start], membuat profil pencarian [cite: 245, 258][cite_start], dan melakukan ekstraksi informasi serta disambiguasi identitas dari berbagai sumber eksternal (seperti LinkedIn, Google Scholar, GitHub, dll)[cite: 249, 251, 258]. 

Sistem ini kini dilengkapi dengan dua metode pelacakan:
1. **Lacak Lokal (Algoritma Pakar):** Menggunakan logika validasi *rule-based* untuk mencocokkan kemiripan string, alias, dan URL.
2. **Lacak AI (Gemini API):** Menggunakan NLP (Natural Language Processing) untuk mengevaluasi dan memberikan skor relevansi secara otomatis.

---

## 🚀 Fitur Utama
1. [cite_start]**Input Data Alumni:** Admin memasukkan data alumni ke dalam sistem untuk ditargetkan[cite: 240, 258].
2. [cite_start]**Pusat Pelacakan (Tracking):** Sistem menjalankan proses pencarian dan disambiguasi identitas[cite: 244, 251, 258]. Terdapat opsi eksekusi *Lacak AI* maupun *Lacak Lokal*.
3. [cite_start]**Verifikasi Manual:** Fitur bagi admin untuk memverifikasi (Tetapkan/Tolak) jika data kandidat masih meragukan (Skor 50-80%)[cite: 241, 258].
4. [cite_start]**Lihat Laporan Alumni:** Dashboard interaktif dengan grafik Chart.js untuk melihat laporan status kelulusan/pelacakan alumni[cite: 243, 258].
5. [cite_start]**Export CSV:** Sistem menyimpan hasil pelacakan ke database lokal dan dapat diunduh[cite: 252, 258].

---

## 🧪 Pengujian Sistem (Kualitas Perangkat Lunak)

Berikut adalah hasil pengujian sistem berdasarkan aspek kualitas yang telah ditentukan pada fase desain (Daily Project 2):

| ID Test | Skenario Pengujian | Aspek Kualitas | Hasil yang Diharapkan | Hasil Aktual | Status |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **TC-01** | [cite_start]Admin memasukkan data alumni melalui form[cite: 240, 258]. | *Functional Suitability* | Data berhasil disimpan ke LocalStorage dan muncul di tabel Pusat Pelacakan dengan status "Belum Dilacak". | Data berhasil disimpan dan dirender di tabel. | ✅ PASS |
| **TC-02** | Menjalankan "Lacak Lokal" pada data kandidat. | *Performance Efficiency* | Sistem memproses algoritma pencocokan dalam waktu < 1 detik dan memberikan skor relevansi. | Perhitungan selesai dalam ~600ms, UI terupdate. | ✅ PASS |
| **TC-03** | Menjalankan "Lacak AI" via API Gemini. | *Functional Suitability* & *Reliability* | Sistem mengirim prompt ke API, menunggu respons, dan mengurai JSON balasan menjadi skor valid. | Data API berhasil diekstrak dan mengubah skor & status. | ✅ PASS |
| **TC-04** | Menguji toleransi batasan API (Error 429). | *Reliability* | Sistem tidak *crash* jika limit API Google habis, melainkan memberikan pesan fallback yang jelas. | Sistem menangkap error `catch` dan menampilkan pesan koneksi gagal di tabel. | ✅ PASS |
| **TC-05** | [cite_start]Admin memverifikasi kandidat di menu "Verifikasi Manual"[cite: 241, 258]. | *Functional Suitability* | Mengklik tombol "Tetapkan" atau "Tolak" mengubah status menjadi Teridentifikasi/Tidak Cocok tanpa mengubah skor asli. | Status berubah, kartu hilang dari daftar verifikasi, keterangan tersimpan. | ✅ PASS |
| **TC-06** | [cite_start]Mengakses Dashboard / Laporan Alumni[cite: 243, 258]. | *Usability* | Grafik donat (Chart.js) me-render proporsi status dengan akurat sesuai jumlah data. | Grafik termuat dengan benar, responsif, dan *tooltip* berfungsi. | ✅ PASS |
| **TC-07** | Mengunduh hasil laporan (Export CSV). | *Functional Suitability* | Sistem menghasilkan file `.csv` yang berisi semua parameter kandidat termasuk Alasan Sistem. | File terunduh dengan format pemisah koma (comma-separated) yang benar. | ✅ PASS |
| **TC-08** | Menguji UI pada ukuran layar Mobile/HP. | *Usability* | Tampilan responsif, menu sidebar tersembunyi atau tabel dapat di-scroll menyamping secara rapi. | Elemen menyesuaikan grid Tailwind CSS dengan sempurna. | ✅ PASS |

---

## 🛠️ Cara Menjalankan Secara Lokal (Instalasi)

Karena aplikasi ini berjalan di sisi Klien (Front-end Vanilla JS) menggunakan *LocalStorage*, tidak diperlukan instalasi server *backend* yang rumit.

1. **Clone Repository:**
   ```bash
   git clone [MASUKKAN LINK GITHUB ANDA DI SINI]
   cd umm-alumni-trace

```

2. **Jalankan Aplikasi:**
* Buka file `index.html` langsung di browser Anda (Chrome/Firefox/Edge).
* ATAU jalankan melalui ekstensi *Live Server* di VS Code.


3. **Kredensial Login:**
* **Username:** admin
* **Password:** umm123



---

*Dibuat untuk memenuhi tugas Daily Project Rekayasa Kebutuhan D Universitas Muhammadiyah Malang.*

```

**Tips:** Jangan lupa untuk mengubah teks `[Masukkan Link Repository Github Anda Di Sini]` dan `[Masukkan Link Web Hosting Di Sini]` di baris atas setelah kamu mem-publish websitenya (misalnya menggunakan Vercel atau GitHub Pages).

```
