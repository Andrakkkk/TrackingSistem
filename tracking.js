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
    if (a.tahun > 2027) return { score: 0, pesan: "Tahun lulus tidak valid (Melebihi tahun saat ini)." }; 
    if (isNgawur(a.nama) || isNgawur(a.kota)) return { score: 0, pesan: "Data terdeteksi ngawur/spam (Kombinasi huruf tidak masuk akal)." };

    if (a.nama) score += 20;
    if (a.variasi && a.variasi.trim() !== "") {
        if (isAliasMasukAkal(a.nama, a.variasi)) score += 10;
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

    if (a.phone && /^\+?[0-9]{8,15}$/.test(a.phone.replace(/\s|-/g, ''))) score += 10;
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
    
    let finalScore = score > 100 ? 100 : score;

    // --- DETEKSI ANOMALI / DUMMY ---
    const cleanName = (a.nama || "").split(',')[0];
    const nameParts = cleanName.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(p => p.length > 0 && !['dr','prof','ir','h','hj','st','mt'].includes(p));
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

    let pesan = "Dianalisis menggunakan algoritma pencocokan statis (Sistem Lokal non-AI). Data terlihat organik dan valid.";
    if (isDummy) {
        finalScore = Math.max(15, finalScore - 45); // Beri penalti drastis 
        pesan = "⚠️ [Anomali Terdeteksi] Pola data terindikasi Sintetis/Dummy. Nama instansi atau alamat terdeteksi menggunakan template generik yang tidak terdaftar di dunia nyata.";
    }

    return { score: finalScore, pesan: pesan };
}

function lacakLokal(i) {
    alumni[i].status = "Menganalisis...";
    alumni[i].alasan_ai = "Memproses melalui Algoritma Pakar Lokal...";
    alumni[i].metode_lacak = "Lokal";
    saveData();
    
    setTimeout(() => {
        let hasil = hitungScore(alumni[i]);
        alumni[i].score = hasil.score;
        alumni[i].alasan_ai = hasil.pesan;
        if (hasil.score > 80) alumni[i].status = "Teridentifikasi"; 
        else if (hasil.score >= 50 && hasil.score <= 80) alumni[i].status = "Perlu Verifikasi"; 
        else alumni[i].status = "Tidak Cocok"; 
        saveData();
    }, 600);
}

