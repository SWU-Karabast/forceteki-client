'use client';
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from 'react';
import type { Annotation, SwuPgnDocument } from '@/lib/swupgn';
import { serialize } from '@/lib/swupgn';
import {
    loadAnnotations, saveAnnotations, mergeForExport, type WorkingAnnotation,
} from '@/app/_utils/replayAnnotations';
import { getAnnotationAuthor, setAnnotationAuthor } from '@/app/_utils/annotationAuthor';

export interface IReplayAnnotationsContext {
    // Session-authored notes (the editable working copy).
    working: WorkingAnnotation[];
    // All notes for an event seq: the file's own (read-only) then the working copy.
    threadFor: (seq: string) => Annotation[];
    // Every event seq that carries at least one note (file or working).
    annotatedRefs: Set<string>;
    addAnnotation: (ref: string, fields: { nag?: string; text?: string }) => void;
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

    // Load the working copy + author when the replay changes.
    useEffect(() => {
        let active = true;
        setAuthorState(getAnnotationAuthor(''));
        loadAnnotations(replayId).then((anns) => {
            if (active) setWorking(anns);
        });
        return () => { active = false; };
    }, [replayId]);

    // Each mutation persists the working copy to IndexedDB (no-op without a replayId —
    // an un-saved upload stays in-memory but is still exportable).
    const addAnnotation = useCallback((ref: string, fields: { nag?: string; text?: string }) => {
        const note: WorkingAnnotation = {
            _id: makeId(),
            ref,
            ...(fields.nag ? { nag: fields.nag } : {}),
            ...(fields.text ? { text: fields.text } : {}),
            ...(author ? { by: author } : {}),
        };
        setWorking((prev) => {
            const next = [...prev, note];
            void saveAnnotations(replayId, next, Date.now());
            return next;
        });
    }, [author, replayId]);

    const updateAnnotation = useCallback((id: string, patch: { nag?: string; text?: string }) => {
        setWorking((prev) => {
            const next = prev.map((w) => (w._id === id
                ? { ...w, nag: patch.nag ?? w.nag, text: patch.text ?? w.text }
                : w));
            void saveAnnotations(replayId, next, Date.now());
            return next;
        });
    }, [replayId]);

    const deleteAnnotation = useCallback((id: string) => {
        setWorking((prev) => {
            const next = prev.filter((w) => w._id !== id);
            void saveAnnotations(replayId, next, Date.now());
            return next;
        });
    }, [replayId]);

    const setAuthor = useCallback((name: string) => {
        setAuthorState(name);
        setAnnotationAuthor(name);
    }, []);

    const annotatedRefs = useMemo(() => {
        const refs = new Set<string>();
        for (const a of doc.annotations) refs.add(a.ref);
        for (const w of working) refs.add(w.ref);
        return refs;
    }, [doc.annotations, working]);

    const threadFor = useCallback((seq: string): Annotation[] => [
        ...doc.annotations.filter((a) => a.ref === seq),
        ...working.filter((w) => w.ref === seq),
    ], [doc.annotations, working]);

    const exportDoc = useCallback(() => mergeForExport(doc, working), [doc, working]);

    const downloadWithAnnotations = useCallback(() => {
        const content = serialize(exportDoc());
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.header.p1}-vs-${doc.header.p2}.swupgn`.replace(/[^a-z0-9.-]+/gi, '-');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [doc, exportDoc]);

    const value = useMemo<IReplayAnnotationsContext>(() => ({
        working, threadFor, annotatedRefs,
        addAnnotation, updateAnnotation, deleteAnnotation,
        author, setAuthor, exportDoc, downloadWithAnnotations,
    }), [working, threadFor, annotatedRefs, addAnnotation, updateAnnotation, deleteAnnotation,
        author, setAuthor, exportDoc, downloadWithAnnotations]);

    return <ReplayAnnotationsContext.Provider value={value}>{children}</ReplayAnnotationsContext.Provider>;
};
