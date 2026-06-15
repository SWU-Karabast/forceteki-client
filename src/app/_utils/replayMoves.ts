import { ReplayEvent, ReplaySnapshot } from '@/app/_utils/replayParser';

/**
 * Numeric-aware seq comparison. Splits on non-alphanumeric delimiters and compares
 * each segment numerically if both are numbers, otherwise lexicographically.
 * e.g., "R10.A.2" > "R2.A.9" (because 10 > 2 in the first numeric segment).
 */
export function compareSeq(a: string, b: string): number {
    // Coerce to string: event seqs come from JSON.parse of an uploaded file and
    // can be a number/object on a malformed line — .split would throw otherwise.
    const partsA = String(a ?? '').split(/([.\-])/);
    const partsB = String(b ?? '').split(/([.\-])/);
    const len = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < len; i++) {
        const pa = partsA[i] ?? '';
        const pb = partsB[i] ?? '';
        const na = parseFloat(pa.replace(/^[A-Za-z]+/, ''));
        const nb = parseFloat(pb.replace(/^[A-Za-z]+/, ''));
        if (!isNaN(na) && !isNaN(nb)) {
            if (na !== nb) return na - nb;
            if (pa !== pb) return pa < pb ? -1 : 1;
        } else {
            if (pa !== pb) return pa < pb ? -1 : 1;
        }
    }
    return 0;
}

/**
 * Format a card's setId the same way the server's SwuPgn.formatSetId does, so
 * board cards can be matched against the SET#NUM refs in replay events.
 * e.g. ("ash", 13) -> "ASH#013".
 */
export function formatCardRef(set: string, number: number | string): string {
    return `${String(set).toUpperCase()}#${String(number).padStart(3, '0')}`;
}

/** Expand the terse P1/P2 result tokens into full player labels. */
export function formatResult(result: string): string {
    return result.replace(/\bP1\b/g, 'Player 1').replace(/\bP2\b/g, 'Player 2');
}

/** Resolve a card reference (SET#NUM or TOKEN:name) to a human name. */
export function cardName(ref: string | undefined, cardNames: Record<string, string>): string {
    if (!ref) return '';
    if (ref.startsWith('TOKEN:')) return ref.slice(6);
    return cardNames[ref] || ref;
}

/** A single human-readable beat in the replay timeline. */
export interface ReplayMove {
    eventIndex: number;
    seq: string;
    type: string;
    player: string;

    /** Index of the snapshot frame this beat is visible at. */
    snapshotIndex: number;
    label: string;

    /** Higher = more notable (used to surface key moments). */
    weight: number;
}

// Event types that read as a discrete "move" in the timeline. Bookkeeping
// sub-events (READY/EXHAUST/RESOURCE/DRAW/TRIGGER/GAME_STATE) are excluded to
// keep the list scannable; they still show in the per-frame caption.
const MOVE_TYPES = new Set([
    'PLAY', 'PLAY_SMUGGLE', 'PLAY_UPGRADE', 'PLAY_EVENT', 'DEPLOY_LEADER',
    'ATTACK', 'PASS', 'CLAIM_INITIATIVE', 'DEFEAT', 'GAME_END',
]);

const NOTABLE_WEIGHT: Record<string, number> = {
    GAME_END: 4,
    DEFEAT: 3,
    CLAIM_INITIATIVE: 2,
    ATTACK: 1,
};

/** One-line human description of any replay event. */
export function describeEvent(e: ReplayEvent, cardNames: Record<string, string>): string {
    const p = (e.player as string) || '';
    const c = (ref?: unknown) => cardName(typeof ref === 'string' ? ref : undefined, cardNames);
    switch (e.type) {
        case 'PLAY':
        case 'PLAY_SMUGGLE':
            return `${p} plays ${c(e.card)}`;
        case 'PLAY_UPGRADE':
            return `${p} plays upgrade ${c(e.card)}`;
        case 'PLAY_EVENT':
            return `${p} plays event ${c(e.card)}`;
        case 'DEPLOY_LEADER':
            return `${p} deploys ${c(e.card)}`;
        case 'ATTACK': {
            const tgt = e.defenderType === 'base' ? 'base' : c(e.defender);
            return `${p} attacks ${tgt || 'base'} with ${c(e.attacker)}`;
        }
        case 'PASS':
            return `${p} passes`;
        case 'CLAIM_INITIATIVE':
            return `${p} claims initiative`;
        case 'DAMAGE': {
            const tgt = c(e.target) || 'target';
            return `${c(e.source) || 'Effect'} deals ${e.amount ?? 0} to ${tgt}`;
        }
        case 'DEFEAT':
            return `${c(e.card)} is defeated`;
        case 'HEAL':
            return `${c(e.card)} heals ${e.amount ?? 0}`;
        case 'DRAW':
            return `${p} draws ${e.count ?? 1}`;
        case 'RESOURCE':
            return `${p} resources ${e.cardName || c(e.card)}`;
        case 'CREATE_TOKEN':
            return `${p} creates ${e.token ?? 'token'}`;
        case 'TRIGGER':
            return `${c(e.card)} triggers`;
        case 'DISCARD':
            return `${p} discards ${c(e.card)}`;
        case 'CAPTURE':
            return `${c(e.card)} is captured`;
        case 'RESCUE':
            return `${p} rescues ${c(e.card)}`;
        case 'TAKE_CONTROL':
            return `${p} takes control of ${c(e.card)}`;
        case 'GAME_END':
            return `${(e.winner as string) || 'Game'} wins — ${(e.reason as string) || 'game over'}`;
        default:
            return e.type;
    }
}

