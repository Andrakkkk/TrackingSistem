// ==========================================
// UI RENDERING & PAGINATION (SISTEM HALAMAN)
// ==========================================
let myChart = null;
let volumeChart = null;

// VARIABEL PAGINATION UNTUK MEMPERINGAN BEBAN BROWSER
let currentPageTable = 1;
const rowsPerPageTable = 50; 

let currentPageVerify = 1;
const rowsPerPageVerify = 20;

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

function showLoadingProgress(message, opts = {}) {
    let progressDiv = document.getElementById('loadingProgress');
    if (!progressDiv) {
        progressDiv = document.createElement('div');
        progressDiv.id = 'loadingProgress';
        progressDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        progressDiv.innerHTML = `
            <div class="bg-white rounded-2xl shadow-xl p-8 max-w-sm mx-4 text-center w-full relative overflow-hidden">
                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-umm mx-auto mb-4"></div>
                <p class="text-gray-700 font-medium mb-4" id="loadingMessage">${message}</p>
                <div id="loadingButtons" class="hidden flex-col gap-2 mt-4"></div>
            </div>`;
        document.body.appendChild(progressDiv);
    } else { document.getElementById('loadingMessage').textContent = message; }

    const btnContainer = document.getElementById('loadingButtons');
    if (opts.showButtons) {
        btnContainer.classList.remove('hidden');
        btnContainer.classList.add('flex');
        btnContainer.innerHTML = `
            <button id="btnLanjutLokal" class="w-full bg-teal-50 text-teal-600 border border-teal-200 hover:bg-teal-600 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"><i class="fas fa-microchip"></i> Lanjutkan Lokal</button>
            <button id="btnBatalLoading" class="w-full bg-red-50 text-red-600 border border-red-200 hover:bg-red-600 hover:text-white py-2.5 rounded-xl text-sm font-semibold transition flex items-center justify-center gap-2"><i class="fas fa-times"></i> Batal Proses</button>
        `;
        document.getElementById('btnBatalLoading').onclick = () => {
            document.getElementById('btnBatalLoading').disabled = true;
            document.getElementById('btnBatalLoading').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Membatalkan...';
            if (opts.onCancel) opts.onCancel();
        };
        document.getElementById('btnLanjutLokal').onclick = () => {
            document.getElementById('btnLanjutLokal').disabled = true;
            document.getElementById('btnLanjutLokal').innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengalihkan...';
            if (opts.onLanjutLokal) opts.onLanjutLokal();
        };
    } else if (btnContainer) {
        btnContainer.classList.add('hidden'); btnContainer.classList.remove('flex'); btnContainer.innerHTML = '';
    }
}

