// Pure prev/next-tag navigation over a replay's annotated frames. Decoupled from the
// annotation/event types: callers pass the ordered event seqs and the set of seqs that
// carry at least one annotation (file or working copy). Frame index === index into events.

/** Indices of annotated events, in timeline order. */
export function annotatedIndices(eventSeqs: readonly string[], annotatedRefs: ReadonlySet<string>): number[] {
    const out: number[] = [];
    for (let i = 0; i < eventSeqs.length; i++) {
        if (annotatedRefs.has(eventSeqs[i])) out.push(i);
    }
    return out;
}

/** Index of the next annotated event strictly after currentIndex, or null if none. */
export function nextTag(eventSeqs: readonly string[], annotatedRefs: ReadonlySet<string>, currentIndex: number): number | null {
    for (let i = currentIndex + 1; i < eventSeqs.length; i++) {
        if (annotatedRefs.has(eventSeqs[i])) return i;
    }
    return null;
}

/** Index of the previous annotated event strictly before currentIndex, or null if none. */
export function prevTag(eventSeqs: readonly string[], annotatedRefs: ReadonlySet<string>, currentIndex: number): number | null {
    for (let i = currentIndex - 1; i >= 0; i--) {
        if (annotatedRefs.has(eventSeqs[i])) return i;
    }
    return null;
}
