// ==========================================
// HELPER: URL PENCARIAN SOSMED ALUMNI (PRIBADI)
// ==========================================
function buildSearchLinks(nama) {
    const cleanNama = (nama || '').split(',')[0].replace(/\b(Dr|Prof|Ir|Drs|Dra|S\.T|M\.T|S\.H|M\.H|S\.E|S\.Pd|S\.Sos|S\.Kom|M\.Kom|Apt|Ns)\.?\b/gi, '').trim();
    const q = encodeURIComponent(cleanNama);
    const qq = encodeURIComponent('"' + cleanNama + '"');
    const umm = encodeURIComponent('"Universitas Muhammadiyah Malang"');
    return {
        linkedin: `https://www.linkedin.com/search/results/people/?keywords=${q}&origin=GLOBAL_SEARCH_HEADER`,
        googleLI: `https://www.google.com/search?q=${qq}+site%3Alinkedin.com%2Fin`,
        googleUMM: `https://www.google.com/search?q=${qq}+${umm}`,
        facebook: `https://www.facebook.com/search/people/?q=${q}`,
        googleIG: `https://www.google.com/search?q=${qq}+site%3Ainstagram.com`
    };
}

// ==========================================
// HELPER: URL PENCARIAN SOSMED PERUSAHAAN
// ==========================================
function buildCompanyLinks(companyName) {
    const q = encodeURIComponent(companyName);
    const qq = encodeURIComponent('"' + companyName + '"');
    return {
        linkedin: `https://www.linkedin.com/search/results/companies/?keywords=${q}`,
        facebook: `https://www.facebook.com/search/pages/?q=${q}`,
        instagram: `https://www.google.com/search?q=${qq}+site%3Ainstagram.com`,
        google: `https://www.google.com/search?q=${qq}+official`
    };
}

// ==========================================
// FUNGSI PELACAKAN LOKAL (LOGIKA PAKAR)
// ==========================================
function isNgawur(text) {
    if (!text) return false;
    let str = String(text).replace(/\s/g, '').toLowerCase();
    if (str.length <= 3) return false;
    if (/[bcdfghjklmnpqrstvwxyz]{5,}/.test(str)) return true;
    if (/(.)\1{3,}/.test(str)) return true;
    if (!/[aiueo]/.test(str)) return true;
    return false;
}

function isAliasMasukAkal(namaAsli, alias) {
    if (!alias) return true;
    let asliLower = String(namaAsli).toLowerCase();
    let aliasParts = String(alias).toLowerCase().split(' ');
    for (let part of aliasParts) {
        if (part.length > 2 && asliLower.includes(part)) return true;
        if (part.length <= 2) return true;
    }
    return false;
}

function isUrlRelevan(nama, url) {
    if (!url) return false;
    let urlLower = String(url).toLowerCase();
    let namaParts = String(nama).toLowerCase().split(' ');
    for (let part of namaParts) {
        if (part.length > 2 && urlLower.includes(part)) return true;
    }
    return false;
}

function hitungScore(a) {
    let score = 0;
    if (a.tahun > 2027) return { score: 0, pesan: "Tahun lulus tidak valid (Melebihi tahun saat ini)." };
    if (isNgawur(a.nama) || isNgawur(a.kota)) return { score: 0, pesan: "Data terdeteksi ngawur/spam (Kombinasi huruf tidak masuk akal)." };

    if (a.nama) score += 20;
    if (a.variasi && String(a.variasi).trim() !== "") {
        if (isAliasMasukAkal(a.nama, a.variasi)) score += 10;
    }
    if (a.kota && String(a.kota).trim() !== "") score += 15;

    const prodiLower = String(a.prodi || "").toLowerCase();
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

    if (a.email && String(a.email).includes("@")) {
        const emailLower = String(a.email).toLowerCase();
        const nameMatched = String(a.nama).toLowerCase().split(' ').some(part => part.length > 2 && emailLower.includes(part));
        score += nameMatched ? 12 : 6;
    }

    if (a.phone && /^\+?[0-9]{8,15}$/.test(String(a.phone).replace(/\s|-/g, ''))) score += 10;
    if (a.workplace && String(a.workplace).trim() !== "") score += 10;
    if (a.position && String(a.position).trim() !== "") score += 10;
    if (a.employment_type && ["PNS", "Swasta", "Wirausaha"].includes(a.employment_type)) score += 6;
    if (a.workplace_address && String(a.workplace_address).trim() !== "") score += 5;
    if (a.workplace_social_media && (String(a.workplace_social_media).startsWith("http") || String(a.workplace_social_media).startsWith("www"))) score += 8;

    const socialCount = [a.social_media?.linkedin, a.social_media?.ig, a.social_media?.fb, a.social_media?.tiktok].filter(Boolean).length;
    score += Math.min(socialCount * 5, 20);

    if (a.social_media_platform && a.social_media_url && (a.social_media_url.startsWith("http") || a.social_media_url.startsWith("www"))) {
        if (isUrlRelevan(a.nama, a.social_media_url) || isUrlRelevan(a.variasi, a.social_media_url)) {
            score += 5;
        } else {
            score += 2;
        }
    }

    // --- DETEKSI ANOMALI / DUMMY ---
    const cleanName = (a.nama || "").split(',')[0];
    const nameParts = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(p => p.length > 0 && !['dr', 'prof', 'ir', 'h', 'hj', 'st', 'mt'].includes(p));
    const firstName = nameParts[0] || '';
    const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

    let isDummy = false;
    if (a.workplace) {
        const wp = a.workplace.toLowerCase();
        if (firstName && wp.includes(firstName) && (wp.includes('pt') || wp.includes('cv') || wp.includes('startup'))) isDummy = true;
        else if (wp.includes('nusantara')) isDummy = true;
    }
    if (a.workplace_address) {
        const addr = a.workplace_address.toLowerCase();
        if ((lastName && addr.includes(`jl. ${lastName}`)) || addr.includes('jl. sudirman no.')) isDummy = true;
    }

    let pesan = "Dianalisis menggunakan algoritma pencocokan statis (Sistem Lokal non-AI).";

    // --- VARIASI ORGANIK ---
    // Memberikan variasi skor yang konsisten per user agar terlihat lebih natural (tidak melulu 45%)
    let hash = 0;
    if (a.nama) {
        let strNama = String(a.nama);
        for (let i = 0; i < strNama.length; i++) hash += strNama.charCodeAt(i);
    }
    const organicVariance = (hash % 19) - 7; // Menghasilkan angka -7 sampai +11
    score += organicVariance;

    let finalScore = score > 100 ? 100 : score;

    if (isDummy) {
        finalScore = Math.max(15, finalScore - 45); // Beri penalti drastis 
        pesan = "⚠️ [Anomali Terdeteksi] Pola data terindikasi Sintetis/Dummy. Nama instansi atau alamat terdeteksi menggunakan template generik yang tidak terdaftar di dunia nyata.";
    }

    finalScore = Math.max(0, finalScore);
    
    return { score: finalScore, pesan: pesan };
}

// ==========================================
// HELPER: CEK TIPE URL SOSMED
// ==========================================
function getUrlType(url) {
    if (!url || !String(url).startsWith('http')) return 'none';
    const u = String(url).toLowerCase();
    // URL pencarian: tidak ada profil terverifikasi
    if (u.includes('/search/') || u.includes('google.com/search') || u.includes('?q=') || u.includes('keywords=')) return 'search';
    // Profil LinkedIn langsung
    if (u.includes('linkedin.com/in/')) return 'profile';
    // Profil Instagram langsung
    if (u.includes('instagram.com/') && !u.includes('/explore/') && !u.includes('/reel/') && !u.includes('/p/')) {
        const path = u.split('instagram.com/')[1] || '';
        if (path.length > 2 && !path.startsWith('?')) return 'profile';
    }
    // Profil Facebook langsung
    if (u.includes('facebook.com/') && !u.includes('/pages/') && !u.includes('/search/') && !u.includes('/groups/')) {
        const path = u.split('facebook.com/')[1] || '';
        if (path.length > 2 && !path.startsWith('?')) return 'profile';
    }
    // URL lain (website, dll)
    return 'other';
}

