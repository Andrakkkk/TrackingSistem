// ==========================================
// PLUGIN CHART.JS (Untuk teks di tengah Donut)
// ==========================================
const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
        if (chart.config.options.elements && chart.config.options.elements.center) {
            const ctx = chart.ctx;
            const centerConfig = chart.config.options.elements.center;
            
            ctx.save();
            const centerX = (chart.chartArea.left + chart.chartArea.right) / 2;
            const centerY = (chart.chartArea.top + chart.chartArea.bottom) / 2;

            ctx.font = "bold 2.5rem 'Poppins', sans-serif";
            ctx.fillStyle = "#1f2937"; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(centerConfig.text, centerX, centerY - 10);

            ctx.font = "500 0.85rem 'Poppins', sans-serif";
            ctx.fillStyle = "#6b7280"; 
            ctx.fillText(centerConfig.label, centerX, centerY + 25);
            
            ctx.restore();
        }
    }
};

Chart.register(centerTextPlugin);

// ==========================================
// INISIALISASI DATA DARI LOCALSTORAGE
// ==========================================
let alumni = JSON.parse(localStorage.getItem("alumni")) || [];

// Tambahkan data dummy jika kosong untuk testing
if (alumni.length === 0) {
    alumni = [
        {
            nim: "12345678",
            nama: "Ahmad Rizki",
            variasi: "Rizki Ahmad",
            prodi: "Teknik Informatika",
            tahun: 2020,
            kota: "Malang",
            platform: "",
            url: "",
            email: "ahmad.rizki@email.com",
            phone: "081234567890",
            workplace: "PT. Tech Solutions",
            workplace_address: "Jl. Sudirman No. 123, Malang",
            position: "Software Engineer",
            employment_type: "Full-time",
            workplace_social_media: "",
            social_media_platform: "",
            social_media_url: "",
            social_media: { linkedin: "", ig: "", fb: "", tiktok: "" },
            status: "Teridentifikasi",
            score: 85,
            alasan_ai: "Data lengkap dan akurat",
            metode_lacak: "AI"
        }
    ];
    saveData(); // Simpan data dummy
}

let myChart = null;
let volumeChart = null;

function updateSidebarSliderValue() {
    const slider = document.getElementById('sidebarDataLimit');
    const value = document.getElementById('sidebarSliderValue');
    if (slider && value) {
        value.textContent = slider.value;
    }
}

function showLoadingProgress(message) {
    // Buat atau update loading overlay
    let progressDiv = document.getElementById('loadingProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'loadingProgress';
        progressDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        progressDiv.innerHTML = `
            <div class="bg-white rounded-lg p-6 max-w-sm mx-4 text-center">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-umm mx-auto mb-4"></div>
                <p class="text-gray-700" id="loadingMessage">${message}</p>
            </div>
        `;
        document.body.appendChild(progressDiv);
    } else {
        document.getElementById('loadingMessage').textContent = message;
    }
}

function hideLoadingProgress() {
    const progressDiv = document.getElementById('loadingProgress');
    if (progressDiv) {
        progressDiv.remove();
    }
} 

// ==========================================
// FUNGSI UNTUK FETCH DATA DARI GOOGLE SHEETS VIA APPS SCRIPT DENGAN LIMIT
// ==========================================
async function loadDataFromSpreadsheet(limit = 10) {
    const appsScriptUrl = `https://script.google.com/macros/s/AKfycbzSiNLbxDnYd1YoqJdIEelnt-Da0Z-t97x7rErbl6QM1VyfQVCgze9Owg-YlIoQDCjslg/exec?limit=${limit}`;

    // Tampilkan loading indicator untuk semua tombol load
    const loadButtons = document.querySelectorAll('button[onclick*="loadDataFromSpreadsheet"], #sidebarLoadButton');
    const originalTexts = [];
    const originalDisabled = [];

    loadButtons.forEach((btn, index) => {
        originalTexts[index] = btn.innerHTML;
        originalDisabled[index] = btn.disabled;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-1"></i>Loading...';
        btn.disabled = true;
        btn.style.opacity = '0.7';
    });

    // Tampilkan progress indicator
    showLoadingProgress(`Memuat ${limit} data alumni...`);

    let successCount = 0;
    try {
        const response = await fetch(appsScriptUrl);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Update progress
        showLoadingProgress(`Memproses ${data.length} data...`);

        // Process data dengan batching untuk menghindari freeze
        for (let i = 0; i < data.length; i++) {
            const row = data[i];

            // Row adalah array: [Nama Lulusan, NIM, Tahun Masuk, Tanggal Lulus, Fakultas, Program Studi]
            const dataObj = {
                nama: row[0] || "",
                nim: row[1] || "",
                tahun: parseInt(row[2]) || 0, // Tahun Masuk
                tanggal_lulus: row[3] || "",
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
                social_media: {
                    linkedin: "",
                    ig: "",
                    fb: "",
                    tiktok: ""
                },
                status: "Belum Dilacak",
                score: 0,
                alasan_ai: "",
                metode_lacak: ""
            };

            // Cek jika sudah ada berdasarkan NIM atau nama
            const existing = alumni.find(a => (dataObj.nim && a.nim === dataObj.nim) || a.nama.toLowerCase() === dataObj.nama.toLowerCase());
            if (!existing && dataObj.nama) {
                alumni.push(dataObj);
                successCount++;
            }

            // Batch processing - save setiap 5 data untuk smooth loading
            if ((i + 1) % 5 === 0) {
                saveData();
                render();
                showLoadingProgress(`Memproses ${i + 1}/${data.length} data...`);
                await new Promise(resolve => setTimeout(resolve, 50)); // Tiny delay agar UI responsif
            }
        }

        saveData();
        render();

        // Reset semua tombol load
        loadButtons.forEach((btn, index) => {
            btn.innerHTML = originalTexts[index];
            btn.disabled = originalDisabled[index];
            btn.style.opacity = '1';
        });

        hideLoadingProgress();
        alert(`Data berhasil dimuat!\nTotal: ${data.length} baris\nBaru ditambah: ${successCount} data`);
    } catch (error) {
        console.error("Error loading via Apps Script:", error);

        // Reset semua tombol load
        loadButtons.forEach((btn, index) => {
            btn.innerHTML = originalTexts[index];
            btn.disabled = originalDisabled[index];
            btn.style.opacity = '1';
        });

        hideLoadingProgress();
        alert("Gagal memuat data. Error: " + error.message);
    }
}

// Panggil loadDataFromSpreadsheet saat inisialisasi jika belum ada data
// if (alumni.length === 0) {
//     loadDataFromSpreadsheet();
// } 

