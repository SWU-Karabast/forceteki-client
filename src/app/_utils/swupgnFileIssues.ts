import type { SwuPgnDocument, GameEvent } from '@/lib/swupgn';

/**
 * What the spec tells a reader to SURFACE about a file, short of refusing it.
 *
 * checkKeyframes() answers "does the file agree with itself"; this answers "did the writer
 * follow the rules, and can the file be trusted for what it claims". Every check cites the
 * spec section that asks for it. None of these stop the replay: the reader repairs or
 * ignores each one on the way through, and this is the note that says it did.
 */
export interface FileIssue {
    severity: 'warning' | 'info';
    message: string;
}

/** Every `t` this reader understands (spec §10). Anything else folds as "do nothing" (§18). */
const KNOWN_EVENT_TYPES = new Set<string>([
    'PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER', 'ATTACK', 'PASS',
    'CLAIM_INITIATIVE', 'CHOICE', 'MULLIGAN', 'KEEP_HAND', 'MODAL_CHOICE', 'ABILITY_ACTIVATE',
    'DAMAGE', 'HEAL', 'DEFEAT', 'EXHAUST', 'READY', 'DRAW', 'DISCARD', 'RESOURCE', 'SHUFFLE',
    'CREATE_TOKEN', 'MOVE', 'CAPTURE', 'RESCUE', 'TAKE_CONTROL', 'SHIELD_GAIN', 'SHIELD_USE',
    'EXPERIENCE_GAIN', 'STATUS_TOKEN', 'OVERWHELM', 'SEARCH', 'REVEAL', 'TRIGGER',
    'PHASE_START', 'PHASE_END', 'ROUND_START', 'ROUND_END', 'GAME_END',
]);

/** The complete zone vocabulary (spec §6.2). Any other string in from/to/zone is non-conformant. */
const ZONES = new Set(['deck', 'hand', 'resource', 'ground', 'space', 'discard', 'base', 'outsideTheGame', 'capture']);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export function fileIssues(doc: SwuPgnDocument): FileIssue[] {
    const out: FileIssue[] = [];
    const h = doc.header;

    // §5.3 provenance sentinels: accept the file, but do not present it as traceable.
    if (/@unknown$/.test(h.engine)) {
        out.push({ severity: 'warning', message: `Untraceable build: the writer recorded [Engine "${h.engine}"], so this file cannot be attributed to any known build.` });
    }
    if (h.seed === 'unseeded') {
        out.push({ severity: 'warning', message: 'No seed recorded ([Seed "unseeded"]): the fold still works, but an engine cannot deterministically re-run this game.' });
    }
    // §5.2 a perspective file may be missing the other player's hidden cards.
    if (h.perspective === 'P1' || h.perspective === 'P2') {
        out.push({ severity: 'info', message: `Recorded through ${h.perspective === 'P1' ? 'Player 1' : 'Player 2'}'s eyes: the opponent's hidden cards may be absent from this file.` });
    }

    const unknownTypes = new Map<string, number>();
    let inertMoves = 0;
    let badZones = 0;
    let partialKeyframes = 0;
    for (const e of doc.events as Array<GameEvent & { from?: unknown; to?: unknown; zone?: unknown; keyframe?: { players?: Record<string, unknown> } }>) {
        if (e == null || typeof e !== 'object') continue;
        const t = String(e.t);
        if (!KNOWN_EVENT_TYPES.has(t)) {
            unknownTypes.set(t, (unknownTypes.get(t) ?? 0) + 1);
            continue;
        }
        if (t === 'MOVE') {
            // §10.1: from/to required, non-empty, distinct, and from the vocabulary.
            if (!e.from || !e.to || e.from === e.to) inertMoves++;
            else if (!ZONES.has(String(e.from)) || !ZONES.has(String(e.to))) badZones++;
        } else if ('zone' in e && typeof e.zone === 'string' && e.zone && !ZONES.has(e.zone)) {
            badZones++;
        }
        if ((t === 'ROUND_START' || t === 'ROUND_END') && e.keyframe) {
            // §13: a keyframe must carry both seats; a partial one is a damaged checkpoint.
            const players = e.keyframe.players ?? {};
            if (!players['1'] || !players['2']) partialKeyframes++;
        }
    }

    if (unknownTypes.size > 0) {
        const list = [...unknownTypes].map(([t, n]) => `${t} ×${n}`).join(', ');
        out.push({ severity: 'warning', message: `${plural(unknownTypes.size, 'unknown event type')} folded as "do nothing" (§18): ${list}` });
    }
    if (inertMoves > 0) {
        out.push({ severity: 'warning', message: `${plural(inertMoves, 'MOVE')} with an empty or identical from/to, ignored (§10.1).` });
    }
    if (badZones > 0) {
        out.push({ severity: 'warning', message: `${plural(badZones, 'record')} naming a zone outside the vocabulary (§6.2).` });
    }
    if (partialKeyframes > 0) {
        out.push({ severity: 'warning', message: `${plural(partialKeyframes, 'keyframe')} missing a seat; the folded state was kept for that seat instead (§13).` });
    }
    return out;
}
