import type { GameEvent } from '@/lib/swupgn';

// A `simul` group is the records of one simultaneous resolution (spec §10.2): the discards of
// "each player discards a card", or both sides' combat damage. A renderer and a scrubber treat it
// as ONE INSTANT: a scrubber never stops inside it, and the story prints its records in file
// order (render() already does). Every record of a group carries `simul`, whose value is the
// seq of the group's first record.
//
// The group's span is its first member to its last. A writer SHOULD write the members one after
// another, but nothing guarantees it, so the span covers whatever sits between them; spans that
// overlap (a hostile or a careless file) are merged, so every frame is in at most one.

export interface SimulSpans {
    // For each frame, the first and last frame of the instant it belongs to (itself when none).
    start: Int32Array;
    end: Int32Array;
}

export function simulSpans(events: readonly GameEvent[]): SimulSpans {
    const n = events.length;
    const start = new Int32Array(n);
    const end = new Int32Array(n);
    for (let i = 0; i < n; i++) { start[i] = i; end[i] = i; }
    const first = new Map<string, number>();
    const last = new Map<string, number>();
    events.forEach((e, i) => {
        const key = e != null && typeof e === 'object' ? (e as { simul?: unknown }).simul : undefined;
        if (typeof key !== 'string') return;
        if (!first.has(key)) first.set(key, i);
        last.set(key, i);
    });
    const spans = [...first].map(([key, a]) => [a, last.get(key)!] as const)
        .filter(([a, b]) => b > a)
        .sort((x, y) => x[0] - y[0]);
    let cur: [number, number] | undefined;
    const fill = ([a, b]: [number, number]) => { for (let i = a; i <= b; i++) { start[i] = a; end[i] = b; } };
    for (const [a, b] of spans) {
        if (cur && a <= cur[1]) { cur[1] = Math.max(cur[1], b); continue; }
        if (cur) fill(cur);
        cur = [a, b];
    }
    if (cur) fill(cur);
    return { start, end };
}

/** Where a seek to frame `i` comes to rest: the end of its instant, the fully resolved board. */
export function settle(spans: SimulSpans, i: number): number {
    return i >= 0 && i < spans.end.length ? spans.end[i] : i;
}

/** One record forward from `p`: the next frame, or the end of the group it starts. */
export function recordForward(spans: SimulSpans, p: number): number {
    const n = spans.end.length;
    if (n === 0) return 0;
    return settle(spans, Math.min(settle(spans, p) + 1, n - 1));
}

/** One record back from `p`: the frame before `p`'s instant (a group is stepped over whole). */
export function recordBack(spans: SimulSpans, p: number): number {
    if (spans.start.length === 0) return 0;
    const at = Math.max(0, Math.min(p, spans.start.length - 1));
    return settle(spans, Math.max(0, spans.start[at] - 1));
}
