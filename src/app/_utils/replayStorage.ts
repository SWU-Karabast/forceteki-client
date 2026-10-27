const DB_NAME = 'karabast-replays';
const STORE_NAME = 'replays';        // full records (id, rawContent, meta)
const META_STORE = 'replayMeta';     // lightweight metadata only, for the list view
export const ANNOTATIONS_STORE = 'replayAnnotations'; // working-copy notes, keyed by replayId
const DB_VERSION = 3;

// How long an upgrade blocked by another tab may wait before openDB gives up.
const DB_BLOCKED_TIMEOUT_MS = 5000;

/**
 * Open the shared replay DB. Exported so the annotations layer
 * (replayAnnotations.ts) shares one DB + version line — IndexedDB versions are
 * per-database, so every store this app uses must be created in this one opener.
 */
export function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        // Create any store that is missing. An upgrade from an older version only adds stores;
        // existing replays survive untouched.
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME);
            }
            // Metadata lives in its own store so listReplays() never has to deserialize
            // every replay's full rawContent.
            if (!db.objectStoreNames.contains(META_STORE)) {
                db.createObjectStore(META_STORE);
            }
            // Working-copy annotations, keyed by replayId.
            if (!db.objectStoreNames.contains(ANNOTATIONS_STORE)) {
                db.createObjectStore(ANNOTATIONS_STORE, { keyPath: 'replayId' });
            }
        };
        // Another tab holding an older version open blocks this upgrade. That tab's
        // onversionchange (below) closes it; one from before that handler never does, so give
        // up after a while rather than leave every caller waiting.
        let blockedTimer: ReturnType<typeof setTimeout> | undefined;
        let gaveUp = false;
        request.onblocked = () => {
            console.warn('Replay DB upgrade blocked by another open tab');
            blockedTimer ??= setTimeout(() => {
                gaveUp = true;
                reject(new Error('Replay storage is blocked by another open tab'));
            }, DB_BLOCKED_TIMEOUT_MS);
        };
        request.onsuccess = () => {
            clearTimeout(blockedTimer);
            // The other tab closed after this call gave up: nobody holds this connection.
            if (gaveUp) {
                request.result.close();
                return;
            }
            const db = request.result;
            // If another tab requests a newer version, close this connection so its
            // upgrade isn't blocked (prevents a cross-tab deadlock).
            db.onversionchange = () => db.close();
            resolve(db);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Close the connection once a transaction settles (commit, error or abort), so a helper
 * never leaves an open connection behind for every call it serves.
 */
export function closeWhenSettled(db: IDBDatabase, tx: IDBTransaction): void {
    const close = () => db.close();
    tx.addEventListener('complete', close);
    tx.addEventListener('error', close);
    tx.addEventListener('abort', close);
}

/** The header fields that identify a replay, as the parsed document names them. */
export interface ReplayIdHeader {
    p1: string; p2: string; date: string; result: string; p1Leader: string; p2Leader: string;
}

// Generate a short deterministic ID from the replay header + the WHOLE content, so two
// files with the same header and the same closing sequence (a rematch that ends the same
// way) do not collide and silently replace each other in storage.
export async function generateReplayId(header: ReplayIdHeader, rawContent = ''): Promise<string> {
    const seed = [
        header.p1 || '',
        header.p2 || '',
        header.date || '',
        header.result || '',
        header.p1Leader || '',
        header.p2Leader || '',
        rawContent,
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
        closeWhenSettled(db, tx);
        tx.objectStore(STORE_NAME).put(record, id);
        tx.objectStore(META_STORE).put(metaRecord, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        // A commit that fails (QuotaExceededError) aborts the transaction and fires no error.
        tx.onabort = () => reject(tx.error ?? new Error('Replay storage transaction aborted'));
    });
}

export async function loadReplay(id: string): Promise<string | null> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        closeWhenSettled(db, tx);
        const request = tx.objectStore(STORE_NAME).get(id);
        request.onsuccess = () => {
            const result = request.result as StoredReplay | undefined;
            resolve(result?.rawContent ?? null);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * List stored replays, newest first. Reads only the lightweight meta store, so
 * the full rawContent of each replay is never deserialized for the list view.
 */
export async function listReplays(): Promise<StoredReplayMeta[]> {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(META_STORE, 'readonly');
        closeWhenSettled(db, tx);
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
        // Notes go with the replay: ids are a content hash, so re-uploading the same file
        // would otherwise bring the deleted replay's notes back.
        const tx = db.transaction([STORE_NAME, META_STORE, ANNOTATIONS_STORE], 'readwrite');
        closeWhenSettled(db, tx);
        tx.objectStore(STORE_NAME).delete(id);
        tx.objectStore(META_STORE).delete(id);
        tx.objectStore(ANNOTATIONS_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        // A commit that fails (QuotaExceededError) aborts the transaction and fires no error.
        tx.onabort = () => reject(tx.error ?? new Error('Replay storage transaction aborted'));
    });
}