/**
 * Map every event to the snapshot frame where its outcome is visible (the first
 * snapshot at or after the event), then keep the discrete "moves". Snapshot
 * seqs are pre-extracted once; events are scanned with a forward pointer since
 * both arrays are already in file/seq order.
 */
export function buildMoveList(
    events: ReplayEvent[],
    snapshots: ReplaySnapshot[],
    cardNames: Record<string, string>,
): ReplayMove[] {
    const lastFrame = Math.max(0, snapshots.length - 1);
    const moves: ReplayMove[] = [];
    let frame = 0;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (typeof e.seq !== 'string' || !MOVE_TYPES.has(e.type)) continue;
        // Advance the frame pointer to the first snapshot at/after this event.
        while (frame < lastFrame && compareSeq(snapshots[frame].seq, e.seq) < 0) {
            frame++;
        }
        moves.push({
            eventIndex: i,
            seq: e.seq,
            type: e.type,
            player: (e.player as string) || '',
            snapshotIndex: frame,
            label: describeEvent(e, cardNames),
            weight: NOTABLE_WEIGHT[e.type] ?? 0,
        });
    }
    return moves;
}

/** A jump point on the scrub bar. */
export interface ReplayChapter {
    snapshotIndex: number;
    label: string;
}

function parseRoundPhase(seq: string): { round: string; phase: string } | null {
    const m = seq.match(/^R(\d+)\.([A-Z])/);
    if (!m) return null;
    const phase = m[2] === 'A' ? 'Action' : m[2] === 'G' ? 'Regroup' : m[2] === 'S' ? 'Setup' : m[2];
    return { round: m[1], phase };
}

/**
 * Human label for a seq's round + phase, e.g. "Round 1, Action Phase".
 * Empty string when the seq doesn't carry a round/phase. Single source of truth
 * for phase decoding so the scrub bar and transport label can't drift — the
 * server emits A=Action, G=Regroup, S=Setup.
 */
export function formatRoundPhase(seq: string): string {
    const rp = parseRoundPhase(seq);
    if (!rp) return '';
    return `Round ${rp.round}, ${rp.phase} Phase`;
}

/**
 * Chapter markers for the scrub bar: one per round boundary (first frame of a
 * new round), falling back to phase boundaries when the round counter never
 * advances (older recordings stuck at R0).
 */
export function buildChapters(snapshots: ReplaySnapshot[]): ReplayChapter[] {
    const chapters: ReplayChapter[] = [];
    let lastRound: string | null = null;
    let lastPhase: string | null = null;
    let roundAdvanced = false;

    snapshots.forEach((snap, idx) => {
        const rp = parseRoundPhase(snap.seq);
        if (!rp) return;
        if (rp.round !== lastRound) {
            if (lastRound !== null) roundAdvanced = true;
            chapters.push({ snapshotIndex: idx, label: `Round ${rp.round}` });
            lastRound = rp.round;
            lastPhase = rp.phase;
        } else if (rp.phase !== lastPhase) {
            chapters.push({ snapshotIndex: idx, label: rp.phase });
            lastPhase = rp.phase;
        }
    });

    // If the round counter never advanced, the "Round N" labels all collapse to
    // one — fall back to a phase-boundary marker per frame so the bar is useful.
    if (!roundAdvanced && snapshots.length > 1) {
        return snapshots.map((snap, idx) => {
            const rp = parseRoundPhase(snap.seq);
            return { snapshotIndex: idx, label: rp ? rp.phase : `${idx + 1}` };
        });
    }
    return chapters;
}

/**
 * Card references (SET#NUM / TOKEN:name) touched by an event — used to highlight
 * the affected cards on the board for the current frame.
 */
export function eventCardRefs(e: ReplayEvent): string[] {
    const refs: string[] = [];
    for (const key of ['card', 'attacker', 'defender', 'target', 'source']) {
        const v = e[key];
        if (typeof v === 'string' && v && v !== 'unknown') refs.push(v);
    }
    return refs;
}
