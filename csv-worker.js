// ==========================================
// WEB WORKER UNTUK MEMPROSES FILE CSV DI BACKGROUND
// ==========================================
// Worker ini bertugas untuk:
// 1. Mengambil file CSV dari URL yang diberikan.
// 2. Mem-parsing teks CSV menjadi objek data.
// 3. Mengecek duplikasi data dengan data yang sudah ada (dikirim dari main thread).
// 4. Mengirimkan progres dan hasil akhir kembali ke main thread.
// Ini mencegah UI utama menjadi "freeze" atau "lemot" saat memproses file besar.

// ==========================================
// PARSER CSV YANG BENAR (handle quoted fields)
// ==========================================
// Menangani kasus seperti: "Ahmad, S.Pd",12345,2020,"Teknik, Informatika"
function parseCSVRow(row) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < row.length; i++) {
        const char = row[i];

        if (char === '"') {
            if (inQuotes && row[i + 1] === '"') {
                // Escaped quote ("") → tambahkan satu tanda kutip
                current += '"';
                i++;
            } else {
                // Toggle mode quoted
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            // Koma di luar quotes → pemisah kolom
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim()); // Kolom terakhir
    return result;
}

// ==========================================
// SPLIT BARIS CSV (handle quoted newlines)
// ==========================================
function splitCSVRows(text) {
    const rows = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (char === '"') {
            if (inQuotes && text[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
                current += char;
            }
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            // Newline di luar quotes → akhir baris
            if (char === '\r' && text[i + 1] === '\n') i++; // skip \r\n
            const trimmed = current.trim();
            if (trimmed) rows.push(trimmed);
            current = '';
        } else {
            current += char;
        }
    }
    const trimmed = current.trim();
    if (trimmed) rows.push(trimmed);
    return rows;
}

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
            
            // Langkah 2: Parsing CSV dengan parser yang benar (handle quoted fields)
            const rows = splitCSVRows(text);
            
            if (rows.length < 2) {
                self.postMessage({ type: 'error', message: 'File CSV kosong atau hanya berisi header.' });
                return;
            }

            rows.shift(); // Hapus baris header
            
            const totalRows = rows.length;
            let successCount = 0;

            // Langkah 3: Siapkan set untuk pengecekan duplikat yang efisien (O(1) lookup)
            const existingNIMSet = new Set(existingAlumniNIMs);
            const existingNameSet = new Set(existingAlumniNames.map(name => name.toLowerCase()));

            // Kirim data dalam BATCH agar tidak ada satu transfer besar yang freeze UI
            const BATCH_SIZE = 5000;
            let batchBuffer = [];

            for (let i = 0; i < rows.length; i++) {
                const row = parseCSVRow(rows[i]);

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

                // Cek duplikasi HANYA terhadap data yang sudah ada sebelumnya di sistem
                // (dikirim dari main thread via existingAlumniNIMs).
                // Sesama baris dalam CSV yang sedang dimuat TIDAK saling memfilter,
                // agar semua data dari file CSV resmi termuat lengkap.
                let isDuplicate = false;
                if (dataObj.nim) {
                    isDuplicate = existingNIMSet.has(dataObj.nim);
                } else if (dataObj.nama) {
                    isDuplicate = existingNameSet.has(dataObj.nama.toLowerCase());
                }

                if (!isDuplicate && dataObj.nama) {
                    batchBuffer.push(dataObj);
                    successCount++;
                    // TIDAK menambah ke existingNIMSet/existingNameSet di sini
                    // agar baris sesama CSV tidak saling memfilter
                }

                // Kirim progres dan batch data setiap BATCH_SIZE baris
                if (batchBuffer.length >= BATCH_SIZE || i === rows.length - 1) {
                    self.postMessage({
                        type: 'batch',
                        batch: batchBuffer,
                        processed: i + 1,
                        total: totalRows
                    });
                    batchBuffer = [];
                }
            }

            // Kirim sinyal selesai
            self.postMessage({ type: 'done', successCount, totalRows });

        } catch (error) {
            self.postMessage({ type: 'error', message: error.message });
        }
    }
};