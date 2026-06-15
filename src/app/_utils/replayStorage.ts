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

/** Lightweight metadata shown in the "recent replays" list. */
export interface StoredReplayMeta {
    id: string;
    player1: string;
    player2: string;
    result: string;
    savedAt: number;
}

interface StoredReplay {
    id: string;
    rawContent: string;
    meta: Omit<StoredReplayMeta, 'id'>;
}

export async function storeReplay(
    id: string,
    rawContent: string,
    meta?: { player1?: string; player2?: string; result?: string; savedAt?: number },
): Promise<void> {
    const db = await openDB();
    const record: StoredReplay = {
        id,
        rawContent,
        meta: {
            player1: meta?.player1 || 'Player 1',
            player2: meta?.player2 || 'Player 2',
            result: meta?.result || '',
            savedAt: meta?.savedAt ?? 0,
        },
    };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(record, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

export async function loadReplay(id: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => {
            const result = request.result;
            if (!result) return resolve(null);
            // New records store { rawContent }; legacy records stored the raw string.
            resolve(typeof result === 'string' ? result : result.rawContent ?? null);
        };
        request.onerror = () => reject(request.error);
    });
}

/** List stored replays, newest first. Legacy string-only records are skipped. */
export async function listReplays(): Promise<StoredReplayMeta[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => {
            const records: StoredReplay[] = (request.result ?? []).filter(
                (r: unknown): r is StoredReplay =>
                    !!r && typeof r === 'object' && 'meta' in r && 'rawContent' in r
            );
            const metas = records.map((r) => ({ id: r.id, ...r.meta }));
            metas.sort((a, b) => b.savedAt - a.savedAt);
            resolve(metas);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteReplay(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