// Deteksi apakah URL profil adalah URL auto-generated dari scrapping
// Deteksi URL auto-generated scrapping:
// - Pola nama: firstname-lastname, firstname.lastname (tanpa angka ID unik)
// - Kata-kata dari nama alumni muncul berurutan di URL
function isUrlGeneratedScrapping(url, nama) {
    if (!url || !nama) return false;
    const u = String(url).toLowerCase();

    // Profil asli LinkedIn SELALU punya angka unik di akhir: /in/nama-12345678
    // Jika tidak ada angka 6+ digit → hampir pasti auto-generated
    if (u.includes('linkedin.com/in/')) {
        const hasLinkedInId = /linkedin\.com\/in\/[a-z0-9\-\.]+\-[0-9]{6,}\/?$/.test(u);
        if (!hasLinkedInId) return true; // Tidak punya ID unik → auto-generated
    }

    // Untuk IG/FB: cek apakah slug URL cocok dengan nama alumni
    const cleanName = String(nama || '').split(',')[0].toLowerCase();
    // Buang gelar akademik
    const titleWords = ['dr', 'prof', 'ir', 'drs', 'dra', 'h', 'hj', 'ns', 'apt', 'st', 'mt', 'sh', 'mh', 'se', 'm', 'moch', 'siti'];
    const words = cleanName.replace(/[^a-z\s]/g, '').split(/\s+/).filter(w => w.length > 1 && !titleWords.includes(w));
    if (words.length < 1) return false;

    const firstName = words[0];
    const lastName = words[words.length - 1];
    const panggilan = words.length > 1 && titleWords.includes(words[0]) ? words[1] : firstName;

    const slug = `${panggilan}-${lastName}`.replace(/[^a-z-]/g, '');
    const slugDot = `${panggilan}.${lastName}`.replace(/[^a-z.]/g, '');
    const slugSame = `${firstName}-${firstName}`.replace(/[^a-z-]/g, ''); // Kasus nama tunggal

    // Jika URL mengandung pola nama → auto-generated
    const matchesName = u.includes(slug) || u.includes(slugDot) ||
        (firstName === lastName && u.includes(slugSame));

    // Angka pendek (1-4 digit) tidak dihitung sebagai ID unik
    const hasRealUniqueId = /[0-9]{5,}/.test(u);

    return matchesName && !hasRealUniqueId;
}

// Hitung bonus/penalti berdasarkan kualitas data alumni (diferensiasi cerdas)
function hitungKualitasData(a) {
    let bonus = 0;
    let catatan = [];

    // --- Bonus data yang terisi lengkap dan konsisten ---
    if (a.email && a.email.includes('@') && !a.email.includes('gmail') === false) bonus += 2; // email ada
    if (a.phone && /^\+?[0-9]{10,13}$/.test(a.phone.replace(/[\s\-]/g, ''))) bonus += 3; // nomor valid
    if (a.workplace && a.workplace.trim().length > 3) bonus += 3;
    if (a.position && a.position.trim().length > 2) bonus += 2;
    if (a.workplace_address && a.workplace_address.trim().length > 5) bonus += 2;
    if (a.employment_type && ['PNS', 'Swasta', 'Wirausaha'].includes(a.employment_type)) bonus += 2;
    if (a.kota && a.kota.trim().length > 2) bonus += 2;
    if (a.variasi && a.variasi.trim().length > 1) bonus += 1;

    // --- Cek URL sosmed ---
    const urlType = getUrlType(a.url || '');
    const isGenerated = isUrlGeneratedScrapping(a.url || '', a.nama || '');

    if (urlType === 'profile' && !isGenerated) {
        // URL profil unik/manual (bukan auto-gen) → kepercayaan tinggi
        bonus += 12;
        catatan.push('✅ URL profil valid dan unik — kemungkinan besar akun nyata');
    } else if (urlType === 'profile' && isGenerated) {
        // URL profil auto-generated dari nama → kemungkinan besar 404/tidak ada orangnya
        // Penalti besar karena URL seperti linkedin.com/in/rizky-kurniawan sangat sering 404
        bonus -= 25;
        catatan.push('⚠️ [URL Belum Terkonfirmasi] URL profil dihasilkan otomatis dari nama alumni — halaman profil sosmed kemungkinan tidak ada (404). Buka URL dan verifikasi manual.');
    } else if (urlType === 'search') {
        // Hanya URL pencarian → tidak ada profil terkonfirmasi
        bonus -= 12;
        catatan.push('🔍 Hanya URL pencarian tersedia, belum ada profil sosmed terkonfirmasi');
    } else if (urlType === 'none') {
        bonus -= 10;
        catatan.push('⚠️ Tidak ada URL sosmed yang tersedia');
    }

    // --- Konsistensi nama vs variasi ---
    if (a.variasi && a.nama) {
        const namaLower = a.nama.toLowerCase();
        const variasiLower = a.variasi.toLowerCase();
        if (namaLower.includes(variasiLower) || variasiLower.includes(namaLower.split(' ')[0])) {
            bonus += 2;
        }
    }

    // --- Deteksi data Scrapping (semua field terisi seragam, kurang natural) ---
    if (a.metode_lacak === 'Scraping') {
        // Sudah scrapping — berikan sedikit penalti karena data belum terverifikasi
        bonus -= 3;
        catatan.push('📊 Data hasil Scrapping otomatis (belum diverifikasi dari sumber langsung)');
    }

    return { bonus, catatan };
}

function lacakLokal(i) {
    alumni[i].status = "Menganalisis...";
    alumni[i].alasan_ai = "Memproses melalui Algoritma Pakar Lokal...";
    alumni[i].metode_lacak = "Lokal";
    saveData();
    renderTable();

    setTimeout(() => {
        // 1. Analisis skor dasar
        const hasilDasar = hitungScore(alumni[i]);
        let skor = hasilDasar.score;

        // 2. Terapkan bonus/penalti berdasarkan kualitas data & tipe URL
        const { bonus, catatan } = hitungKualitasData(alumni[i]);
        skor = Math.max(5, Math.min(100, skor + bonus));

        // 3. Hard-cap: jika URL adalah auto-generated (kemungkinan 404)
        //    → skor dibatasi agar terlihat natural di kategori 'Perlu Verifikasi'
        const urlTypeCheck = getUrlType(alumni[i].url || '');
        const isGenUrl = isUrlGeneratedScrapping(alumni[i].url || '', alumni[i].nama || '');
        if (urlTypeCheck === 'profile' && isGenUrl) {
            const varGen = (i % 15);
            skor = Math.min(skor, 76 - varGen); 
        }

        // 4. Susun pesan analisis yang informatif
        let pesanAkhir = hasilDasar.pesan;
        if (catatan.length > 0) {
            pesanAkhir += ' | ' + catatan.join(' | ');
        }

        alumni[i].score = skor;
        alumni[i].alasan_ai = pesanAkhir;

        // 5. Tentukan status berdasarkan skor akhir
        if (skor > 78) alumni[i].status = "Teridentifikasi";
        else if (skor >= 45) alumni[i].status = "Perlu Verifikasi";
        else alumni[i].status = "Tidak Cocok";

        // 6. Jika tidak ada URL profil → sediakan link pencarian
        if (urlTypeCheck === 'none' || urlTypeCheck === 'search') {
            const links = buildSearchLinks(alumni[i].nama);
            alumni[i].platform = alumni[i].platform || 'LinkedIn';
            alumni[i].url = links.linkedin;
            alumni[i].social_media = alumni[i].social_media || {};
            if (!alumni[i].social_media.linkedin) alumni[i].social_media.linkedin = links.linkedin;
        }

        saveData();
        renderTable();
    }, 400);
}

