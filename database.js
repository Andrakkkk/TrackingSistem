// ==========================================
// DATABASE & GLOBAL STATE
// ==========================================
let alumni = [];
let db = null;

function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("UmmAlumniDB", 1);
        request.onupgradeneeded = function(e) {
            db = e.target.result;
            if (!db.objectStoreNames.contains("storage")) {
                db.createObjectStore("storage", { keyPath: "id" });
            }
        };
        request.onsuccess = function(e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function(e) {
            console.error("IndexedDB error:", e.target.error);
            reject(e.target.error);
        };
    });
}

async function loadDataFromDB() {
    return new Promise((resolve) => {
        if (!db) return resolve([]);
        const transaction = db.transaction(["storage"], "readonly");
        const store = transaction.objectStore("storage");
        const request = store.get("alumni_data");
        request.onsuccess = (e) => resolve(e.target.result?.data || []);
        request.onerror = () => resolve([]);
    });
}

// Simpan ke IndexedDB (untuk perubahan kecil seperti edit/hapus/verifikasi 1 data)
function saveData(doRender = true) {
    if (doRender && typeof render === 'function') render();

    if (!db) {
        console.warn("Database belum siap, data tidak dapat disimpan permanen.");
        return;
    }
    const transaction = db.transaction(["storage"], "readwrite");
    const store = transaction.objectStore("storage");
    store.put({ id: "alumni_data", data: alumni }).onerror = function(e) {
        console.error("Gagal menyimpan ke IndexedDB:", e.target.error);
    };
}

// Simpan ke IndexedDB secara BACKGROUND — tidak membekukan UI
// Dipakai setelah load CSV massal agar UI tetap responsif
function saveToDatabaseBackground() {
    if (!db) {
        console.warn("Database belum siap untuk penyimpanan background.");
        return;
    }
    // Tunda 100ms agar browser sempat render UI terlebih dahulu
    setTimeout(() => {
        const transaction = db.transaction(["storage"], "readwrite");
        const store = transaction.objectStore("storage");
        const request = store.put({ id: "alumni_data", data: alumni });
        request.onsuccess = () => {
            console.log(`[DB] ${alumni.length} data alumni berhasil disimpan ke IndexedDB.`);
        };
        request.onerror = (e) => {
            console.error("Gagal menyimpan background ke IndexedDB:", e.target.error);
        };
    }, 100);
}