import type { SwuPgnDocument, Seat } from '@/lib/swupgn';

// Decision review (P3): surface the explicit branch points the omniscient archive records
// (CHOICE / MODAL_CHOICE — "offered A/B/C, chose B") and auto-bookmark the swingy moments
// (defeats, overwhelm, initiative claims, big damage, game end). Pure over doc.events; the
// UI resolves card ids to names and seeks to `seq`.

export interface DecisionPoint {
    seq: string;
    p: Seat;
    type: 'CHOICE' | 'MODAL_CHOICE';
    // The source card / prompt text, if the engine recorded one.
    prompt?: string;
    // Raw options as recorded (card ids like "LOF#164" or plain labels like "Opponent").
    offered: string[];
    // Index into `offered` that was chosen.
    chose: number;
}

export type BookmarkKind = 'DEFEAT' | 'OVERWHELM' | 'INITIATIVE' | 'BIG_DAMAGE' | 'GAME_END';

export interface Bookmark {
    seq: string;
    kind: BookmarkKind;
    p?: Seat;
    // Structured fields for the UI to format (card ids resolved via nameOf there).
    card?: string;
    src?: string;
    tgt?: string;
    amt?: number;
    reason?: string;
}

/** Explicit decision points in timeline order. */
export function decisionPoints(doc: SwuPgnDocument): DecisionPoint[] {
    const out: DecisionPoint[] = [];
    for (const e of doc.events) {
        // `offered` is cast from unvalidated file JSON; coerce to an array so the UI's
        // offered.map() can't throw on a malformed (shared) replay.
        if (e.t === 'CHOICE') {
            out.push({ seq: e.seq, p: e.p, type: 'CHOICE', prompt: e.prompt, offered: Array.isArray(e.offered) ? e.offered : [], chose: e.chose });
        } else if (e.t === 'MODAL_CHOICE') {
            out.push({ seq: e.seq, p: e.p, type: 'MODAL_CHOICE', offered: Array.isArray(e.offered) ? e.offered : [], chose: e.chose });
        }
    }
    return out;
}

/**
 * Auto-bookmark swingy moments. `bigDamageThreshold` (default 4) flags single hits at or
 * above it; tune to taste in the UI later.
 */
export function autoBookmarks(doc: SwuPgnDocument, bigDamageThreshold = 4): Bookmark[] {
    const out: Bookmark[] = [];
    for (const e of doc.events) {
        switch (e.t) {
            case 'DEFEAT':
                out.push({ seq: e.seq, kind: 'DEFEAT', card: e.card, reason: e.reason });
                break;
            case 'OVERWHELM':
                out.push({ seq: e.seq, kind: 'OVERWHELM', p: e.p, tgt: e.tgt, amt: e.amt });
                break;
            case 'CLAIM_INITIATIVE':
                out.push({ seq: e.seq, kind: 'INITIATIVE', p: e.p });
                break;
            case 'DAMAGE':
                if (e.amt >= bigDamageThreshold) {
                    out.push({ seq: e.seq, kind: 'BIG_DAMAGE', src: e.src, tgt: e.tgt, amt: e.amt });
                }
                break;
            case 'GAME_END':
                out.push({ seq: e.seq, kind: 'GAME_END', reason: e.reason });
                break;
            default:
                break;
        }
    }
    return out;
}
