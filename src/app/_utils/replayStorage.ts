const DB_NAME = 'karabast-replays';
const STORE_NAME = 'replays';        // full records (id, rawContent, meta)
const META_STORE = 'replayMeta';     // lightweight metadata only, for the list view
const DB_VERSION = 2;

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = (event) => {
            const db = request.result;
            const tx = request.transaction;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            // v2: split metadata into its own store so listReplays() never has to
            // deserialize every replay's full rawContent. Backfill from existing
            // v1 records via the version-change transaction.
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
                if (tx && event.oldVersion >= 1 && db.objectStoreNames.contains(STORE_NAME)) {
                    const cursorReq = tx.objectStore(STORE_NAME).openCursor();
                    cursorReq.onsuccess = () => {
                        const cursor = cursorReq.result;
                        if (!cursor) return;
                        const rec = cursor.value;
                        if (rec && typeof rec === 'object' && rec.meta && rec.id) {
                            tx.objectStore(META_STORE).put({ id: rec.id, ...rec.meta }, rec.id);
                        }
                        cursor.continue();
                    };
                }
            }
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
    const metaRecord: StoredReplayMeta = { id, ...record.meta };
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        tx.objectStore(STORE_NAME).put(record, id);
        tx.objectStore(META_STORE).put(metaRecord, id);
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

/**
 * List stored replays, newest first. Reads only the lightweight meta store, so
 * the full rawContent of each replay is never deserialized for the list view.
 * Legacy string-only records (no meta) never had a meta entry and are skipped.
 */
export async function listReplays(): Promise<StoredReplayMeta[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(META_STORE, 'readonly');
        const request = tx.objectStore(META_STORE).getAll();
        request.onsuccess = () => {
            const metas: StoredReplayMeta[] = (request.result ?? []).filter(
                (r: unknown): r is StoredReplayMeta =>
                    !!r && typeof r === 'object' && 'id' in r && 'savedAt' in r
            );
            metas.sort((a, b) => b.savedAt - a.savedAt);
            resolve(metas);
        };
        request.onerror = () => reject(request.error);
    });
}

export async function deleteReplay(id: string): Promise<void> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction([STORE_NAME, META_STORE], 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.objectStore(META_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}
