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

function saveData() {
    if (typeof render === 'function') render(); // Panggil fungsi UI jika ada

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