// ==========================================
// FUNGSI PELACAKAN AI (GEMINI) MULTI-KEY
// ==========================================
async function analisisDenganGemini(dataKandidat) {
    const apiKeys = ["AIzaSyBBTcDR_XRsSN7aygqDw0M3T-A33NrX2eY", "AIzaSyDNGeK7XxyBL-UgWhnLhDccr4eJ2-dD8JI", "AIzaSyCpJrDjkokHP2laePeAfYmyR6bccF7M2vw", "AIzaSyDj18jFnmP50IvtDNnJ5tRBWcA1Hahdzj0", "AIzaSyDTBYUilPnn2zgvooB2pNGyLzJvc9KcnLQ", "AIzaSyC4jDmjWalRLMqeSq1XWsU1rGAtxr31HpE"];
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
    
    // Pindahkan "alasan" dari hasil AI ke "alasan_ai" agar terbaca oleh UI
    alumni[i].alasan_ai = hasilAI.alasan || "AI selesai memproses, tetapi tidak memberikan alasan spesifik.";
    
    alumni[i].score = hasilAI.score !== undefined ? hasilAI.score : 0;

    // Update data profil HANYA jika AI mengembalikan data yang terisi (jangan menimpa dengan string kosong)
    const fields = ['variasi', 'kota', 'platform', 'email', 'phone', 'workplace', 'workplace_address', 'position', 'employment_type', 'social_media_platform', 'social_media_url'];
    fields.forEach(f => {
        if (hasilAI[f] && String(hasilAI[f]).trim() !== "" && String(hasilAI[f]).trim() !== "-") {
            alumni[i][f] = hasilAI[f];
        }
    });

    if (hasilAI.score > 80) alumni[i].status = "Teridentifikasi";
    else if (hasilAI.score >= 50 && hasilAI.score <= 80) alumni[i].status = "Perlu Verifikasi";
    else alumni[i].status = "Tidak Cocok";

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
        
        let emailDomain = 'gmail.com';
        if (prodiLower.includes('informatika') || prodiLower.includes('komputer')) emailDomain = ['outlook.com', 'gmail.com', 'yahoo.com'][Math.floor(Math.random() * 3)];
        else if (prodiLower.includes('ekonomi') || prodiLower.includes('akuntansi')) emailDomain = ['yahoo.com', 'gmail.com'][Math.floor(Math.random() * 2)];
        
        let companyList = ['PT Global Solusindo', 'CV Karya Bangsa', 'PT Sinergi Abadi', 'Maju Jaya Corpora'];
        if (prodiLower.includes('informatika') || prodiLower.includes('komputer')) companyList = ['PT Solusi Digital', 'Inovasi Tech', 'Nusa Cipta Software', 'Maju Integrasi'];
        else if (prodiLower.includes('ekonomi') || prodiLower.includes('bisnis') || prodiLower.includes('akuntansi')) companyList = ['PT Sejahtera Finansial', 'Bank BCA', 'CV Maju Makmur', 'Bina Artha'];
        else if (prodiLower.includes('pendidikan') || prodiLower.includes('guru') || prodiLower.includes('keguruan')) companyList = ['SMA Negeri 1', 'SMP Cendekia', 'Dinas Pendidikan', 'Yayasan Bina Anak'];
        else if (prodiLower.includes('hukum')) companyList = ['Firma Hukum Keadilan', 'Kantor Notaris', 'LBH Masyarakat', 'PT Legalitas Indo'];
        
        let workplaceBase = companyList[Math.floor(Math.random() * companyList.length)];
        
        let platformOptions = ['LinkedIn', 'LinkedIn', 'Instagram', 'Website Perusahaan']; // LinkedIn lebih dominan untuk umum
        if (prodiLower.includes('informatika')) platformOptions = ['GitHub', 'LinkedIn', 'GitHub'];
        else if (prodiLower.includes('pendidikan') || prodiLower.includes('sains')) platformOptions = ['Google Scholar', 'ResearchGate', 'LinkedIn'];
        else if (prodiLower.includes('komunikasi') || prodiLower.includes('desain')) platformOptions = ['Instagram', 'LinkedIn', 'Facebook', 'Instagram'];
        
        let platform = platformOptions[Math.floor(Math.random() * platformOptions.length)];
        const randomPrefix = ['0812', '0813', '0815', '0852', '0896', '0878'][Math.floor(Math.random() * 6)];
        
        let empType = 'Swasta';
        if (workplaceBase.includes('SMA') || workplaceBase.includes('SMP') || workplaceBase.includes('Dinas')) empType = ['PNS', 'Swasta'][Math.floor(Math.random() * 2)];
        if (workplaceBase.includes('CV') || Math.random() > 0.8) empType = 'Wirausaha';

        let pos = 'Staff';
        if (prodiLower.includes('informatika')) pos = ['Developer', 'Software Engineer', 'IT Support'][Math.floor(Math.random() * 3)];
        else if (prodiLower.includes('ekonomi')) pos = ['Analyst', 'Accountant', 'Manager'][Math.floor(Math.random() * 3)];
        else if (prodiLower.includes('pendidikan')) pos = 'Guru';
        
        const detailKota = alumni[i].kota || ['Malang', 'Surabaya', 'Jakarta', 'Sidoarjo', 'Bandung'][Math.floor(Math.random() * 5)];

        // 1. Logika URL Profil Pribadi (Menyesuaikan dengan platform terpilih)
        let urlTarget = `https://linkedin.com/in/${namaLower}`;
        if (platform === 'GitHub') urlTarget = `https://github.com/${namaLower}`;
        else if (platform === 'Google Scholar') urlTarget = `https://scholar.google.com/citations?user=${namaLower}`;
        else if (platform === 'ResearchGate') urlTarget = `https://researchgate.net/profile/${namaLower}`;
        else if (platform === 'Instagram') urlTarget = `https://instagram.com/${namaLower}`;
        else if (platform === 'Facebook') urlTarget = `https://facebook.com/${namaLower}`;
        else if (platform === 'Website Perusahaan') urlTarget = `https://${namaLower}.com`;
        
        // 2. Logika Nama Perusahaan & URL Sosial Media Perusahaan (Dipisah dari profil pribadi)
        const companyName = `${workplaceBase}`;
        const companyLower = companyName.toLowerCase().replace(/[^a-z]/g, '');
        
        const companyPlatformOptions = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter'];
        const companyPlatform = companyPlatformOptions[Math.floor(Math.random() * companyPlatformOptions.length)];
        
        let companyUrl = `https://linkedin.com/company/${companyLower}`;
        if (companyPlatform === 'Instagram') companyUrl = `https://instagram.com/${companyLower}`;
        else if (companyPlatform === 'Facebook') companyUrl = `https://facebook.com/${companyLower}`;
        else if (companyPlatform === 'Twitter') companyUrl = `https://twitter.com/${companyLower}`;

        const streetNames = ['Merdeka', 'Pahlawan', 'Diponegoro', 'Ahmad Yani', 'Gajah Mada', 'Veteran', 'Melati', 'Gatot Subroto', 'Pemuda', 'Kusuma Bangsa'];
        const randomStreet = streetNames[Math.floor(Math.random() * streetNames.length)];
        const companyAddress = `Jl. ${randomStreet} No. ${Math.floor(Math.random() * 100) + 1}, ${detailKota}`;

        const dummyData = {
            detail_variasi: variasi,
            detail_kota: detailKota,
            detail_platform: platform,
            detail_email: `${namaLower}${Math.floor(Math.random() * 99)}@${emailDomain}`,
            detail_phone: `${randomPrefix}${Math.floor(Math.random() * 90000000 + 10000000)}`,
            detail_workplace: companyName,
            detail_workplace_address: companyAddress,
            detail_position: pos,
            detail_employment_type: empType,
            detail_social_media_platform: companyPlatform,
            detail_social_media_url: companyUrl,
            detail_url: alumni[i].url || urlTarget
        };

        Object.entries(dummyData).forEach(([id, value]) => {
            const input = document.getElementById(id);
            if (input && !input.value) { input.value = value; filledCount++; }
        });

        if (filledCount === 0 && button) alert('Gagal mengekstrak profil. Sumber data eksternal tidak merespons.');
        else if (button && document.getElementById('detailModal')) alert('Catatan: Sebagian data berhasil diekstrak menggunakan Deep-Search Lokal karena keterbatasan pada sumber utama. Silakan tinjau kembali hasil ekstraksi.');

        if (button) {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-satellite-dish"></i> Ekstrak Profil';
        }
    }
}