// ==========================================
// TAHAP 1: INPUT DATA
// ==========================================
const form = document.getElementById("form");
if (form) {
    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const socialPlatform = document.getElementById("socialMediaPlatform").value;
        const socialUrl = document.getElementById("socialMediaUrl").value || "";
        const data = {
            nama: document.getElementById("nama").value,
            variasi: document.getElementById("variasi").value,
            prodi: document.getElementById("prodi").value,
            tahun: parseInt(document.getElementById("tahun").value),
            kota: document.getElementById("kota").value,
            platform: document.getElementById("platform").value,
            url: document.getElementById("urlProfil").value,
            social_media_platform: socialPlatform,
            social_media_url: socialUrl,
            email: document.getElementById("email").value || "",
            phone: document.getElementById("phone").value || "",
            workplace: document.getElementById("workplace").value || "",
            workplace_address: document.getElementById("workplace_address").value || "",
            position: document.getElementById("position").value || "",
            employment_type: document.getElementById("employment_type").value || "",
            status: "Belum Dilacak",
            score: 0,
            alasan_ai: "",
            metode_lacak: "" // Menyimpan histori metode ("AI" atau "Lokal")
        };

        alumni.push(data);
        saveData();
        form.reset();
        showPage('tracking'); 
    });
}

function saveData() {
    localStorage.setItem("alumni", JSON.stringify(alumni));
    render();
}

// ==========================================
// FUNGSI PELACAKAN LOKAL (LOGIKA PAKAR)
// ==========================================
function isNgawur(text) {
    if (!text) return false;
    let str = text.replace(/\s/g, '').toLowerCase(); 
    
    if (str.length <= 3) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(str)) return true;
    if (/(.)\1{3,}/.test(str)) return true;
    if (!/[aiueo]/.test(str)) return true;
    
    return false;
}

function isAliasMasukAkal(namaAsli, alias) {
    if (!alias) return true; 
    
    let asliLower = namaAsli.toLowerCase();
    let aliasParts = alias.toLowerCase().split(' ');
    
    for (let part of aliasParts) {
        if (part.length > 2 && asliLower.includes(part)) return true;
        if (part.length <= 2) return true;
    }
    return false; 
}

function isUrlRelevan(nama, url) {
    if (!url) return false;
    let urlLower = url.toLowerCase();
    let namaParts = nama.toLowerCase().split(' ');
    
    for (let part of namaParts) {
        if (part.length > 2 && urlLower.includes(part)) return true;
    }
    return false; 
}

function hitungScore(a) {
    let score = 0;

    if (a.tahun > 2027) return 0; 
    if (isNgawur(a.nama) || isNgawur(a.kota)) return 0;

    if (a.nama) score += 20;
    
    if (a.variasi && a.variasi.trim() !== "") {
        if (isAliasMasukAkal(a.nama, a.variasi)) {
            score += 10;
        }
    }

    if (a.kota && a.kota.trim() !== "") score += 15;

    const prodiLower = a.prodi.toLowerCase();
    if (prodiLower.includes("informatika") || prodiLower.includes("sistem") || prodiLower.includes("komputer") || prodiLower.includes("it")) {
        score += 15;
    }

    let now = new Date().getFullYear();
    if (a.tahun <= now) score += 10;

    if (a.platform && a.url && (a.url.startsWith("http") || a.url.startsWith("www"))) {
        if (isUrlRelevan(a.nama, a.url) || isUrlRelevan(a.variasi, a.url)) {
            score += 30; 
        } else {
            score += 10; 
        }
    }

    if (a.email && a.email.includes("@")) {
        const emailLower = a.email.toLowerCase();
        const nameMatched = a.nama.toLowerCase().split(' ').some(part => part.length > 2 && emailLower.includes(part));
        score += nameMatched ? 12 : 6;
    }

    if (a.phone && /^\+?[0-9]{8,15}$/.test(a.phone.replace(/\s|-/g, ''))) {
        score += 10;
    }

    if (a.workplace && a.workplace.trim() !== "") score += 10;
    if (a.position && a.position.trim() !== "") score += 10;
    if (a.employment_type && ["PNS", "Swasta", "Wirausaha"].includes(a.employment_type)) score += 6;
    if (a.workplace_address && a.workplace_address.trim() !== "") score += 5;
    if (a.workplace_social_media && (a.workplace_social_media.startsWith("http") || a.workplace_social_media.startsWith("www"))) score += 8;
    
    const socialCount = [a.social_media?.linkedin, a.social_media?.ig, a.social_media?.fb, a.social_media?.tiktok].filter(Boolean).length;
    score += Math.min(socialCount * 5, 20);

    if (a.social_media_platform && a.social_media_url && (a.social_media_url.startsWith("http") || a.social_media_url.startsWith("www"))) {
        if (isUrlRelevan(a.nama, a.social_media_url) || isUrlRelevan(a.variasi, a.social_media_url)) {
            score += 8;
        } else {
            score += 4;
        }
    }

    return score > 100 ? 100 : score;
}

function lacakLokal(i) {
    alumni[i].status = "Menganalisis...";
    alumni[i].alasan_ai = "Memproses melalui Algoritma Pakar Lokal...";
    alumni[i].metode_lacak = "Lokal"; // Tandai ini proses lokal
    saveData();
    
    setTimeout(() => {
        let score = hitungScore(alumni[i]);
        alumni[i].score = score;
        alumni[i].alasan_ai = "Dianalisis menggunakan algoritma pencocokan statis (Sistem Lokal non-AI).";

        if (score > 80) {
            alumni[i].status = "Teridentifikasi"; 
        } else if (score >= 50 && score <= 80) {
            alumni[i].status = "Perlu Verifikasi"; 
        } else {
            alumni[i].status = "Tidak Cocok"; 
        }

        saveData();
    }, 600);
}