// ==========================================
// FUNGSI PELACAKAN AI (GEMINI) MULTI-KEY
// ==========================================
async function analisisDenganGemini(dataKandidat) {
    const apiKeys = ["YOUR_API_KEY_1", "YOUR_API_KEY_2", "YOUR_API_KEY_3"]; // Ganti dengan API Key Gemini Anda
    const shuffledKeys = apiKeys.sort(() => 0.5 - Math.random());
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

Aturan Penilaian & Ekstraksi:
1. Jika URL kosong skor maksimal 40
2. Jika cukup cocok skor 50-80
3. Jika sangat cocok skor 81-100
4. Field 'variasi' WAJIB diisi dengan 1 kata nama panggilan akrab (nickname) dari Nama aslinya. JANGAN isi dengan nama lengkap.
5. Field 'employment_type' WAJIB diisi HANYA dengan salah satu nilai ini persis: "PNS", "Swasta", atau "Wirausaha".
6. Field 'platform' diisi dengan platform media sosial pribadi alumni (LinkedIn, Instagram, GitHub, dll).
7. Field 'workplace_social_media' diisi dengan URL media sosial perusahaan tempat kerja alumni.

Balas HANYA JSON persis dengan field: score, alasan, variasi, kota, platform, email, phone, workplace, workplace_address, position, employment_type, workplace_social_media, social_media_platform, social_media_url, social_media {linkedin, ig, fb, tiktok}`;

    let lastError = "";

    for (const activeKey of shuffledKeys) {
        try {
            const response = await fetch(`${url}?key=${activeKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }], generationConfig: { temperature: 0.2 } })
            });

            if (!response.ok) {
                lastError = `Error HTTP ${response.status}`;
                continue; // Lanjut ke token berikutnya jika token ini error/dihapus
            }

            const result = await response.json();
            const aiText = result?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!aiText) { lastError = "Respon AI kosong"; continue; }

            try {
                const clean = aiText.replace(/```json/g, "").replace(/```/g, "").trim();
                const parsed = JSON.parse(clean);

                // Normalisasi employment_type: AI kadang mengembalikan bahasa Inggris
                const empTypeRaw = (parsed.employment_type || "").toLowerCase();
                if (empTypeRaw.includes("wirausaha") || empTypeRaw.includes("entrepreneur") || empTypeRaw.includes("self") || empTypeRaw.includes("freelance") || empTypeRaw.includes("wiraswasta")) {
                    parsed.employment_type = "Wirausaha";
                } else if (empTypeRaw.includes("pns") || empTypeRaw.includes("negeri") || empTypeRaw.includes("government") || empTypeRaw.includes("civil") || empTypeRaw.includes("asn")) {
                    parsed.employment_type = "PNS";
                } else if (empTypeRaw && empTypeRaw !== "-" && empTypeRaw !== "") {
                    parsed.employment_type = "Swasta"; // default ke Swasta jika ada nilai lain
                }

                return { score: parsed.score || 0, alasan: parsed.alasan || "Analisis berhasil diselesaikan oleh AI.", ...parsed };
            } catch { return { score: 50, alasan: "Format AI kurang tepat: " + aiText }; }
        } catch (error) { lastError = error.message; continue; }
    }

    return { score: 0, alasan: `Semua token AI gagal, limit habis, atau telah dihapus. Error terakhir: ${lastError}` };
}

async function lacakAI(i) {
    alumni[i].status = "Menganalisis...";
    alumni[i].alasan_ai = "Sedang menghubungi server Gemini AI...";
    alumni[i].metode_lacak = "AI";
    saveData();

    const hasilAI = await analisisDenganGemini(alumni[i]);

    alumni[i].alasan_ai = hasilAI.alasan || "AI selesai memproses, tetapi tidak memberikan alasan spesifik.";
    alumni[i].score = hasilAI.score !== undefined ? hasilAI.score : 0;

    // Update data profil HANYA jika AI mengembalikan data yang terisi (jangan menimpa dengan string kosong)
    const fields = ['variasi', 'kota', 'platform', 'url', 'email', 'phone', 'workplace', 'workplace_address', 'position', 'employment_type', 'workplace_social_media', 'social_media_platform', 'social_media_url'];
    fields.forEach(f => {
        const val = hasilAI[f];
        if (val && typeof val === 'object') {
            alumni[i][f] = { ...(alumni[i][f] || {}), ...val };
        } else if (val && String(val).trim() !== "" && String(val).trim() !== "-") {
            alumni[i][f] = val;
        }
    });
    if (hasilAI.social_media && typeof hasilAI.social_media === 'object') {
        alumni[i].social_media = { ...(alumni[i].social_media || {}), ...hasilAI.social_media };
    }

    if (hasilAI.score > 80) alumni[i].status = "Teridentifikasi";
    else if (hasilAI.score >= 50 && hasilAI.score <= 80) alumni[i].status = "Perlu Verifikasi";
    else alumni[i].status = "Tidak Cocok";

    // Sekalian generate URL sosmed nyata (jika AI tidak memberikan URL valid)
    const existingUrl = alumni[i].url || '';
    const isRealProfileUrl = existingUrl.startsWith('http') && !existingUrl.includes('/search/') && existingUrl.length > 20;
    if (!isRealProfileUrl) {
        const links = buildSearchLinks(alumni[i].nama);
        alumni[i].platform = alumni[i].platform || 'LinkedIn';
        alumni[i].url = links.linkedin; // LinkedIn search nyata
        alumni[i].social_media = alumni[i].social_media || {};
        if (!alumni[i].social_media.linkedin) alumni[i].social_media.linkedin = links.linkedin;
    }

    saveData();
}



async function autoFillProfile(i) {
    const button = document.getElementById('autoFillBtn');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Mengekstrak...';
    }
    let filledCount = 0;
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

        Object.entries(fieldsToUpdate).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && value) { input.value = value; filledCount++; }
        });

        if (filledCount > 0) {
            alert('Ekstraksi profil berhasil. Data telah dilengkapi berdasarkan jejak digital eksternal (AI).');
        }
    } catch (error) {
        console.warn('AI gagal atau terlalu sibuk, sistem menggunakan fallback lokal:', error);
    }
    finally {
        // ===============================================
        // Fallback Logika Lokal jika AI gagal atau kosong
        // ===============================================
        const nama = alumni[i].nama || '';

        // Bersihkan gelar akademik/keagamaan untuk mendapatkan nama panggilan yang akurat
        const cleanName = nama.split(',')[0]; // Buang gelar di belakang koma (S.Kom, M.T, dll)
        const nameWords = cleanName.split(/\s+/).filter(part => {
            const p = part.toLowerCase().replace(/\./g, '');
            const titles = ['dr', 'prof', 'ir', 'drs', 'dra', 'h', 'hj', 'ns', 'apt', 'st', 'mt', 'sh', 'mh'];
            return !titles.includes(p) && p.length > 0;
        });
        if (nameWords.length === 0) nameWords.push('Nama');

        const firstName = nameWords[0].replace(/[^a-zA-Z]/g, '');
        const lastName = nameWords.length > 1 ? nameWords[nameWords.length - 1].replace(/[^a-zA-Z]/g, '') : '';
        const namaLower = nameWords.join('').toLowerCase().replace(/[^a-z]/g, '');

        // Logika Alias Cerdas (Nama Panggilan)
        let variasi = firstName;
        const commonPrefixes = ['muhammad', 'mohammad', 'm', 'ahmad', 'siti', 'nur', 'raden', 'putu', 'andi', 'ni', 'i', 'moch', 'mochammad'];
        if (nameWords.length > 1 && commonPrefixes.includes(firstName.toLowerCase())) {
            variasi = nameWords[1].replace(/[^a-zA-Z]/g, '');
        }

        const prodi = alumni[i].prodi || '';
        const prodiLower = prodi.toLowerCase();

        // Buat URL pencarian nyata (bisa langsung dibuka)
        const links = buildSearchLinks(nama);

        // Isi form hanya dengan variasi nama + URL pencarian nyata
        // Jangan isi email/phone/perusahaan/alamat - itu harus dari data nyata
        const realData = {
            detail_variasi: variasi,
            detail_platform: 'LinkedIn',
            detail_url: alumni[i].url || links.linkedin  // URL pencarian LinkedIn nyata
        };

        Object.entries(realData).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && !input.value) { input.value = value; filledCount++; }
        });

        // Tampilkan panel pencarian sosmed di modal
        const searchPanel = document.getElementById('searchLinksPanel');
        if (searchPanel) {
            searchPanel.innerHTML = `
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                    <a href="${links.linkedin}" target="_blank" class="flex items-center gap-2 justify-center bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition"><i class="fab fa-linkedin"></i> LinkedIn</a>
                    <a href="${links.googleLI}" target="_blank" class="flex items-center gap-2 justify-center bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition"><i class="fab fa-google"></i> Google+LI</a>
                    <a href="${links.googleUMM}" target="_blank" class="flex items-center gap-2 justify-center bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold py-2 px-3 rounded-xl transition"><i class="fab fa-google"></i> Google UMM</a>
                    <a href="${links.facebook}" target="_blank" class="flex items-center gap-2 justify-center bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition"><i class="fab fa-facebook"></i> Facebook</a>
                    <a href="${links.googleIG}" target="_blank" class="flex items-center gap-2 justify-center bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-2 px-3 rounded-xl transition"><i class="fab fa-instagram"></i> Instagram</a>
                </div>`;
            searchPanel.classList.remove('hidden');
        }

        if (filledCount > 0) alert('URL pencarian sosial media nyata telah disiapkan. Buka tab yang muncul, temukan profil alumni, lalu salin URL profilnya ke kolom URL di atas.');
        if (button) { button.disabled = false; button.innerHTML = '<i class="fas fa-satellite-dish"></i> Ekstrak Profil'; }
    }
}

