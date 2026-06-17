import type { Annotation, SwuPgnDocument } from '@/lib/swupgn';
import { openDB, ANNOTATIONS_STORE } from './replayStorage';

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
    lastModified: number;
}

/** Load the working-copy notes for a replay, or [] if none / no replayId. */
export async function loadAnnotations(replayId: string | null): Promise<WorkingAnnotation[]> {
    if (!replayId) return [];
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readonly');
        const request = tx.objectStore(ANNOTATIONS_STORE).get(replayId);
        request.onsuccess = () => {
            const rec = request.result as AnnotationRecord | undefined;
            resolve(rec?.annotations ?? []);
        };
        request.onerror = () => reject(request.error);
    });
}

/** Persist the working-copy notes for a replay. No-op without a replayId (in-memory only). */
export async function saveAnnotations(replayId: string | null, annotations: WorkingAnnotation[], now = 0): Promise<void> {
    if (!replayId) return;
    const db = await openDB();
    const record: AnnotationRecord = { replayId, annotations, lastModified: now };
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
        tx.objectStore(ANNOTATIONS_STORE).put(record);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Remove all working-copy notes for a replay. */
export async function clearAnnotations(replayId: string | null): Promise<void> {
    if (!replayId) return;
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(ANNOTATIONS_STORE, 'readwrite');
        tx.objectStore(ANNOTATIONS_STORE).delete(replayId);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
}

/** Strip the client-only `_id` so a working note becomes a plain reader Annotation. */
export function toAnnotation(w: WorkingAnnotation): Annotation {
    const { _id, ...rest } = w;
    void _id;
    return rest;
}

/**
 * Build the document to export: the file's own annotations followed by the working copy
 * (ids stripped). This is what serialize() runs over so shared .swupgn files carry the
 * session's notes. Working notes are appended, never merged into existing file notes.
 */
export function mergeForExport(doc: SwuPgnDocument, working: WorkingAnnotation[]): SwuPgnDocument {
    return { ...doc, annotations: [...doc.annotations, ...working.map(toAnnotation)] };
}
