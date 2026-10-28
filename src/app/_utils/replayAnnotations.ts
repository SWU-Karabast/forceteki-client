import type { Annotation, SwuPgnDocument } from '@/lib/swupgn';
import { openDB, closeWhenSettled, ANNOTATIONS_STORE } from './replayStorage';

/**
 * A working-copy annotation: a reader Annotation plus a client-only `_id` for stable
 * React keys and edit/delete targeting. `_id` is stripped before serialize() — it is
 * never part of the .swupgn format. Working notes are kept separate from the file's
 * own doc.annotations (which stay read-only in the app); export merges the two.
 */
export interface WorkingAnnotation extends Annotation {
    _id: string;
}

interface AnnotationRecord {
    replayId: string;
    annotations: WorkingAnnotation[];
    // `_id`s of notes deleted in any tab. A stale tab still holding a deleted note in memory
    // would otherwise put it back on its next save, so the merge drops every id listed here.
    deleted?: string[];
    lastModified: number;
}

/**
 * Union two note lists by `_id`. A note in both takes the `overlay` copy (this tab's edit);
 * order is base first, then the overlay's new notes. Ids in `deleted` are dropped.
 */
export function mergeAnnotations(
    base: WorkingAnnotation[],
    overlay: WorkingAnnotation[],
    deleted: Iterable<string> = [],
): WorkingAnnotation[] {
    const byId = new Map<string, WorkingAnnotation>();
    for (const a of base) byId.set(a._id, a);
    for (const a of overlay) byId.set(a._id, a);
    for (const id of deleted) byId.delete(id);
    return [...byId.values()];
}

/** Load the working-copy notes for a replay, or [] if none / no replayId. */
export async function loadAnnotations(replayId: string | null): Promise<WorkingAnnotation[]> {
    if (!replayId) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
        closeWhenSettled(db, tx);
        const request = tx.objectStore(ANNOTATIONS_STORE).get(replayId);
        request.onsuccess = () => {
            const rec = request.result as AnnotationRecord | undefined;
            resolve(rec?.annotations ?? []);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Persist the working-copy notes for a replay. No-op without a replayId (in-memory only).
 * Another tab may have saved notes since this one loaded, so the write reads the stored
 * record and merges into it by `_id` rather than overwriting it. `deletedIds` are the notes
 * this tab removed; they join the record's tombstones so no tab resurrects them.
 */
export async function saveAnnotations(
    replayId: string | null,
    annotations: WorkingAnnotation[],
    now = 0,
    deletedIds: string[] = [],
): Promise<void> {
    if (!replayId) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
        closeWhenSettled(db, tx);
        const store = tx.objectStore(ANNOTATIONS_STORE);
        const request = store.get(replayId);
        request.onsuccess = () => {
            const stored = request.result as AnnotationRecord | undefined;
            const deleted = [...new Set([...(stored?.deleted ?? []), ...deletedIds])];
            const record: AnnotationRecord = {
                replayId,
                annotations: mergeAnnotations(stored?.annotations ?? [], annotations, deleted),
                ...(deleted.length ? { deleted } : {}),
                lastModified: now,
            };
            store.put(record);
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        // A commit that fails (QuotaExceededError) aborts the transaction and fires no error.
        tx.onabort = () => reject(tx.error ?? new Error('Replay notes transaction aborted'));
    });
}

/**
 * Convert a working note to a serializable Annotation. The client `_id` is emitted as the
 * stable `id` so threaded replies (which reference a parent id) survive export/import.
 *
 * Only the fields the client authors go out, never the stored record as a whole: the client
 * writes no what-if `line`, so no STATUS_TOKEN with a reserved name (§15, §23) and no reserved
 * key can reach a file that parse() would then refuse. `text` and `by` are written in Unicode
 * NFC (§15), so two notes that look the same compare the same.
 */
export function toAnnotation(w: WorkingAnnotation): Annotation {
    return {
        ref: w.ref,
        ...(typeof w.ts === 'number' ? { ts: w.ts } : {}),
        ...(typeof w.nag === 'string' ? { nag: w.nag } : {}),
        ...(typeof w.text === 'string' ? { text: w.text.normalize('NFC') } : {}),
        ...(typeof w.parent === 'string' ? { parent: w.parent } : {}),
        ...(typeof w.by === 'string' ? { by: w.by.normalize('NFC') } : {}),
        id: w.id ?? w._id,
    };
}

/**
 * Build the document to export: the file's own annotations followed by the working copy
 * (ids stripped). This is what serialize() runs over so shared .swupgn files carry the
 * session's notes. Working notes are appended, never merged into existing file notes.
 */
export function mergeForExport(doc: SwuPgnDocument, working: WorkingAnnotation[]): SwuPgnDocument {
    return { ...doc, annotations: [...doc.annotations, ...working.map(toAnnotation)] };
}