// ==========================================
// FUNGSI PELACAKAN AI (GEMINI) MULTI-KEY
// ==========================================
async function analisisDenganGemini(dataKandidat) {
    // Array berisi API Key untuk dirotasi secara otomatis
    const apiKeys = [
        "AIzaSyDNGeK7XxyBL-UgWhnLhDccr4eJ2-dD8JI",
        "AIzaSyCpJrDjkokHP2laePeAfYmyR6bccF7M2vw",
        "AIzaSyBglEsWeeJv8xEAo0UWio01L72gl3R6_aE",
        "AIzaSyBglEsWeeJv8xEAo0UWio01L72gl3R6_aE"
    ];

    // Memilih salah satu key secara acak
    const activeKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

    const promptText = `
Analisis kecocokan profil alumni Universitas Muhammadiyah Malang berikut dan ekstrak informasi tambahan:

Nama: ${dataKandidat.nama}
Alias: ${dataKandidat.variasi || "-"}
Prodi: ${dataKandidat.prodi}
Tahun Lulus: ${dataKandidat.tahun}
Kota: ${dataKandidat.kota}
URL Profil: ${dataKandidat.url || "-"}
Platform Media Sosial Khusus: ${dataKandidat.social_media_platform || "-"}
URL Media Sosial Khusus: ${dataKandidat.social_media_url || "-"}

Aturan Penilaian:
1. Jika URL kosong skor maksimal 40
2. Jika cukup cocok skor 50-80
3. Jika sangat cocok skor 81-100

Ekstrak informasi berikut berdasarkan data yang tersedia (jika tidak ada, kosongkan):
- Email
- No HP
- Tempat Bekerja
- Alamat Bekerja
- Posisi
- Jenis Pekerjaan (PNS/Swasta/Wirausaha)
- Alamat Sosial Media Tempat Bekerja
- Platform Media Sosial Khusus dan URL
- LinkedIn
- Instagram
- Facebook
- TikTok

Balas HANYA JSON seperti ini:
{
  "score": 80,
  "alasan": "profil cukup relevan",
  "email": "contoh@email.com",
  "phone": "08123456789",
  "workplace": "PT Contoh",
  "workplace_address": "Jl. Contoh No.1",
  "position": "Manager",
  "employment_type": "Swasta",
  "workplace_social_media": "https://linkedin.com/company/contoh",
  "social_media_platform": "LinkedIn",
  "social_media_url": "https://linkedin.com/in/contoh",
  "social_media": {
    "linkedin": "https://linkedin.com/in/contoh",
    "ig": "https://instagram.com/contoh",
    "fb": "https://facebook.com/contoh",
    "tiktok": "https://tiktok.com/@contoh"
  }
}
`;

    try {
        const response = await fetch(`${url}?key=${activeKey}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const result = await response.json();
        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) return { score: 0, alasan: "AI tidak memberikan respon (Kemungkinan antrean penuh). Coba lagi." };

        try {
            const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(clean);
            return {
                score: parsed.score || 0,
                alasan: parsed.alasan || "Analisis berhasil diselesaikan oleh AI.",
                email: parsed.email || "",
                phone: parsed.phone || "",
                workplace: parsed.workplace || "",
                workplace_address: parsed.workplace_address || "",
                position: parsed.position || "",
                employment_type: parsed.employment_type || "",
                workplace_social_media: parsed.workplace_social_media || "",
                social_media_platform: parsed.social_media_platform || "",
                social_media_url: parsed.social_media_url || "",
                social_media: parsed.social_media || { linkedin: "", ig: "", fb: "", tiktok: "" }
            };
        } catch {
            return { 
                score: 50, 
                alasan: "Format AI kurang tepat: " + aiText,
                email: "",
                phone: "",
                workplace: "",
                workplace_address: "",
                position: "",
                employment_type: "",
                workplace_social_media: "",
                social_media_platform: "",
                social_media_url: "",
                social_media: { linkedin: "", ig: "", fb: "", tiktok: "" }
            };
        }

    } catch (error) {
        console.error(error);
        return { score: 0, alasan: "Koneksi ke AI gagal. Periksa koneksi internet." };
    }
}

async function lacakAI(i) {
    alumni[i].status = "Menganalisis...";
    alumni[i].alasan_ai = "Sedang menghubungi server Gemini AI...";
    alumni[i].metode_lacak = "AI"; // Tandai ini proses AI
    saveData(); 

    const hasilAI = await analisisDenganGemini(alumni[i]);
    const score = hasilAI.score;

    alumni[i].score = score;
    alumni[i].alasan_ai = hasilAI.alasan;
    alumni[i].email = hasilAI.email;
    alumni[i].phone = hasilAI.phone;
    alumni[i].workplace = hasilAI.workplace;
    alumni[i].workplace_address = hasilAI.workplace_address;
    alumni[i].position = hasilAI.position;
    alumni[i].employment_type = hasilAI.employment_type;
    alumni[i].workplace_social_media = hasilAI.workplace_social_media;
    alumni[i].social_media_platform = hasilAI.social_media_platform;
    alumni[i].social_media_url = hasilAI.social_media_url;
    alumni[i].social_media = hasilAI.social_media;

    if (score > 80) {
        alumni[i].status = "Teridentifikasi";
    } else if (score >= 50 && score <= 80) {
        alumni[i].status = "Perlu Verifikasi";
    } else {
        alumni[i].status = "Tidak Cocok";
    }

    saveData();
}

async function autoFillProfile(i) {
    const button = document.getElementById('autoFillBtn');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengisi...';
    }

    try {
        const hasilAI = await analisisDenganGemini(alumni[i]);
        const fieldsToUpdate = {
            detail_variasi: hasilAI.variasi || '',
            detail_kota: hasilAI.kota || '',
            detail_platform: hasilAI.platform || '',
            detail_email: hasilAI.email,
            detail_phone: hasilAI.phone,
            detail_workplace: hasilAI.workplace,
            detail_workplace_address: hasilAI.workplace_address,
            detail_position: hasilAI.position,
            detail_employment_type: hasilAI.employment_type,
            detail_social_media_platform: hasilAI.social_media_platform,
            detail_social_media_url: hasilAI.social_media_url,
            detail_url: hasilAI.social_media_url || alumni[i].url || ''
        };

        let filledCount = 0;
        Object.entries(fieldsToUpdate).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && value) {
                input.value = value;
                filledCount++;
            }
        });

        // Selalu isi field kosong dengan dummy data yang cerdas, bahkan jika AI memberikan beberapa data
        const nama = alumni[i].nama || '';
        const namaLower = nama.toLowerCase().replace(/\s+/g, '');
        const namaParts = nama.split(' ');
        const firstName = namaParts[0] || 'nama';
        const lastName = namaParts[1] || 'alumni';
        const prodi = alumni[i].prodi || '';
        const fakultas = alumni[i].fakultas || '';

        // Logika cerdas untuk email domain berdasarkan prodi
        let emailDomain = 'gmail.com';
        if (prodi.toLowerCase().includes('informatika') || prodi.toLowerCase().includes('komputer')) {
            emailDomain = 'outlook.com';
        } else if (prodi.toLowerCase().includes('ekonomi') || prodi.toLowerCase().includes('akuntansi')) {
            emailDomain = 'yahoo.com';
        }

        // Logika untuk workplace berdasarkan prodi
        let workplaceBase = 'PT';
        if (prodi.toLowerCase().includes('ekonomi')) {
            workplaceBase = 'CV';
        } else if (prodi.toLowerCase().includes('informatika')) {
            workplaceBase = 'Startup';
        }

        // Logika untuk kota berdasarkan fakultas
        let defaultKota = 'Malang';
        if (fakultas.toLowerCase().includes('teknik')) {
            defaultKota = 'Surabaya';
        } else if (fakultas.toLowerCase().includes('ekonomi')) {
            defaultKota = 'Jakarta';
        }

        // Logika untuk platform berdasarkan prodi
        let platform = 'LinkedIn';
        if (prodi.toLowerCase().includes('informatika') || prodi.toLowerCase().includes('komputer')) {
            platform = 'GitHub';
        } else if (prodi.toLowerCase().includes('ekonomi')) {
            platform = 'ResearchGate';
        }

        // Variasi nomor telepon
        const phonePrefixes = ['0812', '0813', '0815', '0852', '0853'];
        const randomPrefix = phonePrefixes[Math.floor(Math.random() * phonePrefixes.length)];

        const dummyData = {
            detail_variasi: firstName,
            detail_kota: alumni[i].kota || defaultKota,
            detail_platform: platform,
            detail_email: `${namaLower}@${emailDomain}`,
            detail_phone: `${randomPrefix}${Math.floor(Math.random() * 90000000 + 10000000)}`,
            detail_workplace: `${workplaceBase} ${firstName} ${prodi ? prodi.split(' ')[0] : 'Indonesia'}`,
            detail_workplace_address: `Jl. ${firstName} No. ${Math.floor(Math.random() * 100) + 1}, ${alumni[i].kota || defaultKota}`,
            detail_position: prodi.toLowerCase().includes('informatika') ? 'Developer' : prodi.toLowerCase().includes('ekonomi') ? 'Analyst' : 'Staff',
            detail_employment_type: 'Swasta',
            detail_social_media_platform: platform,
            detail_social_media_url: platform === 'GitHub' ? `https://github.com/${namaLower}` : `https://linkedin.com/in/${namaLower}`,
            detail_url: alumni[i].url || (platform === 'GitHub' ? `https://github.com/${namaLower}` : `https://linkedin.com/in/${namaLower}`)
        };

        // Isi field kosong dengan dummy
        Object.entries(dummyData).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && !input.value) { // Hanya isi jika kosong
                input.value = value;
            }
        });

        if (filledCount > 0) {
            alert('Data otomatis telah diisi. Field kosong dilengkapi dengan dummy cerdas. Silakan simpan perubahan jika sudah sesuai.');
        } else {
            alert('AI tidak menemukan data. Semua field diisi dengan dummy cerdas berdasarkan nama, prodi, dan fakultas. Silakan edit dan simpan perubahan.');
        }
    } catch (error) {
        console.error('autoFillProfile error:', error);
        alert('Gagal mengisi otomatis. Periksa koneksi dan coba lagi.');
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-magic"></i> Isi Otomatis';
        }
    }
}

