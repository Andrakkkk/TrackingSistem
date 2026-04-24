
// Flag untuk mencegah pemuatan CSV ganda secara bersamaan
let isCSVLoading = false;

// ==========================================
// FUNGSI UNTUK MEMUAT DATA DARI FILE CSV SECARA LANGSUNG
// ==========================================
async function loadDefaultCSV(silent = false, autoTrack = false) {
    // Cegah pemanggilan ganda / bersamaan
    if (isCSVLoading) {
        console.warn("[CSV] Load sudah berjalan, permintaan duplikat diabaikan.");
        return;
    }
    isCSVLoading = true;

    const fileName = "Alumni 2000-2025.xlsx - Sheet1.csv";
    showLoadingProgress(`Mempersiapkan untuk memuat file ${fileName}...`);

    // Saat auto-load: kosongkan data lama dulu agar tidak terjadi tumpukan
    if (silent) {
        alumni = [];
    }

    if (window.Worker) {
        const csvWorker = new Worker('csv-worker.js');
        // Kirim NIM yang sudah ada untuk deduplikasi (hanya relevan saat load manual)
        const existingAlumniNIMs = alumni.map(a => a.nim).filter(Boolean);
        const existingAlumniNames = alumni.map(a => a.nama);

        csvWorker.postMessage({
            command: 'start',
            fileName: fileName,
            existingAlumniNIMs: existingAlumniNIMs,
            existingAlumniNames: existingAlumniNames
        });

        csvWorker.onmessage = async function(e) {
            const { type, message, batch, processed, total, successCount, totalRows } = e.data;

            if (type === 'batch') {
                // Terima data per 5000 baris — tidak freeze karena bertahap
                alumni.push(...batch);
                showLoadingProgress(`Memuat data: ${processed.toLocaleString()} dari ${total.toLocaleString()} baris...`);
            } else if (type === 'done') {
                isCSVLoading = false;
                hideLoadingProgress();
                render();
                if (!silent) {
                    showCustomAlert(
                        "Data Berhasil Dimuat!",
                        `Total baris: ${totalRows.toLocaleString()}\nData berhasil dimuat: ${successCount.toLocaleString()} alumni`,
                        { bgClass: "bg-emerald-50", textClass: "text-emerald-600", iconClass: "fas fa-check-circle" }
                    );
                }
                csvWorker.terminate();
                // Simpan ke IndexedDB di background — tidak block UI
                saveToDatabaseBackground();

                if (autoTrack) {
                    // Beri jeda kecil agar UI sembuh dari render
                    setTimeout(() => {
                        autoAnalisisLengkap(true);
                    }, 500);
                }
            } else if (type === 'error') {
                isCSVLoading = false;
                hideLoadingProgress();
                if (!silent) alert(`Gagal memuat atau memproses file. Error: ` + message);
                csvWorker.terminate();
            }
        };

        csvWorker.onerror = function(err) {
            isCSVLoading = false;
            hideLoadingProgress();
            console.error("[CSV Worker Error]", err);
        };
    } else {
        isCSVLoading = false;
        hideLoadingProgress();
        if (!silent) alert("Browser Anda tidak mendukung Web Worker.");
    }
}

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
            social_media: { linkedin: "", ig: "", fb: "", tiktok: "" },
            status: "Belum Dilacak",
            score: 0,
            alasan_ai: "",
            metode_lacak: ""
        };

        alumni.unshift(data); // Memasukkan data ke urutan paling awal (atas)
        saveData();
        form.reset();
        currentPageTable = 1; // Memaksa tabel kembali ke halaman pertama
        showPage('tracking'); 
    });
}

