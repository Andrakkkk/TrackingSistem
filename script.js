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
let myChart = null; 

// ==========================================
// TAHAP 1: INPUT DATA
// ==========================================
const form = document.getElementById("form");
if (form) {
    form.addEventListener("submit", function(e) {
        e.preventDefault();

        const data = {
            nama: document.getElementById("nama").value,
            variasi: document.getElementById("variasi").value,
            prodi: document.getElementById("prodi").value,
            tahun: parseInt(document.getElementById("tahun").value),
            kota: document.getElementById("kota").value,
            platform: document.getElementById("platform").value,
            url: document.getElementById("urlProfil").value,
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
// FUNGSI PELACAKAN AI (GEMINI)
// ==========================================
async function analisisDenganGemini(dataKandidat) {
    const apiKey = "AIzaS"; // api ai nya ku ganti
    const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

    const promptText = `
Analisis kecocokan profil alumni Universitas Muhammadiyah Malang berikut:

Nama: ${dataKandidat.nama}
Alias: ${dataKandidat.variasi || "-"}
Prodi: ${dataKandidat.prodi}
Tahun Lulus: ${dataKandidat.tahun}
Kota: ${dataKandidat.kota}
URL Profil: ${dataKandidat.url || "-"}

Aturan Penilaian:
1. Jika URL kosong skor maksimal 40
2. Jika cukup cocok skor 50-80
3. Jika sangat cocok skor 81-100

Balas HANYA JSON seperti ini:
{"score":80,"alasan":"profil cukup relevan"}
`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-goog-api-key": apiKey
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: promptText }] }],
                generationConfig: { temperature: 0.2 }
            })
        });

        const result = await response.json();
        const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!aiText) return { score: 0, alasan: "AI tidak memberikan respon. Coba lagi." };

        try {
            const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
            const parsed = JSON.parse(clean);
            return {
                score: parsed.score || 0,
                alasan: parsed.alasan || "Analisis berhasil diselesaikan oleh AI."
            };
        } catch {
            return { score: 50, alasan: "Format AI kurang tepat: " + aiText };
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

    if (score > 80) {
        alumni[i].status = "Teridentifikasi";
    } else if (score >= 50 && score <= 80) {
        alumni[i].status = "Perlu Verifikasi";
    } else {
        alumni[i].status = "Tidak Cocok";
    }

    saveData();
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
                    <button onclick="hapus(${i})" class="bg-red-50 w-full text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm mt-1">
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
    
    // UPDATE: Render angka Tidak Cocok ke Dashboard Card Baru
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
        document.getElementById("app").classList.add("hidden");
        document.getElementById("loginPage").classList.remove("hidden");
        
        // Reset kolom input login
        document.getElementById("username").value = "";
        document.getElementById("password").value = "";
        document.getElementById("loginError").classList.add("hidden");
    }
}

function exportCSV() {
    let csv = "Nama,Variasi,Prodi,Tahun,Kota,Platform,URL,Status,Score,Metode_Lacak,Alasan_Sistem\n";
    alumni.forEach(a => {
        let safeAlasan = a.alasan_ai ? a.alasan_ai.replace(/,/g, ";").replace(/\n/g, " ") : "";
        let metode = a.metode_lacak ? a.metode_lacak : "-";
        csv += `${a.nama},${a.variasi},${a.prodi},${a.tahun},${a.kota},${a.platform},${a.url},${a.status},${a.score},${metode},"${safeAlasan}"\n`;
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "umm_alumni_data_hybrid.csv";
    a.click();
}

document.addEventListener("DOMContentLoaded", render);
