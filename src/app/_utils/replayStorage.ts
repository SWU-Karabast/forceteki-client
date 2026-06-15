const DB_NAME = 'karabast-replays';
const STORE_NAME = 'replays';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
            request.result.createObjectStore(STORE_NAME);
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

// Generate a short deterministic ID from the replay header + content sample.
// Includes content entropy so rematches/BO3s with identical headers produce
// different IDs (different game actions = different hash).
export async function generateReplayId(header: Record<string, string>, rawContent?: string): Promise<string> {
    const contentSample = rawContent ? rawContent.slice(-2000) : '';
    const seed = [
        header.Player1 || '',
        header.Player2 || '',
        header.Date || '',
        header.Result || '',
        header.Leader1 || '',
        header.Leader2 || '',
        contentSample,
    ].join('|');

    // crypto.subtle is only available in secure contexts (HTTPS / localhost).
    // On a plain-HTTP origin it's undefined; fall back to a simple deterministic
    // string hash so the ?id= URL (and refresh/share) still works everywhere.
    if (typeof crypto !== 'undefined' && crypto.subtle) {
        const encoded = new TextEncoder().encode(seed);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = new Uint8Array(hashBuffer);
        let id = '';
        for (let i = 0; i < 8; i++) {
            id += hashArray[i].toString(36);
        }
        return id;
    }

    return fallbackHash(seed);
}

// FNV-1a 32-bit string hash — deterministic, no crypto dependency. Used only
// as an id when WebCrypto's SubtleCrypto is unavailable (non-secure contexts).
function fallbackHash(input: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
        h ^= input.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0).toString(36);
}

export async function storeReplay(id: string, rawContent: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(rawContent, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function loadReplay(id: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => resolve(request.result ?? null);
        request.onerror = () => reject(request.error);
    });
}