// ==========================================
// TAHAP 4: VERIFIKASI MANUAL & HAPUS
// ==========================================
function verifikasiManual(index, isDiterima) {
    let alasanLama = alumni[index].alasan_ai;
    
    if (alasanLama.startsWith("[Verifikasi Admin]")) {
        let parts = alasanLama.split("Analisis Asli: ");
        if (parts.length > 1) {
            alasanLama = parts[1];
        }
    }

    if (isDiterima) {
        alumni[index].status = "Teridentifikasi";
        alumni[index].alasan_ai = "[Verifikasi Admin] Ditetapkan Valid. Analisis Asli: " + alasanLama;
    } else {
        alumni[index].status = "Tidak Cocok";
        alumni[index].alasan_ai = "[Verifikasi Admin] Ditolak (Tidak Relevan). Analisis Asli: " + alasanLama;
    }
    
    saveData();
}

function hapus(i) {
    if(confirm("Apakah Anda yakin ingin menghapus data alumni ini?")) {
        alumni.splice(i, 1);
        saveData();
    }
}

function deleteDetailProfile(i) {
    if (confirm("Apakah Anda yakin ingin menghapus data alumni ini?") ) {
        alumni.splice(i, 1);
        saveData();
        document.getElementById('detailModal')?.remove();
    }
}

