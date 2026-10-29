'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef, ReactNode } from 'react';
import type { Annotation, SwuPgnDocument } from '@/lib/swupgn';
import { serialize } from '@/lib/swupgn';
import {
    loadAnnotations, saveAnnotations, mergeAnnotations, mergeForExport, type WorkingAnnotation,
} from '@/app/_utils/replayAnnotations';
import { getAnnotationAuthor, setAnnotationAuthor } from '@/app/_utils/annotationAuthor';
import { downloadSwuPgn } from '@/app/_utils/downloadBlob';
import { beatAnchorSeqs } from '@/app/_utils/replayBeats';
import { useReplay } from '@/app/_contexts/Replay.context';

export interface IReplayAnnotationsContext {
    // Session-authored notes (the editable working copy).
    working: WorkingAnnotation[];
    // All notes on the beat this seq belongs to: the file's own (read-only) then the working copy.
    threadFor: (seq: string) => Annotation[];

    /** Whether any note is about the beat this seq belongs to. */
    hasNotes: (seq: string) => boolean;
    addAnnotation: (ref: string, fields: { nag?: string; text?: string; parent?: string }) => void;
    updateAnnotation: (id: string, patch: { nag?: string; text?: string }) => void;
    deleteAnnotation: (id: string) => void;
    author: string;
    setAuthor: (name: string) => void;
    // Document with file + working notes merged, for serialize/export.
    exportDoc: () => SwuPgnDocument;
    // Download the .swupgn including the working notes.
    downloadWithAnnotations: () => void;
}

const ReplayAnnotationsContext = createContext<IReplayAnnotationsContext | null>(null);

export function useReplayAnnotations(): IReplayAnnotationsContext {
    const ctx = useContext(ReplayAnnotationsContext);
    if (!ctx) throw new Error('useReplayAnnotations must be used within a ReplayAnnotationsProvider');
    return ctx;
}

// Client-only id for React keys + edit/delete. Stripped before serialize. crypto.randomUUID
// needs a secure context; fall back to time+counter so non-HTTPS dev origins still work.
let idCounter = 0;
function makeId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
    idCounter += 1;
    return `a${Date.now().toString(36)}-${idCounter}`;
}

interface ProviderProps {
    doc: SwuPgnDocument;
    replayId: string | null;
    children: ReactNode;
}

export const ReplayAnnotationsProvider: React.FC<ProviderProps> = ({ doc, replayId, children }) => {
    const [working, setWorking] = useState<WorkingAnnotation[]>([]);
    const [author, setAuthorState] = useState<string>('');

    // The replayId whose stored notes the working copy holds (null: none loaded yet).
    const loadedFor = useRef<string | null>(null);

    // Each mutation persists the working copy to IndexedDB (no-op without a replayId —
    // an un-saved upload stays in-memory but is still exportable). A failed write (e.g.
    // QuotaExceededError) is logged rather than silently dropped, so the on-disk copy
    // diverging from the in-memory notes is at least visible in the console.
    const persist = useCallback((next: WorkingAnnotation[], deletedIds: string[] = []) => {
        saveAnnotations(replayId, next, Date.now(), deletedIds).catch((err) =>
            console.warn('Failed to persist replay annotations', err));
    }, [replayId]);

    // Load the working copy + author when the replay changes. After an upload the board
    // mounts with replayId=null and the id arrives later: notes made in between are merged
    // with the stored ones (and saved, since persist was a no-op until now), not replaced.
    useEffect(() => {
        let active = true;
        setAuthorState(getAnnotationAuthor(''));
        // Switching from one stored replay to another: the old replay's notes are not this one's.
        const carryOver = loadedFor.current === null;
        if (!carryOver) setWorking([]);
        loadAnnotations(replayId).then((anns) => {
            if (!active) return;
            loadedFor.current = replayId;
            setWorking((prev) => {
                if (!carryOver || prev.length === 0) return anns;
                const merged = mergeAnnotations(anns, prev);
                persist(merged);
                return merged;
            });
        }).catch((err) => {
            // Keep the working notes; only the stored copy is unavailable.
            console.warn('Failed to load replay annotations', err);
        });
        return () => { active = false; };
    }, [replayId, persist]);

    const addAnnotation = useCallback((ref: string, fields: { nag?: string; text?: string; parent?: string }) => {
        const note: WorkingAnnotation = {
            _id: makeId(),
            ref,
            ts: Date.now(),
            ...(fields.nag ? { nag: fields.nag } : {}),
            ...(fields.text ? { text: fields.text } : {}),
            ...(fields.parent ? { parent: fields.parent } : {}),
            ...(author ? { by: author } : {}),
        };
        setWorking((prev) => {
            const next = [...prev, note];
            persist(next);
            return next;
        });
    }, [author, persist]);

    const updateAnnotation = useCallback((id: string, patch: { nag?: string; text?: string }) => {
        setWorking((prev) => {
            const next = prev.map((w) => (w._id === id
                ? { ...w, nag: patch.nag ?? w.nag, text: patch.text ?? w.text }
                : w));
            persist(next);
            return next;
        });
    }, [persist]);

    const deleteAnnotation = useCallback((id: string) => {
        setWorking((prev) => {
            const next = prev.filter((w) => w._id !== id);
            persist(next, [id]);
            return next;
        });
    }, [persist]);

    const setAuthor = useCallback((name: string) => {
        setAuthorState(name);
        setAnnotationAuthor(name);
    }, []);

    // Notes are grouped by beat (beatAnchorSeqs), so a badge and its thread always agree.
    const { events, beats } = useReplay();
    const anchors = useMemo(() => beatAnchorSeqs(events, beats), [events, beats]);
    const anchorOf = useCallback((seq: string) => anchors.get(seq) ?? seq, [anchors]);

    const annotatedAnchors = useMemo(() => {
        const refs = new Set<string>();
        for (const a of doc.annotations) refs.add(anchorOf(a.ref));
        for (const w of working) refs.add(anchorOf(w.ref));
        return refs;
    }, [doc.annotations, working, anchorOf]);
    const hasNotes = useCallback((seq: string) => annotatedAnchors.has(anchorOf(seq)), [annotatedAnchors, anchorOf]);

    const threadFor = useCallback((seq: string): Annotation[] => {
        const anchor = anchorOf(seq);
        return [
            ...doc.annotations.filter((a) => anchorOf(a.ref) === anchor),
            ...working.filter((w) => anchorOf(w.ref) === anchor),
        ];
    }, [doc.annotations, working, anchorOf]);

    const exportDoc = useCallback(() => mergeForExport(doc, working), [doc, working]);

    const downloadWithAnnotations = useCallback(() => {
        downloadSwuPgn(doc, serialize(exportDoc()));
    }, [doc, exportDoc]);

    const value = useMemo<IReplayAnnotationsContext>(() => ({
        working, threadFor, hasNotes,
        addAnnotation, updateAnnotation, deleteAnnotation,
        author, setAuthor, exportDoc, downloadWithAnnotations,
    }), [working, threadFor, hasNotes, addAnnotation, updateAnnotation, deleteAnnotation,
        author, setAuthor, exportDoc, downloadWithAnnotations]);

    return <ReplayAnnotationsContext.Provider value={value}>{children}</ReplayAnnotationsContext.Provider>;
};
