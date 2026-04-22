// ==========================================
// WEB WORKER UNTUK MEMPROSES FILE CSV DI BACKGROUND
// ==========================================
// Worker ini bertugas untuk:
// 1. Mengambil file CSV dari URL yang diberikan.
// 2. Mem-parsing teks CSV menjadi objek data.
// 3. Mengecek duplikasi data dengan data yang sudah ada (dikirim dari main thread).
// 4. Mengirimkan progres dan hasil akhir kembali ke main thread.
// Ini mencegah UI utama menjadi "freeze" atau "lemot" saat memproses file besar.

self.onmessage = async function(e) {
    if (e.data.command === 'start') {
        const { fileName, existingAlumniNIMs, existingAlumniNames } = e.data;
        
        try {
            // Langkah 1: Ambil file
            const response = await fetch(fileName);
            if (!response.ok) {
                throw new Error(`Gagal mengunduh file (status: ${response.status})`);
            }
            const text = await response.text();
            
            // Langkah 2: Parsing CSV
            const rows = text.split('\n').map(row => row.trim()).filter(row => row);
            
            if (rows.length < 2) {
                self.postMessage({ type: 'error', message: 'File CSV kosong atau hanya berisi header.' });
                return;
            }

            rows.shift(); // Hapus baris header
            
            const data = rows.map(row => row.split(',').map(cell => cell.trim().replace(/"/g, '')));
            
            const newAlumni = [];
            let successCount = 0;

            // Langkah 3: Siapkan set untuk pengecekan duplikat yang efisien (O(1) lookup)
            const existingNIMSet = new Set(existingAlumniNIMs);
            const existingNameSet = new Set(existingAlumniNames.map(name => name.toLowerCase()));

            for (let i = 0; i < data.length; i++) {
                const row = data[i];
                const tanggalLulus = row[3] || "";
                // Ekstrak tahun lulus dari kolom Tanggal Lulus (misal: "1 Juli 2000" → 2000)
                const tahunLulusMatch = tanggalLulus.match(/\b(\d{4})\b/);
                const tahunLulus = tahunLulusMatch ? parseInt(tahunLulusMatch[1]) : 0;

                const dataObj = {
                    nama: row[0] || "",
                    nim: row[1] || "",
                    tahun_masuk: parseInt(row[2]) || 0, // Tahun Masuk
                    tahun: tahunLulus,                  // Tahun Lulus (dari Tanggal Lulus)
                    tanggal_lulus: tanggalLulus,
                    fakultas: row[4] || "",
                    prodi: row[5] || "",
                    variasi: "",
                    kota: "",
                    platform: "",
                    url: "",
                    email: "",
                    phone: "",
                    workplace: "",
                    workplace_address: "",
                    position: "",
                    employment_type: "",
                    workplace_social_media: "",
                    social_media: { linkedin: "", ig: "", fb: "", tiktok: "" },
                    status: "Belum Dilacak",
                    score: 0,
                    alasan_ai: "",
                    metode_lacak: ""
                };

                // Cek duplikasi dengan data yang sudah ada DAN data dari dalam CSV itu sendiri
                const nimExists = dataObj.nim && existingNIMSet.has(dataObj.nim);
                const nameExists = existingNameSet.has(dataObj.nama.toLowerCase());

                if (!nimExists && !nameExists && dataObj.nama) {
                    newAlumni.push(dataObj);
                    successCount++;
                    // Tambahkan ke set agar tidak ada duplikat dari dalam file CSV yang sama
                    if (dataObj.nim) existingNIMSet.add(dataObj.nim);
                    existingNameSet.add(dataObj.nama.toLowerCase());
                }

                // Langkah 4: Kirim progres setiap 100 baris
                if ((i + 1) % 100 === 0 || i === data.length - 1) {
                    self.postMessage({ type: 'progress', processed: i + 1, total: data.length });
                }
            }

            // Kirim hasil akhir
            self.postMessage({ type: 'done', newAlumni, successCount, totalRows: data.length });

        } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};