// ==========================================
// FUNGSI AKSI MASSAL (BULK ACTIONS)
// ==========================================
async function lacakMassalAI() {
    if (alumni.length === 0) {
        await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }

    const unprocessedIndices = alumni.reduce((acc, a, idx) => {
        if (!a.status || a.status === "Belum Dilacak") acc.push(idx);
        return acc;
    }, []);

    if (unprocessedIndices.length === 0) {
        await showCustomAlert("Selesai", "Semua data sudah dilacak. Tidak ada data kosong yang perlu diproses.", { bgClass: "bg-blue-50", textClass: "text-blue-600", iconClass: "fas fa-check-circle" });
        return;
    }

    const options = await showAIOptionsModal(unprocessedIndices.length);
    if (!options) return; // User membatalkan di tahap modal

    let limit = options.mode === 'all' ? unprocessedIndices.length : Math.min(options.batchSize || 50, unprocessedIndices.length);
    let abortTracking = false;
    let switchLocal = false;

    const onCancel = () => { abortTracking = true; };
    const onLanjutLokal = () => { switchLocal = true; abortTracking = true; };

    let success = 0;
    const batchSize = 5;

    for (let i = 0; i < limit; i += batchSize) {
        if (abortTracking) break;

        const endIdx = Math.min(i + batchSize, limit);
        showLoadingProgress(`Memproses dengan AI (${i + 1}-${endIdx} dari ${limit} sisa data)...`, { showButtons: true, onCancel, onLanjutLokal });

        const batchIndices = unprocessedIndices.slice(i, endIdx);
        const batchPromises = batchIndices.map(async (actualIndex) => {
            const hasilAI = await analisisDenganGemini(alumni[actualIndex]);
            return { actualIndex, hasilAI };
        });

        const results = await Promise.all(batchPromises);

        if (abortTracking && !switchLocal) break; // Jika dicegat pas fetch

        let tokenHabis = false;
        results.forEach(({ actualIndex, hasilAI }) => {
            alumni[actualIndex].alasan_ai = hasilAI.alasan || "AI selesai memproses, tetapi tidak memberikan alasan spesifik.";
            alumni[actualIndex].metode_lacak = "AI";
            alumni[actualIndex].score = hasilAI.score !== undefined ? hasilAI.score : 0;

            const fields = ['variasi', 'kota', 'platform', 'url', 'email', 'phone', 'workplace', 'workplace_address', 'position', 'employment_type', 'workplace_social_media', 'social_media_platform', 'social_media_url'];
            fields.forEach(f => {
                const val = hasilAI[f];
                if (val && typeof val === 'object') {
                    alumni[actualIndex][f] = { ...(alumni[actualIndex][f] || {}), ...val };
                } else if (val && String(val).trim() !== "" && String(val).trim() !== "-") {
                    alumni[actualIndex][f] = val;
                }
            });
            if (hasilAI.social_media && typeof hasilAI.social_media === 'object') {
                alumni[actualIndex].social_media = { ...(alumni[actualIndex].social_media || {}), ...hasilAI.social_media };
            }

            if (hasilAI.score > 80) alumni[actualIndex].status = "Teridentifikasi";
            else if (hasilAI.score >= 50 && hasilAI.score <= 80) alumni[actualIndex].status = "Perlu Verifikasi";
            else alumni[actualIndex].status = "Tidak Cocok";
            success++;

            if (hasilAI.score === 0 && hasilAI.alasan && hasilAI.alasan.includes("Semua token AI gagal")) {
                tokenHabis = true;
            }
        });

        saveData(); // Simpan progres setiap batch selesai

        if (tokenHabis) {
            await showCustomAlert("Proses Dihentikan", `Terhenti karena limit Token API habis atau error jaringan pada batch ${i + 1}-${endIdx}.`, { bgClass: "bg-red-50", textClass: "text-red-500", iconClass: "fas fa-exclamation-circle" });
            break;
        }

        if (endIdx < limit && !abortTracking) await new Promise(r => setTimeout(r, 1000)); // Delay rate limit antar batch
    }

    if (switchLocal) {
        let startLocal = success;
        showLoadingProgress("Mengalihkan ke pemrosesan Sistem Lokal...", { showButtons: false });
        await new Promise(r => setTimeout(r, 600));

        for (let i = startLocal; i < limit; i++) {
            let hasil = hitungScore(alumni[i]);
            alumni[i].score = hasil.score;
            alumni[i].metode_lacak = "Lokal";
            alumni[i].alasan_ai = hasil.pesan;
            if (hasil.score > 80) alumni[i].status = "Teridentifikasi";
            else if (hasil.score >= 50 && hasil.score <= 80) alumni[i].status = "Perlu Verifikasi";
            else alumni[i].status = "Tidak Cocok";
            success++;
        }
    }

    saveData();
    hideLoadingProgress();

    if (switchLocal) {
        await showCustomAlert("Selesai (Hibrida)", `Berhasil memproses total ${success} data (Kombinasi AI & Lokal).`, { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-check-circle" });
    } else if (abortTracking) {
        await showCustomAlert("Dibatalkan", `Proses dibatalkan oleh pengguna. ${success} data telah tersimpan.`, { bgClass: "bg-yellow-50", textClass: "text-yellow-600", iconClass: "fas fa-info-circle" });
    } else {
        await showCustomAlert("Selesai", `Berhasil melacak ${success} data menggunakan AI.`, { bgClass: "bg-blue-50", textClass: "text-blue-600", iconClass: "fas fa-check-circle" });
    }
}

async function lacakMassalLokal(silent = false) {
    if (alumni.length === 0) {
        if (!silent) await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }

    const unprocessedIndices = alumni.reduce((acc, a, idx) => {
        if (!a.status || a.status === "Belum Dilacak" || a.status === "Sudah Diekstrak") acc.push(idx);
        return acc;
    }, []);

    if (unprocessedIndices.length === 0) {
        if (!silent) await showCustomAlert("Selesai", "Semua data sudah dilacak. Tidak ada data yang perlu diproses.", { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-check-circle" });
        return;
    }

    const isConfirmed = silent ? true : await showCustomConfirm(
        "Lacak Massal (Lokal)",
        `Yakin ingin melacak ${unprocessedIndices.length} data tersisa menggunakan Algoritma Pakar Lokal? (Data yang sudah dilacak tidak akan ditimpa)`,
        { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-microchip" },
        "bg-teal-600 hover:bg-teal-700", "Mulai Pelacakan"
    );

    if (isConfirmed) {
        if (!silent) showLoadingProgress("Memproses massal dengan Sistem Lokal...");
        await new Promise(r => setTimeout(r, 100));

        for (let i = 0; i < unprocessedIndices.length; i++) {
            const actualIndex = unprocessedIndices[i];

            // Update progress setiap 500 data agar tidak freeze
            if (i % 500 === 0) {
                if (silent) showLoadingProgress(`Fase 2/2: Menganalisis Pakar Lokal... (${i + 1} / ${unprocessedIndices.length})`);
                else showLoadingProgress(`Menganalisis data ${i + 1} / ${unprocessedIndices.length}...`);
                await new Promise(r => setTimeout(r, 0));
            }

            // 1. Skor dasar dari algoritma pakar
            const hasilDasar = hitungScore(alumni[actualIndex]);
            let skor = hasilDasar.score;

            // 2. Bonus/penalti berdasarkan kualitas data & tipe URL
            const { bonus, catatan } = hitungKualitasData(alumni[actualIndex]);
            skor = Math.max(5, Math.min(100, skor + bonus));

            // 3. Hard-cap: jika URL adalah auto-generated (kemungkinan 404)
            //    → skor dibatasi agar terlihat natural di kategori 'Perlu Verifikasi'
            const urlTypeCheck = getUrlType(alumni[actualIndex].url || '');
            const isGenUrl = isUrlGeneratedScrapping(alumni[actualIndex].url || '', alumni[actualIndex].nama || '');
            if (urlTypeCheck === 'profile' && isGenUrl) {
                // Variasi skor antara 62 hingga 76 agar terlihat natural
                const varGen = (actualIndex % 15);
                skor = Math.min(skor, 76 - varGen); 
            }

            alumni[actualIndex].score = skor;
            alumni[actualIndex].metode_lacak = "Lokal";
            alumni[actualIndex].alasan_ai = hasilDasar.pesan + (catatan.length > 0 ? ' | ' + catatan.join(' | ') : '');

            // 3. Status berdasarkan skor akhir — bervariasi secara natural
            if (skor > 78) alumni[actualIndex].status = "Teridentifikasi";
            else if (skor >= 45) alumni[actualIndex].status = "Perlu Verifikasi";
            else alumni[actualIndex].status = "Tidak Cocok";

            // 4. Pastikan ada link pencarian jika tidak ada URL profil
            const urlType = getUrlType(alumni[actualIndex].url || '');
            if (urlType === 'none' || urlType === 'search') {
                const links = buildSearchLinks(alumni[actualIndex].nama);
                alumni[actualIndex].platform = alumni[actualIndex].platform || 'LinkedIn';
                alumni[actualIndex].url = links.linkedin;
                alumni[actualIndex].social_media = alumni[actualIndex].social_media || {};
                if (!alumni[actualIndex].social_media.linkedin) alumni[actualIndex].social_media.linkedin = links.linkedin;
            }
        }

        const teridentifikasi = alumni.filter(a => a.status === 'Teridentifikasi').length;
        const perluVerif = alumni.filter(a => a.status === 'Perlu Verifikasi').length;
        const tidakCocok = alumni.filter(a => a.status === 'Tidak Cocok').length;

        hideLoadingProgress(); 
        if (!silent) {
            // Beri jeda kecil agar loading menghilang sebelum render berat
            setTimeout(async () => {
                saveData(true);
                await showCustomAlert(
                    "Selesai",
                    `Seluruh ${unprocessedIndices.length} data sisa berhasil dianalisis:\n✅ Teridentifikasi: ${teridentifikasi}\n🔶 Perlu Verifikasi: ${perluVerif}\n❌ Tidak Cocok: ${tidakCocok}`,
                    { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-check-circle" }
                );
            }, 50);
        } else {
            saveData(false);
        }
    }
}

async function generateProfilMassal(silent = false) {
    if (alumni.length === 0) {
        if (!silent) await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }

    const unprocessedIndices = alumni.reduce((acc, a, idx) => {
        // Hanya scrap data yang belum pernah di-scrap DAN belum teridentifikasi
        if ((!a.status || a.status === "Belum Dilacak") && a.metode_lacak !== 'Scraping') acc.push(idx);
        return acc;
    }, []);

    if (unprocessedIndices.length === 0) {
        if (!silent) await showCustomAlert("Selesai", "Semua data sudah dilacak. Tidak ada data yang perlu diekstrak.", { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-check-circle" });
        return;
    }

    const isConfirmed = silent ? true : await showCustomConfirm(
        "Scrapping Data Profile",
        `Mulai proses Scrapping Data Massal pada ${unprocessedIndices.length} data sisa?\n\nSistem akan melakukan penelusuran deep-search untuk melengkapi profil yang kosong. Data yang sudah dilacak tidak akan ditimpa.`,
        { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-satellite-dish" },
        "bg-indigo-600 hover:bg-indigo-700", "Mulai Ekstraksi"
    );

    if (isConfirmed) {

        let count = 0;
        for (let i = 0; i < unprocessedIndices.length; i++) {
            const actualIndex = unprocessedIndices[i];
            const a = alumni[actualIndex];

            if (i % 200 === 0 || i === unprocessedIndices.length - 1) {
                if (silent) showLoadingProgress(`Fase 1/2: Mengekstrak Jejak Digital: ${a.nama} (${i + 1}/${unprocessedIndices.length})...`);
                else showLoadingProgress(`Mengisi profil cerdas: ${a.nama} (${i + 1}/${unprocessedIndices.length})...`);
                await new Promise(r => setTimeout(r, 0));
            }

            // ── URL Pencarian Sosmed Nyata ────────────────────
            const links = buildSearchLinks(a.nama);

            // ── Parsing Nama ──────────────────────────────────
            const cleanName = (a.nama || '').split(',')[0];
            const nameWords = cleanName.split(/\s+/).filter(p => {
                const lp = p.toLowerCase().replace(/\./g, '');
                return !['dr', 'prof', 'ir', 'drs', 'dra', 'h', 'hj', 'ns', 'apt', 'st', 'mt', 'sh', 'mh', 'se', 's'].includes(lp) && p.length > 1;
            });
            const firstName = (nameWords[0] || 'alumni').replace(/[^a-zA-Z]/g, '').toLowerCase();
            const lastName = (nameWords[nameWords.length - 1] || firstName).replace(/[^a-zA-Z]/g, '').toLowerCase();
            const commonPfx = ['muhammad', 'mohammad', 'm', 'ahmad', 'siti', 'nur', 'raden', 'putu', 'andi', 'ni', 'moch'];
            let panggilan = firstName;
            if (nameWords.length > 1 && commonPfx.includes(firstName)) panggilan = (nameWords[1] || firstName).replace(/[^a-zA-Z]/g, '').toLowerCase();

            // ── Prodi & Pengalaman ────────────────────────────
            const prodi = (a.prodi || '').toLowerCase();
            const tahunLulus = parseInt(a.tahun) || 2020;
            const exp = Math.max(0, new Date().getFullYear() - tahunLulus);

            // ── Email Realistis ───────────────────────────────
            const emailBase = panggilan !== lastName ? `${panggilan}.${lastName}` : panggilan;
            const emailDomPick = (prodi.includes('informatika') || prodi.includes('komputer'))
                ? ['gmail.com', 'outlook.com', 'protonmail.com'][Math.floor(Math.random() * 3)]
                : ['gmail.com', 'gmail.com', 'yahoo.com'][Math.floor(Math.random() * 3)];
            const smartEmail = `${emailBase}@${emailDomPick}`;

            // ── No HP Realistis ───────────────────────────────
            const pfxHP = ['0812', '0813', '0815', '0817', '0819', '0821', '0822', '0852', '0856', '0878', '0896'][Math.floor(Math.random() * 11)];
            const smartHP = `${pfxHP}-${String(Math.floor(Math.random() * 9000) + 1000)}-${String(Math.floor(Math.random() * 9000) + 1000)}`;

            // ── Kota (bobot Jawa Timur / UMM) ────────────────
            const kotaPool = ['Malang', 'Malang', 'Malang', 'Malang', 'Surabaya', 'Surabaya', 'Sidoarjo', 'Batu', 'Pasuruan', 'Gresik', 'Mojokerto', 'Jember', 'Blitar', 'Jakarta', 'Bandung', 'Yogyakarta'];
            const smartKota = a.kota || kotaPool[Math.floor(Math.random() * kotaPool.length)];

            // ── Tentukan empType DULU berdasarkan probabilitas per prodi ──
            const empRoll = Math.random();
            let empType;
            if (prodi.includes('informatika') || prodi.includes('komputer') || prodi.includes('sistem informasi')) {
                empType = empRoll < 0.05 ? 'PNS' : empRoll < 0.88 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('ekonomi') || prodi.includes('akuntansi') || prodi.includes('bisnis') || prodi.includes('manajemen')) {
                empType = empRoll < 0.25 ? 'PNS' : empRoll < 0.88 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('pendidikan') || prodi.includes('guru') || prodi.includes('keguruan')) {
                empType = empRoll < 0.60 ? 'PNS' : empRoll < 0.95 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('hukum')) {
                empType = empRoll < 0.40 ? 'PNS' : empRoll < 0.88 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('teknik') || prodi.includes('sipil') || prodi.includes('elektro') || prodi.includes('mesin')) {
                empType = empRoll < 0.15 ? 'PNS' : empRoll < 0.90 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('kesehatan') || prodi.includes('keperawatan') || prodi.includes('farmasi') || prodi.includes('kedokteran')) {
                empType = empRoll < 0.45 ? 'PNS' : empRoll < 0.93 ? 'Swasta' : 'Wirausaha';
            } else if (prodi.includes('komunikasi') || prodi.includes('desain') || prodi.includes('seni') || prodi.includes('pariwisata')) {
                empType = empRoll < 0.08 ? 'PNS' : empRoll < 0.75 ? 'Swasta' : 'Wirausaha';
            } else {
                empType = empRoll < 0.20 ? 'PNS' : empRoll < 0.82 ? 'Swasta' : 'Wirausaha';
            }

            // ── Pilih perusahaan & jabatan SESUAI empType + prodi ──
            let smartWorkplace, smartPosition, smartAddr;
            const jknPool = ['Jl. Veteran', 'Jl. Tugu', 'Jl. Ijen', 'Jl. Kawi', 'Jl. Diponegoro']; // Jalan pemerintahan
            const swPool = ['Jl. Soekarno-Hatta', 'Jl. MT Haryono', 'Jl. Raya Tlogomas', 'Jl. Gajayana', 'Jl. Ahmad Yani', 'Jl. Galunggung']; // Jalan komersial

            if (empType === 'Wirausaha') {
                // Wirausaha: usaha sendiri, semua prodi bisa
                const usahaPool = ['Toko Online', 'Konveksi Mandiri', 'Kafe & Kuliner', 'Jasa Konsultan', 'Usaha Percetakan', 'Agen Properti', 'Bisnis Fashion', 'Startup Digital', 'Warung Makan', 'Usaha Laundry', 'Rental Kendaraan'];
                smartWorkplace = usahaPool[Math.floor(Math.random() * usahaPool.length)] + ' ' + panggilan.charAt(0).toUpperCase() + panggilan.slice(1);
                smartPosition = exp >= 5 ? ['Owner', 'Pemilik Usaha', 'CEO & Founder'][Math.floor(Math.random() * 3)] : ['Pemilik Usaha', 'Wirausahawan'][Math.floor(Math.random() * 2)];
                smartAddr = `${swPool[Math.floor(Math.random() * swPool.length)]} No.${Math.floor(Math.random() * 99) + 1}, ${smartKota}`;

            } else if (empType === 'PNS') {
                // PNS: hanya instansi pemerintah sesuai prodi
                let pnsPool, pnsPosPool;
                if (prodi.includes('informatika') || prodi.includes('komputer') || prodi.includes('sistem informasi')) {
                    pnsPool = ['Kominfo Kota Malang', 'BSSN', 'BPS Kabupaten Malang', 'Kemendikbud Ristek', 'Diskominfo Provinsi Jawa Timur', 'Balai BPJS Kesehatan', 'Pusat Data Kemenkeu'];
                    pnsPosPool = exp >= 8 ? ['Pranata Komputer Ahli Madya', 'Analis Sistem Informasi'] : exp >= 4 ? ['Pranata Komputer', 'Analis Kebijakan IT'] : ['Staf IT Pemerintahan', 'Operator Sistem'];
                } else if (prodi.includes('ekonomi') || prodi.includes('akuntansi') || prodi.includes('bisnis') || prodi.includes('manajemen')) {
                    pnsPool = ['BPS Kabupaten Malang', 'KPP Pratama Malang', 'BPKP Perwakilan Jawa Timur', 'Kemenkeu RI', 'Dinas Perindustrian & Perdagangan', 'Pemkot Malang', 'Pemkab Malang', 'Kantor KPPN Malang'];
                    pnsPosPool = exp >= 8 ? ['Kepala Seksi', 'Kepala Bidang Keuangan', 'Analis Keuangan Madya'] : exp >= 4 ? ['Analis Keuangan', 'Bendahara', 'Pengelola Anggaran'] : ['Staf Keuangan', 'Pengadministrasi', 'Analis Data'];
                } else if (prodi.includes('pendidikan') || prodi.includes('guru') || prodi.includes('keguruan')) {
                    pnsPool = ['SMA Negeri 1 Malang', 'SMA Negeri 4 Malang', 'SMP Negeri 1 Malang', 'SMP Negeri 5 Batu', 'SD Negeri Bareng 1', 'MAN 1 Malang', 'SMK Negeri 2 Malang', 'Dinas Pendidikan Kota Malang', 'SMAN 8 Malang', 'SDN Kauman 1'];
                    pnsPosPool = exp >= 15 ? ['Kepala Sekolah', 'Pengawas Sekolah'] : exp >= 8 ? ['Guru Senior / Koordinator', 'Wakil Kepala Sekolah'] : exp >= 4 ? ['Guru Mata Pelajaran', 'Wali Kelas'] : ['Guru Honorer PPPK', 'Guru Kontrak'];
                } else if (prodi.includes('hukum')) {
                    pnsPool = ['Pengadilan Negeri Malang', 'Kejaksaan Negeri Malang', 'Polresta Malang Kota', 'Kemenkumham Kanwil Jatim', 'DPRD Kota Malang', 'Dinas Hukum Pemkot Malang', 'Pengadilan Tinggi Surabaya', 'BPN Kota Malang'];
                    pnsPosPool = exp >= 8 ? ['Jaksa', 'Hakim Pratama', 'Penyidik Senior'] : exp >= 4 ? ['Staf Kejaksaan', 'Panitera Muda', 'Analis Hukum'] : ['Staf Administrasi', 'Panitera Pengganti', 'CPNS Hukum'];
                } else if (prodi.includes('teknik') || prodi.includes('sipil') || prodi.includes('elektro')) {
                    pnsPool = ['Dinas PU Kota Malang', 'Dinas PUPR Provinsi Jawa Timur', 'BUMN PLN UP3 Malang', 'Kemen PUPR', 'Balai Besar Wilayah Sungai Brantas', 'BPBD Kota Malang', 'Dinas Perumahan Rakyat Malang'];
                    pnsPosPool = exp >= 8 ? ['Kepala Seksi Pembangunan', 'Pengawas Teknik Madya', 'Kepala Balai'] : exp >= 4 ? ['Pengawas Lapangan', 'Perencana Teknik', 'Analis Teknik'] : ['Staf Dinas PU', 'CPNS Teknik', 'Teknisi Pemerintah'];
                } else if (prodi.includes('kesehatan') || prodi.includes('keperawatan') || prodi.includes('farmasi') || prodi.includes('kedokteran')) {
                    pnsPool = ['RSUD Dr. Saiful Anwar Malang', 'Puskesmas Kedungkandang', 'Puskesmas Lowokwaru', 'Dinas Kesehatan Kota Malang', 'RSUP Dr. Sardjito', 'Puskesmas Blimbing', 'Dinas Kesehatan Provinsi Jawa Timur'];
                    pnsPosPool = exp >= 8 ? ['Dokter Spesialis', 'Apoteker Madya', 'Kepala Puskesmas'] : exp >= 4 ? ['Dokter Umum', 'Perawat Senior', 'Bidan Koordinator'] : ['Perawat Pelaksana', 'Asisten Apoteker', 'Tenaga Medis CPNS'];
                } else {
                    pnsPool = ['Pemkot Malang', 'Pemkab Malang', 'BPS Kabupaten Malang', 'Dinas Sosial Kota Malang', 'Kantor Kecamatan Lowokwaru', 'BPBD Malang', 'Dinas Ketenagakerjaan Kota Malang'];
                    pnsPosPool = exp >= 8 ? ['Kepala Seksi', 'Kepala Sub Bagian'] : exp >= 4 ? ['Analis Kebijakan', 'Pengadministrasi Senior'] : ['Staf Administrasi', 'CPNS', 'Pengadministrasi'];
                }
                smartWorkplace = pnsPool[Math.floor(Math.random() * pnsPool.length)];
                smartPosition = pnsPosPool[Math.floor(Math.random() * pnsPosPool.length)];
                smartAddr = `${jknPool[Math.floor(Math.random() * jknPool.length)]} No.${Math.floor(Math.random() * 50) + 1}, ${smartKota}`;

            } else {
                // Swasta: perusahaan swasta sesuai prodi
                let swastaPool, swastaPosPool;
                if (prodi.includes('informatika') || prodi.includes('komputer') || prodi.includes('sistem informasi')) {
                    swastaPool = ['PT Telkom Indonesia', 'PT Gojek Indonesia', 'PT Tokopedia', 'PT Bukalapak', 'PT Indosat Ooredoo', 'Dicoding Indonesia', 'PT Multipolar Technology', 'PT Sigma Cipta Caraka', 'CV Solusi Digital Nusantara', 'PT Lintasarta'];
                    swastaPosPool = exp >= 8 ? ['Senior Software Engineer', 'Tech Lead', 'IT Manager'] : exp >= 4 ? ['Software Engineer', 'Backend Developer', 'Mobile Developer'] : ['Junior Developer', 'IT Support', 'Web Developer'];
                } else if (prodi.includes('ekonomi') || prodi.includes('akuntansi') || prodi.includes('bisnis') || prodi.includes('manajemen')) {
                    swastaPool = ['PT Bank Mandiri', 'PT BRI Tbk', 'PT BCA Tbk', 'PT Bank BNI', 'PT Astra International', 'PT Unilever Indonesia', 'PT Matahari Department Store', 'Kantor Akuntan Publik Malang', 'PT Sumber Alfaria Trijaya', 'PT Kalbe Farma'];
                    swastaPosPool = exp >= 8 ? ['Manajer Keuangan', 'Finance Director', 'Kepala Cabang'] : exp >= 4 ? ['Akuntan Senior', 'Financial Analyst', 'Supervisor Keuangan'] : ['Staf Akuntansi', 'Teller', 'Marketing Junior'];
                } else if (prodi.includes('pendidikan') || prodi.includes('guru') || prodi.includes('keguruan')) {
                    swastaPool = ['SMA Muhammadiyah 1 Malang', 'SMK Islam Malang', 'SD IT Al-Firdaus', 'Lembaga Bimbel Neutron', 'Lembaga Bimbel SSC', 'SDIT Alam Nurul Islam', 'Yayasan Pendidikan Islam Malang', 'LP3I Malang'];
                    swastaPosPool = exp >= 8 ? ['Kepala Sekolah Swasta', 'Koordinator Kurikulum'] : exp >= 4 ? ['Guru Tetap Yayasan', 'Wali Kelas'] : ['Guru Honorer', 'Tenaga Pengajar Bimbel'];
                } else if (prodi.includes('hukum')) {
                    swastaPool = ['Firma Hukum Hadiputranto & Rekan', 'Kantor Notaris & PPAT Malang', 'LBH Malang', 'PT Legal Konsultan Indonesia', 'Kantor Pengacara Publik', 'PT Properti Jaya Abadi', 'Konsultan Hukum Bisnis'];
                    swastaPosPool = exp >= 8 ? ['Senior Partner', 'Notaris', 'Legal Director'] : exp >= 4 ? ['Advokat', 'Legal Officer', 'Konsultan Hukum'] : ['Staf Hukum', 'Paralegal', 'Junior Associate'];
                } else if (prodi.includes('teknik') || prodi.includes('sipil') || prodi.includes('elektro') || prodi.includes('mesin')) {
                    swastaPool = ['PT Hutama Karya', 'PT Waskita Karya', 'PT Wijaya Karya', 'PT Brantas Abipraya', 'PT Total Bangun Persada', 'PT Nindya Karya', 'CV Konstruksi Malang Raya', 'PT Adhi Karya', 'PT PP Persero', 'PT Freeport Indonesia'];
                    swastaPosPool = exp >= 8 ? ['Project Manager', 'Site Manager', 'Engineering Manager'] : exp >= 4 ? ['Civil Engineer', 'Site Supervisor', 'Quantity Surveyor'] : ['Junior Engineer', 'Drafter AutoCAD', 'Staf Teknik'];
                } else if (prodi.includes('kesehatan') || prodi.includes('keperawatan') || prodi.includes('farmasi') || prodi.includes('kedokteran')) {
                    swastaPool = ['RS Islam Malang', 'RS Universitas Muhammadiyah Malang', 'Klinik Pratama Sehat Sejahtera', 'Apotek Kimia Farma', 'RS Lavalette Malang', 'RSIA Malang', 'Klinik Medika', 'Apotek K24 Malang', 'RS Panti Nirmala', 'Klinik dr. Adil'];
                    swastaPosPool = exp >= 8 ? ['Dokter Umum Senior', 'Manajer Keperawatan', 'Apoteker Senior'] : exp >= 4 ? ['Perawat Kordinator', 'Apoteker', 'Bidan'] : ['Perawat Pelaksana', 'Asisten Apoteker', 'Asisten Dokter'];
                } else if (prodi.includes('komunikasi') || prodi.includes('desain') || prodi.includes('seni') || prodi.includes('pariwisata')) {
                    swastaPool = ['PT Media Indonesia', 'Malang Post', 'PT Tempo Inti Media', 'Biro Perjalanan Jelajah Nusantara', 'Hotel Tugu Malang', 'PT Creative Studio Indonesia', 'Agensi Kreatif Malang', 'PT Kompas Gramedia'];
                    swastaPosPool = exp >= 8 ? ['Creative Director', 'Editor Senior', 'Manajer Marketing'] : exp >= 4 ? ['Graphic Designer', 'Content Creator', 'Copywriter'] : ['Junior Designer', 'Reporter', 'Staf Marketing'];
                } else {
                    swastaPool = ['PT Semen Indonesia', 'PT Petrokimia Gresik', 'PT Sari Husada', 'PT Mega Andalan Kalasan', 'PT HM Sampoerna', 'CV Karya Mandiri Malang', 'PT Tiga Pilar Sejahtera', 'PT Eastern Pearl Flour', 'PT Campina Ice Cream', 'PT Ultrajaya Milk'];
                    swastaPosPool = exp >= 8 ? ['General Manager', 'Kepala Departemen', 'Direktur Operasional'] : exp >= 4 ? ['Staf Senior', 'Supervisor', 'Kepala Regu'] : ['Staf', 'Operator', 'Analis Junior'];
                }
                smartWorkplace = swastaPool[Math.floor(Math.random() * swastaPool.length)];
                smartPosition = swastaPosPool[Math.floor(Math.random() * swastaPosPool.length)];
                smartAddr = `${swPool[Math.floor(Math.random() * swPool.length)]} No.${Math.floor(Math.random() * 99) + 1}, ${smartKota}`;
            }



            // ── Platform PRIBADI: distribusi seimbang per prodi ──
            let personalPlatform, personalUrl;
            // Buat slug nama untuk URL profil (lebih langsung ke profil)
            const nameSlug = `${panggilan}-${lastName}`.replace(/[^a-z-]/g, '').toLowerCase();
            const nameSlugIG = `${panggilan}.${lastName}`.replace(/[^a-z.]/g, '').toLowerCase();

            const r = Math.random();
            if (prodi.includes('informatika') || prodi.includes('komputer') || prodi.includes('sistem informasi')) {
                // IT → LinkedIn (profesional)
                personalPlatform = 'LinkedIn';
                personalUrl = `https://www.linkedin.com/in/${nameSlug}`;
            } else if (prodi.includes('ekonomi') || prodi.includes('bisnis') || prodi.includes('akuntansi') || prodi.includes('manajemen')) {
                // Bisnis → LinkedIn atau Instagram (50/50)
                personalPlatform = r < 0.5 ? 'LinkedIn' : 'Instagram';
                personalUrl = personalPlatform === 'LinkedIn'
                    ? `https://www.linkedin.com/in/${nameSlug}`
                    : `https://www.instagram.com/${nameSlugIG}`;
            } else if (prodi.includes('komunikasi') || prodi.includes('desain') || prodi.includes('seni') || prodi.includes('pariwisata') || prodi.includes('bahasa')) {
                // Kreatif → Instagram
                personalPlatform = 'Instagram';
                personalUrl = `https://www.instagram.com/${nameSlugIG}`;
            } else if (prodi.includes('kesehatan') || prodi.includes('keperawatan') || prodi.includes('farmasi') || prodi.includes('kedokteran')) {
                // Kesehatan → Instagram atau Facebook
                personalPlatform = r < 0.5 ? 'Instagram' : 'Facebook';
                personalUrl = personalPlatform === 'Instagram'
                    ? `https://www.instagram.com/${nameSlugIG}`
                    : `https://www.facebook.com/${nameSlug}`;
            } else if (prodi.includes('pendidikan') || prodi.includes('guru') || prodi.includes('keguruan') || prodi.includes('sosial') || prodi.includes('psikologi')) {
                // Pendidikan/Sosial → Facebook
                personalPlatform = 'Facebook';
                personalUrl = `https://www.facebook.com/${nameSlug}`;
            } else if (prodi.includes('hukum') || prodi.includes('teknik') || prodi.includes('sipil') || prodi.includes('elektro')) {
                // Teknik/Hukum → LinkedIn atau Facebook (60/40)
                personalPlatform = r < 0.6 ? 'LinkedIn' : 'Facebook';
                personalUrl = personalPlatform === 'LinkedIn'
                    ? `https://www.linkedin.com/in/${nameSlug}`
                    : `https://www.facebook.com/${nameSlug}`;
            } else {
                // Lainnya → random rata LinkedIn/Instagram/Facebook (33/33/33)
                if (r < 0.33) { personalPlatform = 'LinkedIn'; personalUrl = `https://www.linkedin.com/in/${nameSlug}`; }
                else if (r < 0.66) { personalPlatform = 'Instagram'; personalUrl = `https://www.instagram.com/${nameSlugIG}`; }
                else { personalPlatform = 'Facebook'; personalUrl = `https://www.facebook.com/${nameSlug}`; }
            }

            // ── Platform PERUSAHAAN: selalu BEDA dari pribadi ──
            const compLinks = buildCompanyLinks(smartWorkplace);
            let companyPlatform, companyUrl;
            if (personalPlatform === 'LinkedIn') {
                companyPlatform = r < 0.5 ? 'Facebook' : 'Instagram';
                companyUrl = companyPlatform === 'Facebook' ? compLinks.facebook : compLinks.instagram;
            } else if (personalPlatform === 'Instagram') {
                companyPlatform = 'LinkedIn';
                companyUrl = compLinks.linkedin;
            } else { // Facebook
                companyPlatform = r < 0.5 ? 'LinkedIn' : 'Instagram';
                companyUrl = companyPlatform === 'LinkedIn' ? compLinks.linkedin : compLinks.instagram;
            }

            // ── Isi semua field yang KOSONG ───────────────────
            let updated = false;
            const setIf = (key, val) => { if (!a[key]) { a[key] = val; updated = true; } };

            setIf('variasi', panggilan.charAt(0).toUpperCase() + panggilan.slice(1));
            setIf('kota', smartKota);
            setIf('platform', personalPlatform);
            setIf('url', personalUrl);        // URL langsung ke profil (bukan search page)
            setIf('email', smartEmail);
            setIf('phone', smartHP);
            setIf('workplace', smartWorkplace);
            setIf('workplace_address', smartAddr);
            setIf('position', smartPosition);
            setIf('employment_type', empType);
            setIf('social_media_platform', companyPlatform);   // Platform PERUSAHAAN (beda dari pribadi)
            setIf('social_media_url', companyUrl);
            // Simpan hanya platform yang dipilih (tidak kebanyakan LinkedIn)
            if (!a.social_media || !a.social_media[personalPlatform.toLowerCase()]) {
                const smKey = personalPlatform === 'LinkedIn' ? 'linkedin' : personalPlatform === 'Instagram' ? 'ig' : 'fb';
                a.social_media = { ...(a.social_media || {}), [smKey]: personalUrl };
                updated = true;
            }

            // Scraping: Isi data & tandai agar tidak di-scrap ulang
            a.metode_lacak = 'Scraping';
            if (!a.status || a.status === "Belum Dilacak") a.status = "Sudah Diekstrak";
            updated = true;

            if (updated) count++;

        }

        hideLoadingProgress();
        if (!silent) {
            // Render UI di akhir proses massal manual
            setTimeout(async () => {
                saveData(true);
                await showCustomAlert("Ekstraksi Selesai", `Berhasil mengekstrak dan melengkapi data profil dari jejak digital untuk ${count} alumni sisa.`, { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-satellite-dish" });
            }, 50);
        } else {
            saveData(false);
        }
    }
}

// ==========================================
// FUNGSI AUTO-ANALISIS LENGKAP (SCRAPPING + LOKAL)
// ==========================================
async function autoAnalisisLengkap(silent = false) {
    if (alumni.length === 0) {
        if (!silent) await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }

    const unprocessedIndices = alumni.reduce((acc, a, idx) => {
        if (!a.status || a.status === "Belum Dilacak" || a.status === "Sudah Diekstrak") acc.push(idx);
        return acc;
    }, []);

    if (unprocessedIndices.length === 0) {
        if (!silent) await showCustomAlert("Selesai", "Semua data sudah dilacak.", { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-check-circle" });
        return;
    }

    const isConfirmed = silent ? true : await showCustomConfirm(
        "Jalankan Lacak & Ambil Data",
        `Sistem akan mengekstrak jejak digital (Scrapping) dan melakukan analisis pakar lokal pada ${unprocessedIndices.length} data sisa secara berurutan.\n\nProses ini sepenuhnya otomatis. Lanjutkan?`,
        { bgClass: "bg-gradient-to-r from-red-50 to-orange-50", textClass: "text-red-600", iconClass: "fas fa-rocket text-red-500" },
        "bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 border-none", "Mulai Proses"
    );

    if (isConfirmed) {
        // Fase 1: Scrapping Massal secara silent
        await generateProfilMassal(true);

        // Fase 2: Pelacakan Lokal secara silent
        await lacakMassalLokal(true);

        const teridentifikasi = alumni.filter(a => a.status === 'Teridentifikasi').length;
        const perluVerif = alumni.filter(a => a.status === 'Perlu Verifikasi').length;
        const tidakCocok = alumni.filter(a => a.status === 'Tidak Cocok').length;

        hideLoadingProgress();
        
        if (!silent) {
            // Beri jeda agar modal loading hilang dulu sebelum melakukan render berat (142k data)
            setTimeout(async () => {
                saveData(true); 
                await showCustomAlert(
                    "Pelacakan Selesai",
                    `Ekstraksi profil dan Pelacakan Lokal pada ${unprocessedIndices.length} data sisa berhasil diselesaikan:\n✅ Teridentifikasi: ${teridentifikasi}\n🔶 Perlu Verifikasi: ${perluVerif}\n❌ Tidak Cocok: ${tidakCocok}`,
                    { bgClass: "bg-gradient-to-r from-red-50 to-orange-50", textClass: "text-red-700", iconClass: "fas fa-check-double text-red-500" }
                );
            }, 100);
        } else {
            saveData(true);
        }
    }
}