function hideLoadingProgress() { document.getElementById('loadingProgress')?.remove(); }
function getPlatformIcon(platform, url) {
    if(!platform || !url) return `<span class="text-gray-300">-</span>`;
    let iconClass = "fas fa-link"; let colorClass = "text-gray-500 hover:text-gray-700";
    switch(platform) {
        case "LinkedIn": iconClass="fab fa-linkedin"; colorClass="text-blue-600 hover:text-blue-800"; break;
        case "Google Scholar": iconClass="fas fa-graduation-cap"; colorClass="text-blue-500"; break;
        case "GitHub": iconClass="fab fa-github"; colorClass="text-gray-800 hover:text-black"; break;
        case "Facebook": iconClass="fab fa-facebook"; colorClass="text-blue-600 hover:text-blue-800"; break;
        case "Instagram": iconClass="fab fa-instagram"; colorClass="text-pink-600 hover:text-pink-800"; break;
        case "ResearchGate": iconClass="fab fa-researchgate"; colorClass="text-teal-500 hover:text-teal-700"; break;
        case "ORCID": iconClass="fab fa-orcid"; colorClass="text-green-500 hover:text-green-700"; break;
        case "Website Perusahaan": iconClass="fas fa-globe"; colorClass="text-indigo-500 hover:text-indigo-700"; break;
        case "Portal Berita": iconClass="far fa-newspaper"; colorClass="text-red-500 hover:text-red-700"; break;
        case "Mesin Pencari Web": iconClass="fab fa-google"; colorClass="text-blue-500 hover:text-blue-700"; break;
        case "Twitter": iconClass="fab fa-twitter"; colorClass="text-blue-400 hover:text-blue-600"; break;
        case "YouTube": iconClass="fab fa-youtube"; colorClass="text-red-600 hover:text-red-800"; break;
        case "TikTok": iconClass="fab fa-tiktok"; colorClass="text-black hover:text-gray-800"; break;
    }
    return `<a href="${url}" target="_blank" class="text-3xl ${colorClass} transition-transform hover:scale-110 inline-block" title="${platform}"><i class="${iconClass}"></i></a>`;
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

// --- PAGINASI PUSAT TRACKING ---
function renderTable() {
    const tableBody = document.getElementById("table");
    if (!tableBody) return;
    const totalPages = Math.ceil(alumni.length / rowsPerPageTable) || 1;
    if (currentPageTable > totalPages) currentPageTable = totalPages;
    if (currentPageTable < 1) currentPageTable = 1;

    const start = (currentPageTable - 1) * rowsPerPageTable;
    const paginatedData = alumni.slice(start, start + rowsPerPageTable);
    const rowsHtml = []; 

    paginatedData.forEach((a, indexInPage) => {
        const i = start + indexInPage; 
        
        let alertColor = "border-gray-200 text-gray-600 bg-gray-50";
        let iconStatusAlert = "fa-info-circle text-gray-400";
        let borderLeftColor = "border-l-gray-200";
        
        if (a.status === "Teridentifikasi") { alertColor = "border-emerald-200 text-emerald-700 bg-emerald-50"; iconStatusAlert = "fa-check-circle text-emerald-500"; borderLeftColor = "border-l-emerald-500"; }
        else if (a.status === "Perlu Verifikasi") { alertColor = "border-yellow-200 text-yellow-700 bg-yellow-50"; iconStatusAlert = "fa-exclamation-triangle text-yellow-500"; borderLeftColor = "border-l-yellow-400"; }
        else if (a.status === "Tidak Cocok") { alertColor = "border-red-200 text-red-700 bg-red-50"; iconStatusAlert = "fa-times-circle text-red-500"; borderLeftColor = "border-l-red-500"; }
        else if (a.status === "Menganalisis...") { alertColor = "border-blue-200 text-blue-700 bg-blue-50 animate-pulse"; iconStatusAlert = "fa-spinner fa-spin text-blue-500"; borderLeftColor = "border-l-blue-400"; }

        let labelAnalisis = a.metode_lacak === "Lokal" ? "Analisis Sistem" : "Analisis AI";
        let iconAnalisis = a.metode_lacak === "Lokal" ? "fa-microchip" : "fa-robot";
        if (a.alasan_ai && a.alasan_ai.includes("[Verifikasi Admin]")) {
            labelAnalisis = "Verifikasi Manual";
            iconAnalisis = "fa-user-shield";
        }
        
        rowsHtml.push(`
        <tr class="bg-white shadow-sm hover:shadow-md transition-shadow group relative">
            <td class="p-5 rounded-l-2xl border-y border-l-4 border-gray-100 align-top ${borderLeftColor}">
                <div class="font-bold text-gray-800 text-base mb-1">${a.nama}</div>
                <div class="text-[11px] text-gray-500 mb-1.5 font-medium"><i class="fas fa-id-badge text-gray-400 mr-1"></i> Alias: ${a.variasi || '-'}</div>
                <div class="text-xs text-gray-500 mb-2 mt-1">
                    <span class="inline-flex items-center gap-1"><i class="fas fa-graduation-cap"></i> ${a.prodi}</span>
                    <span class="mx-1.5 text-gray-300">•</span>
                    <span class="inline-flex items-center gap-1"><i class="fas fa-map-marker-alt"></i> ${a.kota}</span>
                </div>
                ${a.alasan_ai ? `<div class="mt-3 text-xs p-3 rounded-xl border flex items-start gap-2.5 ${alertColor}"><i class="fas ${iconStatusAlert} mt-0.5 text-sm"></i><div class="leading-relaxed"><b><i class="fas ${iconAnalisis} mr-1"></i> ${labelAnalisis}:</b> ${a.alasan_ai}</div></div>` : ''}
            </td>
            <td class="p-5 border-y border-gray-100 text-center align-middle">${getPlatformIcon(a.platform, a.url)}</td>
            <td class="p-5 border-y border-gray-100 text-center align-middle"><span class="inline-block whitespace-nowrap px-4 py-1.5 text-xs font-semibold rounded-full border shadow-sm ${getBadgeClass(a.status)}">${a.status}</span></td>
            <td class="p-5 border-y border-gray-100 text-center font-bold text-2xl text-gray-800 align-middle">${a.score}<span class="text-sm text-gray-400 font-normal">%</span></td>
            <td class="p-5 rounded-r-2xl border-y border-r border-gray-100 text-center align-middle w-44">
                <div class="flex flex-col gap-2">
                    <button onclick="lacakAI(${i})" class="bg-blue-50 w-full text-blue-600 border border-blue-200 px-3 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><i class="fas fa-brain"></i> Lacak AI</button>
                    <button onclick="lacakLokal(${i})" class="bg-teal-50 w-full text-teal-600 border border-teal-200 px-3 py-1.5 rounded-xl hover:bg-teal-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><i class="fas fa-microchip"></i> Lacak Lokal</button>
                    <button onclick="showDetailProfile(${i})" class="bg-indigo-50 w-full text-indigo-600 border border-indigo-200 px-3 py-1.5 rounded-xl hover:bg-indigo-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><i class="fas fa-file-alt"></i> Detail</button>
                    <button onclick="hapus(${i})" class="bg-red-50 w-full text-red-600 border border-red-200 px-3 py-1.5 rounded-xl hover:bg-red-600 hover:text-white transition-colors text-xs font-medium flex items-center justify-center gap-2 shadow-sm"><i class="fas fa-trash-alt"></i> Hapus</button>
                </div>
            </td>
        </tr>`);
    });

    tableBody.innerHTML = rowsHtml.join("");

    if (totalPages > 1) {
        const paginationHtml = `
        <tr><td colspan="5" class="p-4 text-center border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <div class="flex justify-center items-center gap-3">
                <button onclick="changePageTable(-1)" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${currentPageTable === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left mr-1"></i> Prev</button>
                
                <div class="flex items-center gap-2">
                    <span class="text-sm font-medium text-gray-500 hidden sm:inline-block">Hal</span>
                    <input type="number" min="1" max="${totalPages}" value="${currentPageTable}" onchange="goToPageTable(this.value)" class="w-16 py-1.5 px-2 text-center bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-umm/50 focus:border-umm transition-all" style="-moz-appearance: textfield;">
                    <span class="text-sm font-medium text-gray-500">dari ${totalPages}</span>
                </div>
                
                <button onclick="changePageTable(1)" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${currentPageTable === totalPages ? 'disabled' : ''}>Next <i class="fas fa-chevron-right ml-1"></i></button>
            </div>
        </td></tr>`;
        tableBody.insertAdjacentHTML('beforeend', paginationHtml);
    }
}

function changePageTable(direction) {
    currentPageTable += direction; renderTable();
    document.getElementById('tracking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// --- PAGINASI VERIFIKASI ---
function renderVerify() {
    const verifyList = document.getElementById("verifyList");
    if (!verifyList) return;

    const perluVerifikasi = alumni.filter(a => a.status === "Perlu Verifikasi");

    // --- Action Bar Massal ---
    let massActionBar = document.getElementById('verifyMassActionBar');
    if (!massActionBar) {
        massActionBar = document.createElement('div');
        massActionBar.id = 'verifyMassActionBar';
        verifyList.parentNode.insertBefore(massActionBar, verifyList);
    }

    if (perluVerifikasi.length > 0) {
        massActionBar.innerHTML = `
        <div class="bg-white rounded-2xl p-4 shadow-sm border border-gray-200 mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-xl bg-yellow-50 border border-yellow-200 flex items-center justify-center">
                    <i class="fas fa-shield-alt text-yellow-500"></i>
                </div>
                <div>
                    <p class="font-bold text-gray-800 text-sm">Aksi Verifikasi Massal</p>
                    <p class="text-xs text-gray-500">${perluVerifikasi.length} data menunggu keputusan</p>
                </div>
            </div>
            <div class="flex gap-3 w-full sm:w-auto">
                <button onclick="verifikasiMassal(true)" class="flex-1 sm:flex-none group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                    <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></span>
                    <i class="fas fa-check-double text-base"></i>
                    <span>Terima Semua</span>
                    <span class="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">${perluVerifikasi.length}</span>
                </button>
                <button onclick="verifikasiMassal(false)" class="flex-1 sm:flex-none group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-br from-red-500 to-umm hover:from-red-600 hover:to-red-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95">
                    <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></span>
                    <i class="fas fa-times-circle text-base"></i>
                    <span>Tolak Semua</span>
                    <span class="bg-white/25 text-white text-xs font-bold px-1.5 py-0.5 rounded-md">${perluVerifikasi.length}</span>
                </button>
            </div>
        </div>`;
    } else {
        massActionBar.innerHTML = '';
    }

    if (perluVerifikasi.length === 0) {
        verifyList.innerHTML = `<div class="col-span-full bg-white p-10 rounded-2xl border border-gray-200 text-center text-gray-500 shadow-sm"><i class="fas fa-check-circle text-5xl text-gray-300 mb-4 block"></i>Semua data aman.</div>`;
        return;
    }

    const totalPages = Math.ceil(perluVerifikasi.length / rowsPerPageVerify) || 1;
    if (currentPageVerify > totalPages) currentPageVerify = totalPages;
    if (currentPageVerify < 1) currentPageVerify = 1;

    const start = (currentPageVerify - 1) * rowsPerPageVerify;
    const paginatedData = perluVerifikasi.slice(start, start + rowsPerPageVerify);
    const cardsHtml = [];

    paginatedData.forEach((a) => {
        const i = alumni.indexOf(a); 
        
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

        cardsHtml.push(`
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-yellow-200 group" id="verify-card-${i}">
            <div class="h-1.5 w-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
            <div class="p-6 flex flex-col flex-1">
                <div class="flex justify-between items-start mb-4">
                    <div class="w-full pr-4">
                        <h3 class="font-bold text-xl text-gray-800 tracking-tight leading-tight group-hover:text-yellow-600 transition-colors">${a.nama}</h3>
                        <div class="flex flex-wrap items-center gap-2 text-xs mt-3">
                            <span class="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200"><i class="fas fa-graduation-cap text-gray-400"></i> ${a.prodi}</span>
                            <span class="flex items-center gap-1.5 bg-gray-50 text-gray-600 px-2.5 py-1.5 rounded-lg border border-gray-200"><i class="fas fa-calendar-check text-gray-400"></i> Lulus ${a.tahun || '-'}</span>
                            <span class="flex items-center gap-1.5 bg-red-50 text-umm px-2.5 py-1.5 rounded-lg border border-red-100 font-medium"><i class="fas fa-map-marker-alt text-red-400"></i> ${a.kota}</span>
                        </div>
                    </div>
                    <div class="text-right flex flex-col items-end shrink-0">
                        <div class="bg-amber-50 text-amber-700 px-3 py-2 rounded-xl border border-amber-200 text-center min-w-[65px]">
                            <span class="text-[10px] font-bold uppercase tracking-wider block mb-0.5 opacity-80">Skor</span>
                            <span class="text-xl font-black">${a.score}<span class="text-xs">%</span></span>
                        </div>
                    </div>
                </div>
                
                <div class="w-full bg-gray-100 h-1.5 mb-5 rounded-full overflow-hidden"><div class="bg-gradient-to-r from-yellow-400 to-amber-500 h-1.5 transition-all duration-1000 rounded-full" style="width: ${a.score}%"></div></div>

                <div class="flex items-center gap-3 mb-5 p-3 bg-gray-50 rounded-xl border border-gray-200 group-hover:border-yellow-100 transition-colors">
                    <div class="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl ${iconColor} border border-gray-100"><i class="${iconClass}"></i></div>
                    <div class="flex-1 overflow-hidden">
                        <p class="text-[10px] text-gray-500 uppercase font-semibold mb-0.5">${a.platform || 'Sumber Profil'}</p>
                        <a href="${a.url}" target="_blank" class="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline truncate block w-full transition">${a.url ? a.url : 'Tidak ada URL'}</a>
                    </div>
                </div>

                <div class="bg-amber-50/60 p-4 rounded-xl border-l-4 border-l-amber-400 border-y border-r border-amber-100 text-sm text-gray-700 mb-6 flex-1 shadow-sm"><p class="leading-relaxed"><strong class="text-amber-600 block mb-1.5 text-xs uppercase tracking-wider"><i class="fas ${iconAnalisis} mr-1.5"></i>${labelAnalisis}:</strong> ${a.alasan_ai}</p></div>

                <div class="grid grid-cols-2 gap-3 mt-auto">
                    <button onclick="verifikasiDenganAnimasi(${i}, true)" 
                        class="group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white py-3 rounded-xl font-semibold transition-all duration-200 text-sm shadow-md shadow-emerald-200 hover:shadow-lg hover:shadow-emerald-300 transform hover:-translate-y-0.5 active:scale-95">
                        <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></span>
                        <i class="fas fa-check-circle text-lg"></i>
                        <span>Profil Valid</span>
                    </button>
                    <button onclick="verifikasiDenganAnimasi(${i}, false)" 
                        class="group relative overflow-hidden flex items-center justify-center gap-2 bg-gradient-to-br from-red-500 to-umm hover:from-red-400 hover:to-red-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 text-sm shadow-md shadow-red-200 hover:shadow-lg hover:shadow-red-300 transform hover:-translate-y-0.5 active:scale-95">
                        <span class="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity rounded-xl"></span>
                        <i class="fas fa-times-circle text-lg"></i>
                        <span>Tolak</span>
                    </button>
                </div>
            </div>
        </div>`);
    });

    let paginationHtml = '';
    if (totalPages > 1) {
        paginationHtml = `
        <div class="col-span-full flex justify-center gap-3 mt-6">
            <button onclick="changePageVerify(-1)" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${currentPageVerify === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left mr-1"></i> Prev</button>
            
            <div class="flex items-center gap-2">
                <span class="text-sm font-medium text-gray-500 hidden sm:inline-block">Hal</span>
                <input type="number" min="1" max="${totalPages}" value="${currentPageVerify}" onchange="goToPageVerify(this.value)" class="w-16 py-1.5 px-2 text-center bg-white border border-gray-300 rounded-lg shadow-sm text-sm font-bold text-gray-700 outline-none focus:ring-2 focus:ring-umm/50 focus:border-umm transition-all" style="-moz-appearance: textfield;">
                <span class="text-sm font-medium text-gray-500">dari ${totalPages}</span>
            </div>
            
            <button onclick="changePageVerify(1)" class="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-100 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed" ${currentPageVerify === totalPages ? 'disabled' : ''}>Next <i class="fas fa-chevron-right ml-1"></i></button>
        </div>`;
    }
    verifyList.innerHTML = cardsHtml.join("") + paginationHtml;
}

function changePageVerify(direction) {
    currentPageVerify += direction; renderVerify();
}

// --- Animasi per-card ---
function verifikasiDenganAnimasi(index, isDiterima) {
    const card = document.getElementById(`verify-card-${index}`);
    if (card) {
        const overlay = document.createElement('div');
        overlay.className = `absolute inset-0 flex flex-col items-center justify-center rounded-2xl z-10 ${
            isDiterima 
            ? 'bg-emerald-500/95' 
            : 'bg-red-600/95'
        }`;
        overlay.innerHTML = `
            <div class="text-center">
                <div class="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3 animate-bounce">
                    <i class="fas ${ isDiterima ? 'fa-check-circle' : 'fa-times-circle' } text-white text-4xl"></i>
                </div>
                <p class="text-white font-bold text-lg">${isDiterima ? 'Diterima!' : 'Ditolak!'}</p>
                <p class="text-white/80 text-xs mt-1">${isDiterima ? 'Profil terverifikasi valid' : 'Profil ditandai tidak relevan'}</p>
            </div>`;
        card.style.position = 'relative';
        card.style.overflow = 'hidden';
        card.appendChild(overlay);
        card.style.transform = isDiterima ? 'scale(0.97)' : 'scale(0.97)';
        setTimeout(() => {
            card.style.transition = 'all 0.4s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.85) translateY(-10px)';
        }, 700);
        setTimeout(() => {
            verifikasiManual(index, isDiterima);
        }, 1100);
    } else {
        verifikasiManual(index, isDiterima);
    }
}

// --- Verifikasi Massal ---
async function verifikasiMassal(isDiterima) {
    const perluVerifikasi = alumni.filter(a => a.status === "Perlu Verifikasi");
    if (perluVerifikasi.length === 0) return;

    const isConfirmed = await showCustomConfirm(
        isDiterima ? 'Terima Semua Profil?' : 'Tolak Semua Profil?',
        isDiterima
            ? `Anda akan menerima ${perluVerifikasi.length} profil sekaligus dan menandai semua sebagai "Teridentifikasi".\n\nLanjutkan?`
            : `Anda akan menolak ${perluVerifikasi.length} profil sekaligus dan menandai semua sebagai "Tidak Cocok".\n\nLanjutkan?`,
        isDiterima
            ? { bgClass: 'bg-emerald-50', iconClass: 'fas fa-check-double', textClass: 'text-emerald-600' }
            : { bgClass: 'bg-red-50', iconClass: 'fas fa-times-circle', textClass: 'text-red-600' },
        isDiterima ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-red-600 hover:bg-red-700',
        isDiterima ? 'Ya, Terima Semua' : 'Ya, Tolak Semua'
    );

    if (!isConfirmed) return;

    // Tunjukkan progress overlay
    const progressModal = document.createElement('div');
    progressModal.id = 'massVerifyProgress';
    progressModal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm';
    progressModal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center">
            <div class="w-20 h-20 rounded-2xl ${ isDiterima ? 'bg-emerald-50' : 'bg-red-50' } flex items-center justify-center mx-auto mb-5">
                <i class="fas ${ isDiterima ? 'fa-check-double' : 'fa-times-circle' } text-4xl ${ isDiterima ? 'text-emerald-500' : 'text-red-500' }"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-800 mb-2">${ isDiterima ? 'Memproses Penerimaan...' : 'Memproses Penolakan...' }</h3>
            <p class="text-gray-500 text-sm mb-5">Memproses <b>${perluVerifikasi.length}</b> data alumni...</p>
            <div class="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div id="massProgressBar" class="h-2 rounded-full transition-all duration-300 ${ isDiterima ? 'bg-emerald-500' : 'bg-red-500' }" style="width: 0%"></div>
            </div>
            <p id="massProgressText" class="text-xs text-gray-400 mt-2 font-medium">0 / ${perluVerifikasi.length}</p>
        </div>`;
    document.body.appendChild(progressModal);

    const bar = document.getElementById('massProgressBar');
    const txt = document.getElementById('massProgressText');
    const total = perluVerifikasi.length;

    for (let k = 0; k < total; k++) {
        // Harus cari indeks asli karena setiap iterasi array bisa berubah
        const targetAlumni = alumni.find(a => a.status === "Perlu Verifikasi");
        if (!targetAlumni) break;
        const idx = alumni.indexOf(targetAlumni);
        verifikasiManual(idx, isDiterima);
        
        const pct = Math.round(((k + 1) / total) * 100);
        bar.style.width = pct + '%';
        txt.textContent = `${k + 1} / ${total}`;
        await new Promise(r => setTimeout(r, 30));
    }

    setTimeout(() => {
        progressModal.remove();
        showCustomAlert(
            isDiterima ? 'Semua Profil Diterima!' : 'Semua Profil Ditolak!',
            isDiterima
                ? `${total} profil berhasil ditetapkan sebagai Teridentifikasi.`
                : `${total} profil berhasil ditolak dan ditandai Tidak Cocok.`,
            isDiterima
                ? { bgClass: 'bg-emerald-50', iconClass: 'fas fa-check-circle', textClass: 'text-emerald-500' }
                : { bgClass: 'bg-red-50', iconClass: 'fas fa-times-circle', textClass: 'text-red-500' }
        );
    }, 400);
}

// DASHBOARD CHARTS
function updateDashboard() {
    if (!document.getElementById("total")) return;
    document.getElementById("total").innerText = alumni.length;

    const totalCount = alumni.length;
    const identifiedCount = alumni.filter(a => a.status === "Teridentifikasi").length;
    const verifyCount = alumni.filter(a => a.status === "Perlu Verifikasi").length;
    const tidakCocokCount = alumni.filter(a => a.status === "Tidak Cocok").length;
    const belumDilacakCount = alumni.filter(a => a.status === "Belum Dilacak" || a.status === "Menganalisis...").length;

    document.getElementById("identified").innerText = identifiedCount;
    document.getElementById("verifyCount").innerText = verifyCount;
    if(document.getElementById("notMatchCount")) document.getElementById("notMatchCount").innerText = tidakCocokCount;

    // Update History List
    const historyList = document.getElementById("historyList");
    if (historyList) {
        if (alumni.length === 0) {
            historyList.innerHTML = `<div class="text-center text-gray-400 py-6 text-sm"><i class="fas fa-history text-3xl block mb-2 opacity-50"></i> Belum ada data masuk.</div>`;
        } else {
            const lastFive = [...alumni].reverse().slice(0, 5);
            const historyHtml = [];
            lastFive.forEach(item => {
                let dotColor = "bg-gray-400";
                if(item.status === "Teridentifikasi") dotColor = "bg-emerald-500";
                if(item.status === "Perlu Verifikasi") dotColor = "bg-yellow-400";
                if(item.status === "Tidak Cocok") dotColor = "bg-red-500";
                if(item.status === "Menganalisis...") dotColor = "bg-blue-500 animate-pulse";
                historyHtml.push(`
                <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition-colors">
                    <div class="w-3 h-3 rounded-full ${dotColor} flex-shrink-0 shadow-sm"></div>
                    <div class="flex-1 overflow-hidden">
                        <h4 class="text-sm font-semibold text-gray-800 truncate">${item.nama}</h4>
                        <p class="text-[10px] text-gray-500 truncate">${item.prodi} • ${item.tahun}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-[10px] font-bold px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600 shadow-sm">${item.score}%</span>
                    </div>
                </div>`);
            });
            historyList.innerHTML = historyHtml.join("");
        }
    }

    // Update Status Chart
    const ctx = document.getElementById('statusChart');
    if (ctx) {
        if (myChart !== null) myChart.destroy();
        
        const analyzedCount = identifiedCount + verifyCount + tidakCocokCount;
        const dataStatus = analyzedCount === 0 ? [1] : [identifiedCount, verifyCount, tidakCocokCount];
        const colorStatus = analyzedCount === 0 ? ['#f3f4f6'] : ['#10b981', '#fbbf24', '#ef4444'];
        const labelStatus = analyzedCount === 0 ? ['Belum ada analisis'] : ['Teridentifikasi', 'Perlu Verifikasi', 'Tidak Cocok'];

        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labelStatus,
                datasets: [{
                    data: dataStatus, backgroundColor: colorStatus, borderWidth: 3, borderColor: '#ffffff', hoverOffset: 6, borderRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false, cutout: '75%',
                elements: { center: { text: analyzedCount.toString(), label: 'Telah Dianalisis' } },
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { family: "'Poppins', sans-serif", size: 12, weight: '500' } } } }
            }
        });
    }

    // Update Volume Chart
    const volumeCtx = document.getElementById('volumeChart');
    if (volumeCtx) {
        if (volumeChart !== null) volumeChart.destroy();
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
                datasets: [{ label: 'Jumlah Alumni', data: counts, backgroundColor: 'rgba(177, 31, 36, 0.8)', borderColor: 'rgba(177, 31, 36, 1)', borderWidth: 1, borderRadius: 4 }]
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
        });
    }
}

// UI NAVIGATION LOGIC
function showPage(pageId) {
    document.querySelectorAll(".page-section").forEach(s => s.classList.add("hidden"));
    document.getElementById(pageId)?.classList.remove("hidden");
    
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

    localStorage.setItem('lastActivePage', pageId);

    setTimeout(() => {
        if(pageId === 'dashboard') updateDashboard();
        if(pageId === 'tracking') renderTable();
        if(pageId === 'verify') renderVerify();
    }, 20);
}
function login() {
    if (document.getElementById("username").value.trim() === "admin" && document.getElementById("password").value.trim() === "umm123") {
        localStorage.setItem("isLoggedIn", "true");
        document.getElementById("loginPage").classList.add("hidden");
        document.getElementById("app").classList.remove("hidden");
        showPage('dashboard');
    } else document.getElementById("loginError").classList.remove("hidden");
}
function logout() {
    if(confirm("Apakah Anda yakin ingin keluar?")) {
        localStorage.removeItem("isLoggedIn"); location.reload();
    }
}

// --- FUNGSI MODAL ---
function showDetailProfile(i) {
    const a = alumni[i];
    const modalId = 'detailModal';
    if (document.getElementById(modalId)) document.getElementById(modalId).remove();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 opacity-0 transition-opacity duration-300';
    modal.id = modalId;
    
    modal.innerHTML = `
        <div class="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden transform scale-95 translate-y-4 transition-all duration-300">
            <div class="sticky top-0 bg-gradient-to-r from-umm to-red-700 text-white p-6 md:p-8 flex justify-between items-start z-10">
                <div class="flex items-center gap-4">
                    <div class="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-sm">
                        <i class="fas fa-user-graduate text-2xl"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-bold tracking-tight">${a.nama || 'Profil Alumni'}</h2>
                        <p class="text-red-100 text-sm mt-1 font-medium">Lengkapi atau perbarui data jejak digital alumni.</p>
                    </div>
                </div>
                <button type="button" onclick="closeDetailProfile()" class="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors duration-200"><i class="fas fa-times text-xl"></i></button>
            </div>
            
            <div class="px-6 md:px-8 pb-8 overflow-y-auto flex-1 min-h-0 mt-6">
                <form id="detailForm" class="space-y-8">
                    <!-- Identitas -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"><i class="fas fa-id-card text-umm"></i> Identitas & Akademik</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Nama Lengkap</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-user text-gray-400"></i></div><input id="detail_nama" type="text" value="${a.nama || ''}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm/50 focus:border-umm outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Variasi Nama / Alias</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-tag text-gray-400"></i></div><input id="detail_variasi" type="text" value="${a.variasi || ''}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm/50 focus:border-umm outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Program Studi</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-book text-gray-400"></i></div><input id="detail_prodi" type="text" value="${a.prodi || ''}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm/50 focus:border-umm outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Tahun Lulus</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-calendar-alt text-gray-400"></i></div><input id="detail_tahun" type="number" value="${a.tahun || ''}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm/50 focus:border-umm outline-none transition-all"></div></div>
                            <div class="relative md:col-span-2"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Kota Tinggal Saat Ini</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-map-marker-alt text-gray-400"></i></div><input id="detail_kota" type="text" value="${a.kota || ''}" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-umm/50 focus:border-umm outline-none transition-all"></div></div>
                        </div>
                    </div>

                    <!-- Profil Eksternal -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"><i class="fas fa-globe text-blue-500"></i> Sumber Profil Eksternal</h3>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
                            <div class="md:col-span-1">
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Platform Eksternal</label>
                                <select id="detail_platform" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all cursor-pointer">
                                <option value="" ${!a.platform ? 'selected' : ''}>-- Pilih Platform --</option>
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
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">URL Profil / Bukti</label>
                                <div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-link text-gray-400"></i></div><input id="detail_url" type="url" value="${a.url || ''}" placeholder="https://..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Karir & Kontak -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"><i class="fas fa-briefcase text-emerald-500"></i> Karir & Kontak</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Email</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-envelope text-gray-400"></i></div><input id="detail_email" type="email" value="${a.email || ''}" placeholder="contoh@email.com" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">No HP / WhatsApp</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-phone text-gray-400"></i></div><input id="detail_phone" type="text" value="${a.phone || ''}" placeholder="08123456789" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Nama Instansi/Perusahaan</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-building text-gray-400"></i></div><input id="detail_workplace" type="text" value="${a.workplace || ''}" placeholder="PT Contoh Maju" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"></div></div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Posisi / Jabatan</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-user-tie text-gray-400"></i></div><input id="detail_position" type="text" value="${a.position || ''}" placeholder="Manager" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"></div></div>
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Jenis Pekerjaan</label>
                                <select id="detail_employment_type" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all cursor-pointer">
                                    <option value="" ${!a.employment_type ? 'selected' : ''}>-- Pilih Jenis --</option>
                                    <option value="PNS" ${a.employment_type === 'PNS' ? 'selected' : ''}>PNS / ASN</option>
                                    <option value="Swasta" ${a.employment_type === 'Swasta' ? 'selected' : ''}>Pegawai Swasta</option>
                                    <option value="Wirausaha" ${a.employment_type === 'Wirausaha' ? 'selected' : ''}>Wirausaha / Bisnis Sendiri</option>
                                </select>
                            </div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Alamat Perusahaan</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-map text-gray-400"></i></div><input id="detail_workplace_address" type="text" value="${a.workplace_address || ''}" placeholder="Jl. Merdeka No. 1" class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 outline-none transition-all"></div></div>
                        </div>
                    </div>

                    <!-- Sosial Media Perusahaan -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 border-b border-gray-100 pb-2 mb-4 flex items-center gap-2"><i class="fas fa-share-alt text-purple-500"></i> Sosial Media Perusahaan</h3>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Platform Sosial Media</label>
                                <select id="detail_social_media_platform" class="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all cursor-pointer">
                                <option value="" ${!a.social_media_platform ? 'selected' : ''}>-- Pilih Media Sosial --</option>
                                <option value="LinkedIn" ${a.social_media_platform === 'LinkedIn' ? 'selected' : ''}>LinkedIn</option>
                                <option value="Instagram" ${a.social_media_platform === 'Instagram' ? 'selected' : ''}>Instagram</option>
                                <option value="Facebook" ${a.social_media_platform === 'Facebook' ? 'selected' : ''}>Facebook</option>
                                <option value="TikTok" ${a.social_media_platform === 'TikTok' ? 'selected' : ''}>TikTok</option>
                                <option value="Twitter" ${a.social_media_platform === 'Twitter' ? 'selected' : ''}>Twitter</option>
                                <option value="YouTube" ${a.social_media_platform === 'YouTube' ? 'selected' : ''}>YouTube</option>
                                <option value="Lainnya" ${a.social_media_platform === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                                </select>
                            </div>
                            <div class="relative"><label class="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">URL Media Sosial</label><div class="relative"><div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><i class="fas fa-link text-gray-400"></i></div><input id="detail_social_media_url" type="url" value="${a.social_media_url || ''}" placeholder="https://..." class="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all"></div></div>
                        </div>
                    </div>
                </form>
            </div>
            
            <div class="bg-white p-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <button id="autoFillBtn" type="button" onclick="autoFillProfile(${i})" class="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-md"><i class="fas fa-satellite-dish"></i> Ekstrak Profil</button>
                <button type="button" onclick="saveDetailProfile(${i})" class="w-full bg-umm hover:bg-umm-dark text-white py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2 shadow-md"><i class="fas fa-save"></i> Simpan</button>
                <button type="button" onclick="deleteDetailProfile(${i})" class="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-3 rounded-xl font-semibold transition flex items-center justify-center gap-2"><i class="fas fa-trash-alt"></i> Hapus</button>
                <button type="button" onclick="document.getElementById('detailModal').remove()" class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 rounded-xl font-semibold transition">Tutup</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    requestAnimationFrame(() => {
        modal.classList.remove('opacity-0');
        modal.querySelector('div').classList.remove('scale-95', 'translate-y-4');
    });
}
function saveDetailProfile(i) {
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
    alert('Data detail profil berhasil disimpan.');
    closeDetailProfile();
}
function deleteDetailProfile(i) { hapus(i); closeDetailProfile(); }

function closeDetailProfile() {
    const modal = document.getElementById('detailModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    const inner = modal.querySelector('div');
    if (inner) { inner.classList.add('scale-95', 'translate-y-4'); }
    setTimeout(() => modal.remove(), 300);
}

// ==========================================
// FUNGSI CUSTOM ALERT & CONFIRM DIALOG
// ==========================================
function showCustomConfirm(title, message, iconHtml, confirmBtnClass, confirmText) {
    return new Promise((resolve) => {
        const modalId = 'customConfirmModal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300';
        
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-300">
                <div class="flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${iconHtml.bgClass}">
                        <i class="${iconHtml.iconClass} text-3xl ${iconHtml.textClass}"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
                    <p class="text-gray-500 text-sm mb-6 whitespace-pre-line leading-relaxed">${message}</p>
                    <div class="flex gap-3 w-full">
                        <button id="btnCancelConfirm" class="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Batal</button>
                        <button id="btnOkConfirm" class="flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md ${confirmBtnClass}">${confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        requestAnimationFrame(() => {
            modal.classList.remove('opacity-0');
            modal.querySelector('div').classList.remove('scale-95');
        });

        const closeModal = (result) => {
            modal.classList.add('opacity-0');
            modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => { modal.remove(); resolve(result); }, 300); 
        };
        document.getElementById('btnCancelConfirm').onclick = () => closeModal(false);
        document.getElementById('btnOkConfirm').onclick = () => closeModal(true);
    });
}

function showAIOptionsModal(totalData) {
    return new Promise((resolve) => {
        const modalId = 'aiOptionsModal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const maxBatch = Math.min(50, totalData);
        const minBatch = Math.min(5, totalData);
        const defaultBatch = maxBatch;

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300';
        
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 transform scale-95 transition-transform duration-300">
                <div class="flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 bg-blue-50 text-blue-600"><i class="fas fa-brain text-3xl"></i></div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">Lacak Massal (AI)</h3>
                    <p class="text-gray-500 text-sm mb-6 leading-relaxed">Pilih mode pelacakan AI. Memproses banyak data memerlukan waktu dan kuota token API Google.</p>
                    
                    <div class="w-full space-y-3 text-left mb-6">
                        <label class="flex items-start gap-3 p-4 border-2 border-blue-400 bg-blue-50 rounded-xl cursor-pointer transition">
                            <input type="radio" name="aiMode" value="batch" checked class="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500">
                            <div class="flex-1 w-full">
                                <div class="flex justify-between items-center">
                                    <div class="font-bold text-blue-800 text-sm">Lacak Sebagian</div>
                                    <span id="batchValueDisplay" class="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">${defaultBatch} Data</span>
                                </div>
                                <div class="text-xs text-blue-600 mt-1 leading-relaxed">Sangat direkomendasikan. Mencegah limit Token API terkuras drastis.</div>
                                
                                <div class="mt-4 transition-all" id="batchSliderContainer">
                                    <input type="range" id="aiBatchSlider" min="${minBatch}" max="${maxBatch}" value="${defaultBatch}" class="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer slider-thumb">
                                    <div class="flex justify-between text-[10px] text-blue-500 font-medium mt-1">
                                        <span>${minBatch}</span>
                                        <span>${maxBatch}</span>
                                    </div>
                                </div>
                            </div>
                        </label>
                        
                        <label class="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition" id="lblAll">
                            <input type="radio" name="aiMode" value="all" class="mt-1 w-4 h-4 text-red-600 focus:ring-red-500">
                            <div class="flex-1">
                                <div class="font-bold text-gray-800 text-sm">Lacak Semua Data (${totalData} Alumni)</div>
                                <div class="text-xs text-gray-500 mt-1">Membutuhkan waktu antrean proses yang cukup lama.</div>
                                
                                <div class="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg hidden transition-all" id="warnAll">
                                    <label class="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" id="chkAgree" class="mt-0.5 w-4 h-4 text-red-600 rounded">
                                        <span class="text-xs text-red-700 font-medium leading-tight">Saya setuju untuk menunggu lama dan memahami risiko Token Limit habis.</span>
                                    </label>
                                </div>
                            </div>
                        </label>
                    </div>

                    <div class="flex gap-3 w-full">
                        <button id="btnCancelAI" class="flex-1 py-3 rounded-xl font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition">Batal</button>
                        <button id="btnOkAI" class="flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-blue-600 hover:bg-blue-700">Mulai Lacak</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        
        const radios = modal.querySelectorAll('input[name="aiMode"]');
        const warnAll = modal.querySelector('#warnAll');
        const chkAgree = modal.querySelector('#chkAgree');
        const btnOk = modal.querySelector('#btnOkAI');
        const batchSlider = modal.querySelector('#aiBatchSlider');
        const batchValueDisplay = modal.querySelector('#batchValueDisplay');
        const batchSliderContainer = modal.querySelector('#batchSliderContainer');

        if(batchSlider) {
            batchSlider.addEventListener('input', (e) => {
                batchValueDisplay.innerText = `${e.target.value} Data`;
            });
        }

        radios.forEach(r => r.addEventListener('change', (e) => {
            modal.querySelectorAll('label').forEach(lbl => { lbl.classList.remove('border-blue-400', 'bg-blue-50', 'border-red-400', 'bg-red-50/50'); lbl.classList.add('border-gray-200'); });
            const parentLabel = e.target.closest('label');
            if (e.target.value === 'all') {
                parentLabel.classList.replace('border-gray-200', 'border-red-400'); parentLabel.classList.add('bg-red-50/50');
                warnAll.classList.remove('hidden');
                btnOk.disabled = !chkAgree.checked; btnOk.className = btnOk.disabled ? "flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-gray-400 cursor-not-allowed" : "flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-red-600 hover:bg-red-700";
                if (batchSliderContainer) batchSliderContainer.classList.add('opacity-50', 'pointer-events-none');
            } else {
                parentLabel.classList.replace('border-gray-200', 'border-blue-400'); parentLabel.classList.add('bg-blue-50');
                warnAll.classList.add('hidden'); btnOk.disabled = false; btnOk.className = "flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-blue-600 hover:bg-blue-700";
                if (batchSliderContainer) batchSliderContainer.classList.remove('opacity-50', 'pointer-events-none');
            }
        }));
        chkAgree.addEventListener('change', (e) => { btnOk.disabled = !e.target.checked; btnOk.className = btnOk.disabled ? "flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-gray-400 cursor-not-allowed" : "flex-1 py-3 rounded-xl font-semibold text-white transition shadow-md bg-red-600 hover:bg-red-700"; });

        requestAnimationFrame(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); });
        const closeModal = (result) => { modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95'); setTimeout(() => { modal.remove(); resolve(result); }, 300); };
        
        document.getElementById('btnCancelAI').onclick = () => closeModal(null);
        btnOk.onclick = () => { 
            if(!btnOk.disabled) {
                closeModal({ 
                    mode: modal.querySelector('input[name="aiMode"]:checked').value,
                    batchSize: batchSlider ? parseInt(batchSlider.value) : 50
                }); 
            }
        };
    });
}

function goToPageVerify(page) {
    const perluVerifikasi = alumni.filter(a => a.status === "Perlu Verifikasi");
    const totalPages = Math.ceil(perluVerifikasi.length / rowsPerPageVerify) || 1;
    let p = parseInt(page);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    currentPageVerify = p; renderVerify();
    document.getElementById('verify').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showCustomAlert(title, message, iconHtml) {
    return new Promise((resolve) => {
        const modalId = 'customAlertModal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm opacity-0 transition-opacity duration-300';
        
        modal.innerHTML = `
            <div class="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-6 transform scale-95 transition-transform duration-300">
                <div class="flex flex-col items-center text-center">
                    <div class="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${iconHtml.bgClass}">
                        <i class="${iconHtml.iconClass} text-3xl ${iconHtml.textClass}"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-800 mb-2">${title}</h3>
                    <p class="text-gray-500 text-sm mb-6 whitespace-pre-line leading-relaxed">${message}</p>
                    <button id="btnOkAlert" class="w-full py-3 rounded-xl font-semibold text-white transition shadow-md bg-umm hover:bg-umm-dark">Mengerti</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        requestAnimationFrame(() => { modal.classList.remove('opacity-0'); modal.querySelector('div').classList.remove('scale-95'); });
        document.getElementById('btnOkAlert').onclick = () => {
            modal.classList.add('opacity-0'); modal.querySelector('div').classList.add('scale-95');
            setTimeout(() => { modal.remove(); resolve(true); }, 300);
        };
    });
}

function goToPageTable(page) {
    const totalPages = Math.ceil(alumni.length / rowsPerPageTable) || 1;
    let p = parseInt(page);
    if (isNaN(p) || p < 1) p = 1;
    if (p > totalPages) p = totalPages;
    currentPageTable = p; renderTable();
    document.getElementById('tracking').scrollIntoView({ behavior: 'smooth', block: 'start' });
}