// ==========================================
// TAHAP 4: VERIFIKASI MANUAL & HAPUS
// ==========================================
function verifikasiManual(index, isDiterima) {
    let alasanLama = alumni[index].alasan_ai;
    if (alasanLama.startsWith("[Verifikasi Admin]")) {
        let parts = alasanLama.split("Analisis Asli: ");
        if (parts.length > 1) alasanLama = parts[1];
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

// ==========================================
// FUNGSI KOSONGKAN DATA MASSAL
// ==========================================
async function kosongkanData() {
    if (alumni.length === 0) {
        await showCustomAlert("Data Kosong", "Data sudah dalam keadaan kosong.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }
    
    const isConfirmed = await showCustomConfirm(
        "PERINGATAN BAHAYA!",
        "Apakah Anda yakin ingin MENGHAPUS SELURUH DATA ALUMNI?\n\nTindakan ini tidak dapat dibatalkan!",
        { bgClass: "bg-red-50", textClass: "text-red-600", iconClass: "fas fa-exclamation-triangle" },
        "bg-red-600 hover:bg-red-700", "Ya, Hapus Semua"
    );

    if(isConfirmed) {
        alumni.length = 0; // Menggunakan .length = 0 agar referensi array global tidak terputus
        saveData();
        if (typeof currentPageTable !== 'undefined') currentPageTable = 1;
        if (typeof currentPageVerify !== 'undefined') currentPageVerify = 1;
        await showCustomAlert("Berhasil", "Seluruh data alumni berhasil dikosongkan secara permanen.", { bgClass: "bg-emerald-50", textClass: "text-emerald-500", iconClass: "fas fa-trash" });
        showPage('tracking'); // Muat ulang tampilan
    }
}

// ==========================================
// FUNGSI EXPORT CSV
// ==========================================
function exportCSV() {
    if (alumni.length === 0) {
        alert("Tidak ada data alumni untuk diekspor. Silakan load data terlebih dahulu.");
        return;
    }

    const headers = [
        "NIM", "Nama", "Variasi", "Prodi", "Tahun", "Kota", "Platform", "URL",
        "Email", "Phone", "Workplace", "Workplace_Address", "Position", "Employment_Type",
        "Workplace_SM_Platform", "Workplace_SM_URL", "Status", "Score", "Metode_Lacak", "Alasan_Sistem"
    ];

    let csv = headers.join(",") + "\n";

    const escapeCSV = (val) => {
        if (val === null || val === undefined) return '""';
        let str = String(val);
        return `"${str.replace(/"/g, '""')}"`; // Bungkus dengan tanda kutip ganda agar koma/enter aman
    };

    alumni.forEach(a => {
        const row = [
            a.nim, a.nama, a.variasi, a.prodi, a.tahun, a.kota, a.platform, a.url,
            a.email, a.phone, a.workplace, a.workplace_address, a.position, a.employment_type,
            a.social_media_platform, a.social_media_url,
            a.status, a.score, a.metode_lacak || "-", a.alasan_ai
        ];
        csv += row.map(escapeCSV).join(",") + "\n";
    });

    try {
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "umm_alumni_data_hybrid.csv";
        a.style.display = "none";
        document.body.appendChild(a);
        setTimeout(() => {
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            // Panggil animasi kustom di ui.js
            if (typeof showExportSuccessAnimation === 'function') {
                showExportSuccessAnimation(alumni.length);
            } else {
                alert(`Berhasil mengekspor ${alumni.length} data alumni ke CSV.`);
            }
        }, 100);
    } catch (error) { 
        if (typeof showCustomAlert === 'function') {
            showCustomAlert("Gagal", "Gagal mengekspor data ke CSV.", { bgClass: "bg-red-100", textClass: "text-red-600", iconClass: "fas fa-exclamation-triangle" });
        } else {
            alert("Gagal mengekspor data ke CSV."); 
        }
    }
}

// ==========================================
// INISIALISASI SAAT HALAMAN DIMUAT
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
    try {
        await initDatabase();
        alumni = await loadDataFromDB();
    } catch (error) { console.error("Gagal memuat database:", error); }

    if (localStorage.getItem("isLoggedIn") === "true") {
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        render();
        const lastPage = localStorage.getItem('lastActivePage') || 'dashboard';
        showPage(lastPage);
        // Auto-load CSV jika data alumni masih kosong
        if (alumni.length === 0) {
            loadDefaultCSV(true, true);
        } else {
            // Jika data sudah ada tapi belum dilacak, langsung auto track
            setTimeout(() => {
                autoAnalisisLengkap(true);
            }, 1000);
        }
        return;
    }
    render();
});