// ==========================================
// FUNGSI DETAIL PROFIL MODAL
// ==========================================
function showDetailProfile(i) {
    const a = alumni[i];
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.id = 'detailModal';
    
    modal.innerHTML = `
        <div class="bg-white rounded-2xl shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div class="sticky top-0 bg-gradient-to-r from-umm to-red-700 text-white p-6 flex justify-between items-start z-10">
                <div>
                    <h2 class="text-2xl font-bold">${a.nama || 'Profil Alumni'}</h2>
                    <p class="text-red-100 text-sm mt-1">Lihat, edit, atau isi otomatis data profil.</p>
                </div>
                <button type="button" onclick="document.getElementById('detailModal').remove()" class="text-2xl hover:scale-110 transition">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
                <form id="detailForm" class="space-y-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Nama Lengkap</label>
                        <input id="detail_nama" type="text" value="${a.nama || ''}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Variasi Nama</label>
                        <input id="detail_variasi" type="text" value="${a.variasi || ''}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Program Studi</label>
                        <input id="detail_prodi" type="text" value="${a.prodi || ''}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tahun Lulus</label>
                        <input id="detail_tahun" type="number" value="${a.tahun || ''}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Kota</label>
                        <input id="detail_kota" type="text" value="${a.kota || ''}" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Platform Eksternal</label>
                        <select id="detail_platform" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition cursor-pointer">
                            <option value="">-- Pilih Platform --</option>
                            <option value="LinkedIn" ${a.platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                            <option value="Google Scholar" ${a.platform === 'Google Scholar' ? 'selected' : ''}>Google Scholar</option>
                            <option value="ResearchGate" ${a.platform === 'ResearchGate' ? 'selected' : ''}>ResearchGate</option>
                            <option value="ORCID" ${a.platform === 'ORCID' ? 'selected' : ''}>ORCID</option>
                            <option value="GitHub" ${a.platform === 'GitHub' ? 'selected' : ''}>GitHub</option>
                            <option value="Facebook" ${a.platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                            <option value="Instagram" ${a.platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                            <option value="Website Perusahaan" ${a.platform === 'Website Perusahaan' ? 'selected' : ''}>Website Perusahaan</option>
                            <option value="Portal Berita" ${a.platform === 'Portal Berita' ? 'selected' : ''}>Portal Berita</option>
                            <option value="Mesin Pencari Web" ${a.platform === 'Mesin Pencari Web' ? 'selected' : ''}>Mesin Pencari Web</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL Profil / Bukti</label>
                        <input id="detail_url" type="url" value="${a.url || ''}" placeholder="https://..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Sosial Media Tempat Bekerja</label>
                        <select id="detail_social_media_platform" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition cursor-pointer">
                            <option value="">-- Pilih Media Sosial --</option>
                            <option value="LinkedIn" ${a.social_media_platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                            <option value="Instagram" ${a.social_media_platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                            <option value="Facebook" ${a.social_media_platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                            <option value="TikTok" ${a.social_media_platform === 'TikTok' ? 'selected' : ''}>TikTok</option>
                            <option value="Twitter" ${a.social_media_platform === 'Twitter' ? 'selected' : ''}>Twitter</option>
                            <option value="YouTube" ${a.social_media_platform === 'YouTube' ? 'selected' : ''}>YouTube</option>
                            <option value="Lainnya" ${a.social_media_platform === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">URL Media Sosial</label>
                        <input id="detail_social_media_url" type="url" value="${a.social_media_url || ''}" placeholder="https://..." class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Email</label>
                        <input id="detail_email" type="email" value="${a.email || ''}" placeholder="contoh@email.com" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">No HP</label>
                        <input id="detail_phone" type="text" value="${a.phone || ''}" placeholder="08123456789" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Tempat Bekerja</label>
                        <input id="detail_workplace" type="text" value="${a.workplace || ''}" placeholder="PT Contoh" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Posisi</label>
                        <input id="detail_position" type="text" value="${a.position || ''}" placeholder="Manager" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Jenis Pekerjaan</label>
                        <select id="detail_employment_type" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition cursor-pointer">
                            <option value="">-- Pilih Jenis --</option>
                            <option value="PNS" ${a.employment_type === 'PNS' ? 'selected' : ''}>PNS</option>
                            <option value="Swasta" ${a.employment_type === 'Swasta' ? 'selected' : ''}>Swasta</option>
                            <option value="Wirausaha" ${a.employment_type === 'Wirausaha' ? 'selected' : ''}>Wirausaha</option>
                        </select>
                    </div>
                    <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-gray-700 mb-2">Alamat Bekerja</label>
                        <input id="detail_workplace_address" type="text" value="${a.workplace_address || ''}" placeholder="Jl. Contoh No.1" class="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm outline-none transition">
                    </div>
                </div>
            </form>
            </div>

            <div class="bg-white p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button id="autoFillBtn" type="button" onclick="autoFillProfile(${i})" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fas fa-magic"></i> Isi Otomatis
                </button>
                <button type="button" onclick="saveDetailProfile(${i})" class="w-full bg-umm hover:bg-umm-dark text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fas fa-save"></i> Simpan Perubahan
                </button>
                <button type="button" onclick="deleteDetailProfile(${i})" class="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fas fa-trash-alt"></i> Hapus Data
                </button>
                <button type="button" onclick="document.getElementById('detailModal').remove()" class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-semibold transition whitespace-nowrap">
                    Tutup
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function saveDetailProfile(i) {
    const form = document.getElementById('detailForm');
    if (!form) return;

    alumni[i] = {
        ...alumni[i],
        nama: document.getElementById('detail_nama').value,
        variasi: document.getElementById('detail_variasi').value,
        prodi: document.getElementById('detail_prodi').value,
        tahun: parseInt(document.getElementById('detail_tahun').value) || 0,
        kota: document.getElementById('detail_kota').value,
        platform: document.getElementById('detail_platform').value,
        url: document.getElementById('detail_url').value,
        social_media_platform: document.getElementById('detail_social_media_platform').value,
        social_media_url: document.getElementById('detail_social_media_url').value,
        email: document.getElementById('detail_email').value,
        phone: document.getElementById('detail_phone').value,
        workplace: document.getElementById('detail_workplace').value,
        position: document.getElementById('detail_position').value,
        employment_type: document.getElementById('detail_employment_type').value,
        workplace_address: document.getElementById('detail_workplace_address').value
    };

    saveData();
    render();
    alert('Data berhasil disimpan.');
    document.getElementById('detailModal')?.remove();
}

// ==========================================
// TAHAP 5: UI RENDER
// ==========================================
function getPlatformIcon(platform, url) {
    if(!platform || !url) return `<span class="text-gray-300">-</span>`;
    let iconClass = "fas fa-link";
    let colorClass = "text-gray-500 hover:text-gray-700";

    switch(platform) {
        case "LinkedIn": iconClass="fab fa-linkedin"; colorClass="text-blue-600 hover:text-blue-800"; break;
        case "Google Scholar": iconClass="fas fa-graduation-cap"; colorClass="text-blue-500 hover:text-blue-700"; break;
        case "ResearchGate": iconClass="fab fa-researchgate"; colorClass="text-teal-500 hover:text-teal-700"; break;
        case "ORCID": iconClass="fab fa-orcid"; colorClass="text-green-500 hover:text-green-700"; break;
        case "GitHub": iconClass="fab fa-github"; colorClass="text-gray-800 hover:text-black"; break;
        case "Facebook": iconClass="fab fa-facebook"; colorClass="text-blue-600 hover:text-blue-800"; break;
        case "Instagram": iconClass="fab fa-instagram"; colorClass="text-pink-600 hover:text-pink-800"; break;
        case "Website Perusahaan": iconClass="fas fa-globe"; colorClass="text-indigo-500 hover:text-indigo-700"; break;
        case "Portal Berita": iconClass="far fa-newspaper"; colorClass="text-red-500 hover:text-red-700"; break;
        case "Mesin Pencari Web": iconClass="fab fa-google"; colorClass="text-blue-500 hover:text-blue-700"; break;
    }
    return `<a href="${url}" target="_blank" class="text-3xl ${colorClass} transition-transform hover:scale-110 inline-block"><i class="${iconClass}"></i></a>`;
}

function getBadgeClass(status) {
    if(status === "Teridentifikasi") return "bg-emerald-100 text-emerald-700 border-emerald-200";
    if(status === "Perlu Verifikasi") return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if(status === "Tidak Cocok") return "bg-red-100 text-red-700 border-red-200";
    if(status === "Menganalisis...") return "bg-blue-100 text-blue-700 border-blue-200 animate-pulse";
    return "bg-gray-100 text-gray-600 border-gray-200";
}

function render() {
    renderTable();
    renderVerify();
    updateDashboard();
}

function renderTable() {
    const tableBody = document.getElementById("table");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    alumni.forEach((a, i) => {
        let alertColor = "border-gray-200 text-gray-600 bg-gray-50";
        let iconStatusAlert = "fa-info-circle text-gray-400";
        let borderLeftColor = "border-l-gray-200";
        
        if (a.status === "Teridentifikasi") { alertColor = "border-emerald-200 text-emerald-700 bg-emerald-50"; iconStatusAlert = "fa-check-circle text-emerald-500"; borderLeftColor = "border-l-emerald-500"; }
        if (a.status === "Perlu Verifikasi") { alertColor = "border-yellow-200 text-yellow-700 bg-yellow-50"; iconStatusAlert = "fa-exclamation-triangle text-yellow-500"; borderLeftColor = "border-l-yellow-400"; }
        if (a.status === "Tidak Cocok") { alertColor = "border-red-200 text-red-700 bg-red-50"; iconStatusAlert = "fa-times-circle text-red-500"; borderLeftColor = "border-l-red-500"; }
        if (a.status === "Menganalisis...") { alertColor = "border-blue-200 text-blue-700 bg-blue-50"; iconStatusAlert = "fa-spinner fa-spin text-blue-500"; borderLeftColor = "border-l-blue-400"; }

        let aliasHtml = a.variasi 
            ? `<div class="text-[11px] text-gray-500 mb-1.5 font-medium"><i class="fas fa-id-badge text-gray-400 mr-1"></i> Alias: <span class="text-gray-700">${a.variasi}</span></div>` 
            : `<div class="text-[11px] text-gray-400 mb-1.5 italic"><i class="fas fa-id-badge mr-1"></i> Alias: -</div>`;

        let labelAnalisis = a.metode_lacak === "Lokal" ? "Analisis Sistem" : "Analisis AI";
        let iconAnalisis = a.metode_lacak === "Lokal" ? "fa-microchip" : "fa-robot";
        if (a.alasan_ai && a.alasan_ai.includes("[Verifikasi Admin]")) {
            labelAnalisis = "Verifikasi Manual";
            iconAnalisis = "fa-user-shield";
        }

        tableBody.innerHTML += `
        <tr class="bg-white shadow-sm hover:shadow-md transition-shadow group relative">
            <td class="p-5 rounded-l-2xl border-y border-l-4 border-gray-100 align-top ${borderLeftColor}">
                <div class="font-bold text-gray-800 text-base">${a.nama}</div>
                ${aliasHtml}
                <div class="text-xs text-gray-500 mb-2 mt-1">
                    <span class="inline-flex items-center gap-1"><i class="fas fa-graduation-cap"></i> ${a.prodi}</span>
                    <span class="mx-1.5 text-gray-300">•</span>
                    <span class="inline-flex items-center gap-1"><i class="fas fa-map-marker-alt"></i> ${a.kota}</span>
                </div>
                ${a.alasan_ai ? `
                <div class="mt-3 text-xs p-2.5 rounded-lg border flex items-start gap-2 ${alertColor}">
                    <i class="fas ${iconStatusAlert} mt-0.5"></i> 
                    <div>
                        <b><i class="fas ${iconAnalisis} mr-1"></i> ${labelAnalisis}:</b> ${a.alasan_ai}
                    </div>
                </div>` : ''}
            </td>
            <td class="p-5 border-y border-gray-100 text-center align-middle">
                ${getPlatformIcon(a.platform, a.url)}
            </td>
            <td class="p-5 border-y border-gray-100 text-center align-middle">
                <span class="inline-block whitespace-nowrap px-4 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getBadgeClass(a.status)}">${a.status}</span>
            </td>
            <td class="p-5 border-y border-gray-100 text-center font-bold text-2xl text-gray-800 align-middle">
                ${a.score}<span class="text-sm text-gray-400 font-normal">%</span>
            </td>
            <td class="p-5 rounded-r-2xl border-y border-r border-gray-100 text-center align-middle w-44">
                <div class="flex flex-col gap-2">
                    <button onclick="lacakAI(${i})" class="bg-blue-50 w-full text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                        <i class="fas fa-brain"></i> Lacak AI
                    </button>
                    <button onclick="lacakLokal(${i})" class="bg-teal-50 w-full text-teal-600 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                        <i class="fas fa-microchip"></i> Lacak Lokal
                    </button>
                    <button onclick="showDetailProfile(${i})" class="bg-indigo-50 w-full text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                        <i class="fas fa-file-alt"></i> Detail
                    </button>
                    <button onclick="hapus(${i})" class="bg-red-50 w-full text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm">
                        <i class="fas fa-trash-alt"></i> Hapus
                    </button>
                </div>
            </td>
        </tr>`;
    });
}

function renderVerify() {
    const verifyList = document.getElementById("verifyList");
    if (!verifyList) return;
    verifyList.innerHTML = "";

    const perluVerifikasi = alumni.filter(a => a.status === "Perlu Verifikasi");

    if (perluVerifikasi.length === 0) {
        verifyList.innerHTML = `<div class="col-span-full bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm"><i class="fas fa-check-circle text-5xl text-gray-300 mb-4 block"></i>Semua data aman. Tidak ada profil yang perlu diverifikasi manual.</div>`;
        return;
    }

    alumni.forEach((a, i) => {
        if (a.status === "Perlu Verifikasi") {
            let iconClass = "fas fa-link";
            let iconColor = "text-gray-500";
            switch(a.platform) {
                case "LinkedIn": iconClass="fab fa-linkedin"; iconColor="text-blue-600"; break;
                case "Google Scholar": iconClass="fas fa-graduation-cap"; iconColor="text-blue-500"; break;
                case "ResearchGate": iconClass="fab fa-researchgate"; iconColor="text-teal-500"; break;
                case "ORCID": iconClass="fab fa-orcid"; iconColor="text-green-500"; break;
                case "GitHub": iconClass="fab fa-github"; iconColor="text-gray-800"; break;
                case "Facebook": iconClass="fab fa-facebook"; iconColor="text-blue-600"; break;
                case "Instagram": iconClass="fab fa-instagram"; iconColor="text-pink-600"; break;
            }

            let labelAnalisis = a.metode_lacak === "Lokal" ? "Analisis Sistem" : "Analisis AI";
            let iconAnalisis = a.metode_lacak === "Lokal" ? "fa-microchip" : "fa-robot";

            verifyList.innerHTML += `
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden transform transition hover:-translate-y-1 hover:shadow-xl hover:border-red-200 group">
                <div class="h-1.5 w-full bg-umm"></div>
                <div class="p-6 flex flex-col flex-1">
                    <div class="flex justify-between items-start mb-4">
                        <div class="w-full pr-4">
                            <h3 class="font-bold text-xl text-gray-800 tracking-tight leading-tight group-hover:text-umm transition-colors">${a.nama}</h3>
                            <div class="flex flex-wrap items-center gap-2 text-xs mt-3">
                                <span class="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                    <i class="fas fa-graduation-cap text-gray-400"></i> ${a.prodi}
                                </span>
                                <span class="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200">
                                    <i class="fas fa-calendar-check text-gray-400"></i> Lulus ${a.tahun}
                                </span>
                                <span class="flex items-center gap-1.5 bg-red-50 text-umm px-2.5 py-1.5 rounded-lg border border-red-100 font-medium">
                                    <i class="fas fa-map-marker-alt text-red-400"></i> ${a.kota}
                                </span>
                            </div>
                        </div>
                        <div class="text-right flex flex-col items-end shrink-0">
                            <div class="bg-red-50 text-umm px-3 py-2 rounded-xl border border-red-100 text-center min-w-[65px]">
                                <span class="text-[10px] font-bold uppercase tracking-wider block mb-0.5 opacity-80">Skor</span>
                                <span class="text-xl font-black">${a.score}<span class="text-xs">%</span></span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="w-full bg-gray-100 h-1.5 mb-5 rounded-full overflow-hidden">
                        <div class="bg-umm h-1.5 transition-all duration-1000 rounded-full" style="width: ${a.score}%"></div>
                    </div>

                    <div class="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200 group-hover:border-red-100 transition-colors">
                        <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl ${iconColor} border border-gray-100">
                            <i class="${iconClass}"></i>
                        </div>
                        <div class="flex-1 overflow-hidden">
                            <p class="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">${a.platform || 'Sumber Profil'}</p>
                            <a href="${a.url}" target="_blank" class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block w-full transition">${a.url ? a.url : 'Tidak ada URL'}</a>
                        </div>
                    </div>

                    <div class="bg-red-50/50 p-4 rounded-xl border-l-4 border-l-umm border-y border-r border-red-100 text-sm text-gray-700 mb-6 flex-1 shadow-sm">
                        <p class="leading-relaxed"><strong class="text-umm block mb-1.5 text-xs uppercase tracking-wider"><i class="fas ${iconAnalisis} mr-1.5"></i>${labelAnalisis}:</strong> ${a.alasan_ai}</p>
                    </div>

                    <div class="grid grid-cols-2 gap-3 mt-auto">
                        <button onclick="verifikasiManual(${i}, true)" class="bg-emerald-500 hover:bg-emerald-600 text-white py-3 rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            <i class="fas fa-check-circle"></i> Profil Valid
                        </button>
                        <button onclick="verifikasiManual(${i}, false)" class="bg-umm hover:bg-umm-dark text-white py-3 rounded-xl font-semibold transition text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
                            <i class="fas fa-times-circle"></i> Tolak
                        </button>
                    </div>
                </div>
            </div>`;
        }
    });
}

function updateDashboard() {
    if (!document.getElementById("total")) return;
    
    const totalCount = alumni.length;
    const identifiedCount = alumni.filter(a => a.status === "Teridentifikasi").length;
    const verifyCount = alumni.filter(a => a.status === "Perlu Verifikasi").length;
    const tidakCocokCount = alumni.filter(a => a.status === "Tidak Cocok").length;
    const belumDilacakCount = alumni.filter(a => a.status === "Belum Dilacak" || a.status === "Menganalisis...").length;

    document.getElementById("total").innerText = totalCount;
    document.getElementById("identified").innerText = identifiedCount;
    document.getElementById("verifyCount").innerText = verifyCount;
    
    const notMatchElement = document.getElementById("notMatchCount");
    if(notMatchElement) notMatchElement.innerText = tidakCocokCount;

    const historyList = document.getElementById("historyList");
    if (historyList) {
        historyList.innerHTML = "";
        if (alumni.length === 0) {
            historyList.innerHTML = `<div class="text-center text-gray-400 py-6 text-sm"><i class="fas fa-history text-3xl block mb-2 opacity-50"></i> Belum ada data masuk.</div>`;
        } else {
            const lastFive = [...alumni].reverse().slice(0, 5);
            lastFive.forEach(item => {
                let dotColor = "bg-gray-400";
                if(item.status === "Teridentifikasi") dotColor = "bg-emerald-500";
                if(item.status === "Perlu Verifikasi") dotColor = "bg-yellow-400";
                if(item.status === "Tidak Cocok") dotColor = "bg-red-500";
                if(item.status === "Menganalisis...") dotColor = "bg-blue-500 animate-pulse";

                historyList.innerHTML += `
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div class="w-3 h-3 rounded-full ${dotColor} flex-shrink-0 shadow-sm"></div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="text-sm font-semibold text-gray-800 truncate">${item.nama}</h4>
                        <p class="text-[10px] text-gray-500 truncate">${item.prodi} • ${item.tahun}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 shadow-sm">${item.score}%</span>
                    </div>
                </div>`;
            });
        }
    }

    const ctx = document.getElementById('statusChart');
    if (ctx) {
        if (myChart !== null) {
            myChart.destroy();
        }

        const dataStatus = totalCount === 0 ? [1] : [identifiedCount, verifyCount, tidakCocokCount, belumDilacakCount];
        const colorStatus = totalCount === 0 ? ['#f3f4f6'] : ['#10b981', '#fbbf24', '#ef4444', '#9ca3af'];
        const labelStatus = totalCount === 0 ? ['Kosong'] : ['Teridentifikasi', 'Perlu Verifikasi', 'Tidak Cocok', 'Proses/Belum Lacak'];

        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelStatus,
                datasets: [{
                    data: dataStatus,
                    backgroundColor: colorStatus,
                    borderWidth: 3,             
                    borderColor: '#ffffff',     
                    hoverOffset: 6,             
                    borderRadius: 5             
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '75%', 
                elements: {
                    center: {
                        text: totalCount.toString(),
                        label: 'Total Data'
                    }
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: { family: "'Poppins', sans-serif", size: 12, weight: '500' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 41, 55, 0.9)', 
                        padding: 12,
                        titleFont: { family: "'Poppins', sans-serif", size: 13, weight: '600' },
                        bodyFont: { family: "'Poppins', sans-serif", size: 12 },
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                let label = context.label || '';
                                if (label) { label += ': '; }
                                if (context.parsed !== null) {
                                    if(totalCount === 0) return " Belum ada data";
                                    label += context.parsed + ' Data Alumni';
                                }
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }

    // Grafik Volume - Distribusi berdasarkan tahun
    const volumeCtx = document.getElementById('volumeChart');
    if (volumeCtx) {
        if (volumeChart !== null) {
            volumeChart.destroy();
        }

        // Hitung distribusi berdasarkan tahun
        const yearDistribution = {};
        alumni.forEach(a => {
            const year = a.tahun || 'Unknown';
            yearDistribution[year] = (yearDistribution[year] || 0) + 1;
        });

        const years = Object.keys(yearDistribution).sort();
        const counts = years.map(year => yearDistribution[year]);

        volumeChart = new Chart(volumeCtx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [{
                    label: 'Jumlah Alumni',
                    data: counts,
                    backgroundColor: 'rgba(177, 31, 36, 0.8)',
                    borderColor: 'rgba(177, 31, 36, 1)',
                    borderWidth: 1,
                    borderRadius: 4,
                    hoverBackgroundColor: 'rgba(177, 31, 36, 1)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            font: { family: "'Poppins', sans-serif", size: 12 }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    x: {
                        ticks: {
                            font: { family: "'Poppins', sans-serif", size: 11 }
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(31, 41, 55, 0.9)',
                        padding: 12,
                        titleFont: { family: "'Poppins', sans-serif", size: 13, weight: '600' },
                        bodyFont: { family: "'Poppins', sans-serif", size: 12 },
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.parsed.y} Alumni`;
                            }
                        }
                    }
                }
            }
        });
    }
}

