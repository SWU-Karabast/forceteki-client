import type { GameEvent } from '@/lib/swupgn';

/**
 * Units that should already read exhausted on the frames between their arrival and the
 * entering `EXHAUST` the writer puts right after it (spec §10.1).
 *
 * The engine exhausts a unit as it enters play; the file writes that as its own record, a
 * few lines after the arrival MOVE (STATS and the PLAY summary sit between). Folding
 * literally shows the unit ready for those frames and then snapping exhausted, which is not
 * what a player sees at the table. This looks ahead from each arrival for that EXHAUST and,
 * when the file has one, marks the frames up to it. A unit the file never exhausts (an
 * "enters ready" effect, a deployed leader) is left alone: nothing here assumes the rule.
 *
 * Index matches the event array: `out[i]` is the set of card ids to draw exhausted on frame i
 * on top of the folded state.
 */
const ARENA = new Set(['ground', 'space']);
// The entering EXHAUST is within the same action; a few records of consequences at most.
const LOOKAHEAD = 24;

export function entryExhaustByFrame(events: GameEvent[]): Array<ReadonlySet<string>> {
    const none: ReadonlySet<string> = new Set();
    const out: Array<Set<string> | undefined> = new Array(events.length);
    for (let j = 0; j < events.length; j++) {
        const e = events[j];
        if (e == null || typeof e !== 'object' || e.t !== 'MOVE' || e.kind === 'upgrade' || !ARENA.has(e.to) || ARENA.has(e.from)) continue;
        const card = e.card;
        for (let k = j + 1; k < events.length && k <= j + LOOKAHEAD; k++) {
            const n = events[k];
            if (n == null || typeof n !== 'object') continue;
            if (n.t === 'ROUND_START' || n.t === 'PHASE_START') break;
            if ('card' in n && n.card === card) {
                if (n.t === 'READY' || n.t === 'DEFEAT' || (n.t === 'MOVE' && !ARENA.has(n.to))) break;
                if (n.t === 'EXHAUST') {
                    for (let i = j; i < k; i++) (out[i] ??= new Set()).add(card);
                    break;
                }
            }
        }
    }
    return Array.from(out, (s) => s ?? none);
}