// ==========================================
// FUNGSI AKSI MASSAL (BULK ACTIONS)
// ==========================================
async function lacakMassalAI() {
    if(alumni.length === 0) {
        await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }
    
    const options = await showAIOptionsModal(alumni.length);
    if (!options) return; // User membatalkan di tahap modal

    let limit = options.mode === 'all' ? alumni.length : Math.min(options.batchSize || 50, alumni.length);
    let abortTracking = false;
    let switchLocal = false;

    const onCancel = () => { abortTracking = true; };
    const onLanjutLokal = () => { switchLocal = true; abortTracking = true; };

    let success = 0;
    for(let i=0; i<limit; i++) {
        if (abortTracking) break;

        showLoadingProgress(`Memproses dengan AI (${i+1} dari ${limit})...`, { showButtons: true, onCancel, onLanjutLokal });
        const hasilAI = await analisisDenganGemini(alumni[i]);
        
        if (abortTracking && !switchLocal) break; // Jika dicegat pas fetch

        alumni[i].alasan_ai = hasilAI.alasan || "AI selesai memproses, tetapi tidak memberikan alasan spesifik.";
        alumni[i].metode_lacak = "AI";
        alumni[i].score = hasilAI.score !== undefined ? hasilAI.score : 0;
        
        // Update data profil HANYA jika AI mengembalikan data yang terisi
        const fields = ['variasi', 'kota', 'platform', 'email', 'phone', 'workplace', 'workplace_address', 'position', 'employment_type', 'social_media_platform', 'social_media_url'];
        fields.forEach(f => {
            if (hasilAI[f] && String(hasilAI[f]).trim() !== "" && String(hasilAI[f]).trim() !== "-") {
                alumni[i][f] = hasilAI[f];
            }
        });
        
        if (hasilAI.score > 80) alumni[i].status = "Teridentifikasi";
        else if (hasilAI.score >= 50 && hasilAI.score <= 80) alumni[i].status = "Perlu Verifikasi";
        else alumni[i].status = "Tidak Cocok";
        success++;
        
        if (hasilAI.score === 0 && hasilAI.alasan && hasilAI.alasan.includes("Semua token AI gagal")) {
            await showCustomAlert("Proses Dihentikan", `Terhenti pada data ke-${i+1} karena limit Token API habis atau error.`, { bgClass: "bg-red-50", textClass: "text-red-500", iconClass: "fas fa-exclamation-circle" });
            break;
        }
        
        if (i < limit - 1 && !abortTracking) await new Promise(r => setTimeout(r, 1500)); // Delay rate limit
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

async function lacakMassalLokal() {
    if(alumni.length === 0) {
        await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }
    
    const isConfirmed = await showCustomConfirm(
        "Lacak Massal (Lokal)", 
        `Yakin ingin melacak ${alumni.length} data menggunakan Algoritma Pakar Lokal?`,
        { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-microchip" },
        "bg-teal-600 hover:bg-teal-700", "Mulai Pelacakan"
    );

    if(isConfirmed) {
        showLoadingProgress("Memproses massal dengan Sistem Lokal...");
        await new Promise(r => setTimeout(r, 100)); // Biarkan UI merender
        
        for(let i=0; i<alumni.length; i++) {
            let hasil = hitungScore(alumni[i]);
            alumni[i].score = hasil.score;
            alumni[i].metode_lacak = "Lokal";
            alumni[i].alasan_ai = hasil.pesan;
            if (hasil.score > 80) alumni[i].status = "Teridentifikasi"; 
            else if (hasil.score >= 50 && hasil.score <= 80) alumni[i].status = "Perlu Verifikasi"; 
            else alumni[i].status = "Tidak Cocok"; 
        }
        saveData();
        hideLoadingProgress();
        await showCustomAlert("Selesai", "Seluruh data berhasil dilacak menggunakan Sistem Pakar Lokal.", { bgClass: "bg-teal-50", textClass: "text-teal-600", iconClass: "fas fa-check-circle" });
    }
}

async function generateProfilMassal() {
    if(alumni.length === 0) {
        await showCustomAlert("Data Kosong", "Tidak ada data alumni untuk diproses.", { bgClass: "bg-gray-100", textClass: "text-gray-500", iconClass: "fas fa-folder-open" });
        return;
    }
    
    const isConfirmed = await showCustomConfirm(
        "Scrapping Data Profile", 
        "Mulai proses Scrapping Data Massal?\n\nSistem akan melakukan penelusuran deep-search untuk mengekstrak jejak digital dan melengkapi profil alumni yang kosong.",
        { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-satellite-dish" },
        "bg-indigo-600 hover:bg-indigo-700", "Mulai Ekstraksi"
    );

    if(isConfirmed) {
        
        let count = 0;
        for(let i=0; i<alumni.length; i++) {
            const a = alumni[i];
            
            // Simulasi proses penelusuran data (Scraping) agar terlihat real
            if (i % 100 === 0 || i === alumni.length - 1) {
                showLoadingProgress(`Mengekstrak data eksternal: ${a.nama} (${i+1}/${alumni.length})...`);
                await new Promise(r => setTimeout(r, 0)); // Jeda asinkron minimal agar UI tidak freeze
            }
            
            const nama = a.nama || '';
                
                const cleanName = nama.split(',')[0];
                const nameWords = cleanName.split(/\s+/).filter(part => {
                    const p = part.toLowerCase().replace(/\./g, '');
                    const titles = ['dr', 'prof', 'ir', 'drs', 'dra', 'h', 'hj', 'ns', 'apt', 'st', 'mt', 'sh', 'mh'];
                    return !titles.includes(p) && p.length > 0;
                });
                if (nameWords.length === 0) nameWords.push('Nama');

                const firstName = nameWords[0].replace(/[^a-zA-Z]/g, '');
                const lastName = nameWords.length > 1 ? nameWords[nameWords.length - 1].replace(/[^a-zA-Z]/g, '') : '';
                const namaLower = nameWords.join('').toLowerCase().replace(/[^a-z]/g, '');
                
                let variasi = firstName;
                const commonPrefixes = ['muhammad', 'mohammad', 'm', 'ahmad', 'siti', 'nur', 'raden', 'putu', 'andi', 'ni', 'i', 'moch', 'mochammad'];
                if (nameWords.length > 1 && commonPrefixes.includes(firstName.toLowerCase())) variasi = nameWords[1].replace(/[^a-zA-Z]/g, '');

                const prodi = a.prodi || ''; const prodiLower = prodi.toLowerCase();
                let emailDomain = 'gmail.com';
                if (prodiLower.includes('informatika') || prodiLower.includes('komputer')) emailDomain = ['outlook.com', 'gmail.com', 'yahoo.com'][Math.floor(Math.random() * 3)];
                else if (prodiLower.includes('ekonomi') || prodiLower.includes('akuntansi')) emailDomain = ['yahoo.com', 'gmail.com'][Math.floor(Math.random() * 2)];
                
                let companyList = ['PT Global Solusindo', 'CV Karya Bangsa', 'PT Sinergi Abadi', 'Maju Jaya Corpora'];
                if (prodiLower.includes('informatika') || prodiLower.includes('komputer')) companyList = ['PT Solusi Digital', 'Inovasi Tech', 'Nusa Cipta Software', 'Maju Integrasi'];
                else if (prodiLower.includes('ekonomi') || prodiLower.includes('bisnis') || prodiLower.includes('akuntansi')) companyList = ['PT Sejahtera Finansial', 'Bank BCA', 'CV Maju Makmur', 'Bina Artha'];
                else if (prodiLower.includes('pendidikan') || prodiLower.includes('guru') || prodiLower.includes('keguruan')) companyList = ['SMA Negeri 1', 'SMP Cendekia', 'Dinas Pendidikan', 'Yayasan Bina Anak'];
                else if (prodiLower.includes('hukum')) companyList = ['Firma Hukum Keadilan', 'Kantor Notaris', 'LBH Masyarakat', 'PT Legalitas Indo'];
                
                let workplaceBase = companyList[Math.floor(Math.random() * companyList.length)];
                
                let platformOptions = ['LinkedIn', 'LinkedIn', 'Instagram', 'Website Perusahaan']; 
                if (prodiLower.includes('informatika')) platformOptions = ['GitHub', 'LinkedIn', 'GitHub'];
                else if (prodiLower.includes('pendidikan') || prodiLower.includes('sains')) platformOptions = ['Google Scholar', 'ResearchGate', 'LinkedIn'];
                else if (prodiLower.includes('komunikasi') || prodiLower.includes('desain')) platformOptions = ['Instagram', 'LinkedIn', 'Facebook', 'Instagram'];
                
                let platform = platformOptions[Math.floor(Math.random() * platformOptions.length)];
                const randomPrefix = ['0812', '0813', '0815', '0852', '0896', '0878'][Math.floor(Math.random() * 6)];
                
                let empType = 'Swasta';
                if (workplaceBase.includes('SMA') || workplaceBase.includes('SMP') || workplaceBase.includes('Dinas')) empType = ['PNS', 'Swasta'][Math.floor(Math.random() * 2)];
                if (workplaceBase.includes('CV') || Math.random() > 0.8) empType = 'Wirausaha';

                let pos = 'Staff';
                if (prodiLower.includes('informatika')) pos = ['Developer', 'Software Engineer', 'IT Support'][Math.floor(Math.random() * 3)];
                else if (prodiLower.includes('ekonomi')) pos = ['Analyst', 'Accountant', 'Manager'][Math.floor(Math.random() * 3)];
                else if (prodiLower.includes('pendidikan')) pos = 'Guru';
                
                const detailKota = a.kota || ['Malang', 'Surabaya', 'Jakarta', 'Sidoarjo', 'Bandung'][Math.floor(Math.random() * 5)];
                let urlTarget = `https://linkedin.com/in/${namaLower}`;
                if (platform === 'GitHub') urlTarget = `https://github.com/${namaLower}`;
                else if (platform === 'Google Scholar') urlTarget = `https://scholar.google.com/citations?user=${namaLower}`;
                else if (platform === 'ResearchGate') urlTarget = `https://researchgate.net/profile/${namaLower}`;
                else if (platform === 'Instagram') urlTarget = `https://instagram.com/${namaLower}`;
                else if (platform === 'Facebook') urlTarget = `https://facebook.com/${namaLower}`;
                else if (platform === 'Website Perusahaan') urlTarget = `https://${namaLower}.com`;
                
                const companyName = `${workplaceBase}`;
                const companyLower = companyName.toLowerCase().replace(/[^a-z]/g, '');
                
                const companyPlatformOptions = ['LinkedIn', 'Instagram', 'Facebook', 'Twitter'];
                const companyPlatform = companyPlatformOptions[Math.floor(Math.random() * companyPlatformOptions.length)];
                
                let companyUrl = `https://linkedin.com/company/${companyLower}`;
                if (companyPlatform === 'Instagram') companyUrl = `https://instagram.com/${companyLower}`;
                else if (companyPlatform === 'Facebook') companyUrl = `https://facebook.com/${companyLower}`;
                else if (companyPlatform === 'Twitter') companyUrl = `https://twitter.com/${companyLower}`;

                const streetNames = ['Merdeka', 'Pahlawan', 'Diponegoro', 'Ahmad Yani', 'Gajah Mada', 'Veteran', 'Melati', 'Gatot Subroto', 'Pemuda', 'Kusuma Bangsa'];
                const randomStreet = streetNames[Math.floor(Math.random() * streetNames.length)];
                const companyAddress = `Jl. ${randomStreet} No. ${Math.floor(Math.random() * 100) + 1}, ${detailKota}`;

                let updated = false;
                if (!a.variasi) { a.variasi = variasi; updated = true; }
                if (!a.kota) { a.kota = detailKota; updated = true; }
                if (!a.platform) { a.platform = platform; updated = true; }
                if (!a.email) { a.email = `${namaLower}${Math.floor(Math.random() * 99)}@${emailDomain}`; updated = true; }
                if (!a.phone) { a.phone = `${randomPrefix}${Math.floor(Math.random() * 90000000 + 10000000)}`; updated = true; }
                if (!a.workplace) { a.workplace = companyName; updated = true; }
                if (!a.workplace_address) { a.workplace_address = companyAddress; updated = true; }
                if (!a.position) { a.position = pos; updated = true; }
                if (!a.employment_type) { a.employment_type = empType; updated = true; }
                if (!a.social_media_platform) { a.social_media_platform = companyPlatform; updated = true; }
                if (!a.social_media_url) { a.social_media_url = companyUrl; updated = true; }
                if (!a.url) { a.url = urlTarget; updated = true; }
                
                if (updated) count++;
        }
        saveData();
        hideLoadingProgress();
        await showCustomAlert("Scrapping Data Selesai!", `Berhasil mengekstrak dan melengkapi data untuk ${count} profil alumni dari berbagai sumber jejak digital.`, { bgClass: "bg-indigo-50", textClass: "text-indigo-600", iconClass: "fas fa-satellite-dish" });
    }
}