// ==========================================
// TAHAP 6: NAVIGASI DIPAKSA FIX & LOGOUT
// ==========================================
function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.add("hidden"));
    const targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.remove("hidden");
    
    document.querySelectorAll("#navMenu button").forEach(btn => {
        btn.className = "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition text-gray-400 hover:bg-gray-800 hover:text-white border-l-4 border-transparent";
        btn.style.backgroundColor = "transparent";
        btn.style.borderLeftColor = "transparent";
        btn.style.color = "#9ca3af";
    });

    const activeBtn = document.getElementById(`menu-${pageId}`);
    if(activeBtn) {
        activeBtn.className = "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition font-bold";
        activeBtn.style.backgroundColor = "rgba(127, 29, 29, 0.2)";
        activeBtn.style.borderLeftColor = "#dc2626";
        activeBtn.style.color = "#ffffff";
    }

    if(pageId === 'dashboard') {
        updateDashboard();
    }
}

function login() {
    const user = document.getElementById("username").value;
    const pass = document.getElementById("password").value;

    if (user === "admin" && pass === "umm123") {
        localStorage.setItem("isLoggedIn", "true");
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        showPage('dashboard');
        render(); 
    } else {
        document.getElementById("loginError").classList.remove("hidden");
    }
}

function logout() {
    if(confirm("Apakah Anda yakin ingin keluar dari sistem Tracking?")) {
        localStorage.removeItem("isLoggedIn");
        document.getElementById("app").classList.add("hidden");
        document.getElementById("loginPage").classList.remove("hidden");
        
        // Reset kolom input login
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("loginError").classList.add("hidden");
    }
}

function exportCSV() {
    console.log("Export CSV clicked, alumni length:", alumni.length);

    if (alumni.length === 0) {
        alert("Tidak ada data alumni untuk diekspor. Silakan load data terlebih dahulu.");
        return;
    }

    // Hitung data yang lengkap vs tidak lengkap
    let completeData = 0;
    let incompleteData = 0;

    alumni.forEach(a => {
        const requiredFields = [a.nama, a.prodi, a.tahun];
        const hasBasicInfo = requiredFields.every(field => field && field.toString().trim() !== "");

        if (hasBasicInfo) {
            completeData++;
        } else {
            incompleteData++;
        }
    });

    console.log("Generating CSV content...");

    let csv = "NIM,Nama,Variasi,Prodi,Tahun,Kota,Platform,URL,Email,Phone,Workplace,Workplace_Address,Position,Employment_Type,Workplace_Social_Media,Social_Media_Platform,Social_Media_URL,LinkedIn,IG,FB,TikTok,Status,Score,Metode_Lacak,Alasan_Sistem\n";
    alumni.forEach(a => {
        let safeAlasan = a.alasan_ai ? a.alasan_ai.replace(/,/g, ";").replace(/\n/g, " ") : "";
        let metode = a.metode_lacak ? a.metode_lacak : "-";
        csv += `${a.nim || ""},${a.nama},${a.variasi},${a.prodi},${a.tahun},${a.kota},${a.platform},${a.url},${a.email},${a.phone},${a.workplace},${a.workplace_address},${a.position},${a.employment_type},${a.workplace_social_media},${a.social_media_platform || ""},${a.social_media_url || ""},${a.social_media.linkedin},${a.social_media.ig},${a.social_media.fb},${a.social_media.tiktok},${a.status},${a.score},${metode},"${safeAlasan}"\n`;
    });

    console.log("CSV content length:", csv.length);

    try {
        // Coba metode alternatif untuk download
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);

        // Metode 1: Direct download dengan anchor
        const a = document.createElement("a");
        a.href = url;
        a.download = "umm_alumni_data_hybrid.csv";
        a.style.display = "none";

        // Pastikan anchor ditambahkan ke DOM
        document.body.appendChild(a);

        // Trigger download
        setTimeout(() => {
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            console.log("Download triggered successfully");
            alert(`Berhasil mengekspor ${alumni.length} data alumni ke CSV.\nData lengkap: ${completeData}\nData perlu dilengkapi: ${incompleteData}`);
        }, 100);

    } catch (error) {
        console.error("Error with anchor method:", error);

        try {
            // Metode 2: Fallback dengan window.open
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
            window.URL.revokeObjectURL(url);
            alert(`File CSV dibuka di tab baru (${alumni.length} data).\nData lengkap: ${completeData}, Perlu dilengkapi: ${incompleteData}\nSilakan save as dengan nama "umm_alumni_data_hybrid.csv".`);
        } catch (fallbackError) {
            console.error("Error with fallback method:", fallbackError);
            alert(`Tidak dapat mengekspor CSV otomatis.\nData lengkap: ${completeData}, Perlu dilengkapi: ${incompleteData}\n\nSilakan copy data berikut dan save sebagai file CSV:\n\n${csv.substring(0, 1000)}...`);
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        showPage('dashboard');
    }
    updateSliderValue(); // Inisialisasi nilai slider dashboard
    updateSidebarSliderValue(); // Inisialisasi nilai slider sidebar
    render();
});