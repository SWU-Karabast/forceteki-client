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
    'CLAIM_INITIATIVE', 'CHOICE', 'MULLIGAN', 'KEEP_HAND', 'MODAL_CHOICE', 'ABILITY_ACTIVATE', 'LEADER_FLIP',
    'DAMAGE', 'HEAL', 'DEFEAT', 'EXHAUST', 'READY', 'EXHAUST_RESOURCES', 'READY_RESOURCES', 'DRAW', 'DISCARD', 'RESOURCE', 'SHUFFLE',
    'CREATE_TOKEN', 'MOVE', 'CAPTURE', 'RESCUE', 'TAKE_CONTROL', 'SHIELD_GAIN', 'SHIELD_USE',
    'EXPERIENCE_GAIN', 'STATUS_TOKEN', 'STATS', 'OVERWHELM', 'SEARCH', 'REVEAL', 'TRIGGER',
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
    // §5.2 the writer says handlers failed: records are missing between keyframes.
    if (typeof h.recorderErrors === 'number' && h.recorderErrors > 0) {
        out.push({ severity: 'warning', message: `The writer reports ${plural(h.recorderErrors, 'recorder error')} ([RecorderErrors]): events were dropped, so the board between two keyframes may be under-recorded; each keyframe resyncs it (§5.2).` });
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

/**
 * Which writer generation produced this file, and what that costs the replay (spec §22, §22.1).
 *
 * The format never bumped its version for these, so the header cannot say; each row of §22's
 * table names the record that gives the generation away. One line per detected generation,
 * each ending with what it means for fidelity. A current file yields nothing.
 */
export function writerGeneration(doc: SwuPgnDocument): string[] {
    const out: string[] = [];
    const events = (Array.isArray(doc.events) ? doc.events : []).filter((e): e is GameEvent => e != null && typeof e === 'object');
    const has = (t: string) => events.some((e) => e.t === t);
    const keyframes = events.flatMap((e) => ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe && typeof e.keyframe === 'object' ? [e.keyframe] : []));
    const keyframeSeats = keyframes.flatMap((k) => Object.values(k.players ?? {})).filter((p) => p != null && typeof p === 'object');
    const keyframeCards = keyframeSeats.flatMap((p) => (Array.isArray(p.cards) ? p.cards : [])).filter((c) => c != null && typeof c === 'object');
    const enteredArena = events.some((e) => e.t === 'MOVE' && (e.to === 'ground' || e.to === 'space'));

    // §22.1: a 1.1 file is OLDER than 1.0.
    if (doc.header.game === 'SWU-PGN/1.1') {
        out.push('Pre-release SWU-PGN/1.1 file (older than 1.0, §22.1): token ids carry no art id, token removals and hosts are inferred from adjacency, and keyframes may miss a seat.');
    }
    if (!doc.cards?.length) {
        out.push('No CARDS index: card names come from this client\'s own card database, so a card newer than it shows as an id.');
    }
    if (!doc.story?.length) {
        out.push('No STORY section: the Story tab is rendered from the events (§16).');
    }
    if (doc.story?.some((l) => /resources\)/.test(l))) {
        out.push('Story uses the early "(N resources)" wording: that number is the printed cost, not what was paid (§22).');
    }
    if (!has('STATS') && enteredArena) {
        out.push('Pre-STATS writer: unit power/HP are rebuilt from card data (marked ≈) without ability effects, keywords are not shown, and a just-played unit may read ready until the next regroup (§22).');
    }
    if (!has('EXHAUST_RESOURCES') && events.some((e) => (e.t === 'PLAY' || e.t === 'PLAY_EVENT' || e.t === 'PLAY_UPGRADE') && typeof e.cost === 'number' && e.cost > 0)) {
        out.push('Pre-counted-resources writer: the resource row reads all-ready through each action phase, and what was paid for a play is not recorded (§22).');
    }
    if (keyframeSeats.length > 0 && !keyframeSeats.some((p) => p.leader && typeof p.leader === 'object')) {
        out.push('Keyframes carry no leader, deck count or initiative status: the leader\'s ready state comes from EXHAUST/READY records, the deck count from the INIT order, and the initiative counter only from who holds it (§22).');
    }
    if (keyframeCards.length > 0 && !keyframeCards.some((c) => Array.isArray(c.captured))) {
        out.push('Keyframes carry no captives: a captured unit is filed under its captor from CAPTURE records alone and never verified (§22).');
    }
    const resourced = new Set<string>();
    const leaderIds = new Set([doc.header.p1Leader, doc.header.p2Leader].map(String));
    let baseEpicByCardId = 0;
    let controlNoZone = 0;
    let captureNoCaptor = 0;
    let exitWithHost = 0;
    let deckBuild = 0;
    let readyResource = 0;
    let gameEndShared = 0;
    for (const e of events) {
        if (e.t === 'MOVE') {
            if (e.to === 'resource') resourced.add(e.card);
            if (e.from === 'resource') resourced.delete(e.card);
            if ((e.from === 'ground' || e.from === 'space') && typeof e.attachedTo === 'string' && e.attachedTo) exitWithHost++;
            if (e.from === 'outsideTheGame' && e.to === 'deck') deckBuild++;
        } else if (e.t === 'TAKE_CONTROL' && !e.zone) {
            controlNoZone++;
        } else if (e.t === 'CAPTURE' && !e.by) {
            captureNoCaptor++;
        } else if (e.t === 'READY' && resourced.has(e.card)) {
            readyResource++;
        } else if (e.t === 'GAME_END' && !/\.game-end$/.test(String(e.seq))) {
            gameEndShared++;
        } else if (e.t === 'ABILITY_ACTIVATE' && e.epic === true
            && !/^base@[12]$/.test(String(e.card)) && !leaderIds.has(String(e.card))) {
            // §22: a base activating its own Epic Action used to name itself by card id. Only
            // `base@N` resolves to a seat (§6.3), so the spent flag is lost. An epic activation
            // that names neither a base nor either seat's leader is that early writer.
            baseEpicByCardId++;
        }
    }
    if (controlNoZone > 0) {
        out.push(`${plural(controlNoZone, 'control change')} recorded without a zone: the stolen card stays under its old controller on the board (§22).`);
    }
    if (captureNoCaptor > 0) {
        out.push(`${plural(captureNoCaptor, 'capture')} naming no captor: the captive is shown nowhere until it is rescued (§22).`);
    }
    if (exitWithHost > 0) {
        out.push('Exit MOVEs name a host (early writer): ignored, an attachment comes off on the zone transition (§10.1).');
    }
    if (deckBuild > 0) {
        out.push(`Deck construction recorded as ${plural(deckBuild, 'MOVE')} (early writer): ignored, the decks come from DECKS and INIT (§10.1).`);
    }
    if (readyResource > 0) {
        out.push('Per-card READY of a resource (early writer): ignored, resources are counted, never named (§10.1).');
    }
    if (gameEndShared > 0) {
        out.push('GAME_END shares its seq with the phase end (early writer): a link to that moment lands on the first of the two.');
    }
    if (baseEpicByCardId > 0) {
        out.push(`${plural(baseEpicByCardId, 'Epic Action')} activated by a card the file names by id rather than base@N (early writer): a base's spent Epic Action is not shown (§22).`);
    }
    if (/^forceteki@\d+\.\d+\.\d+$/.test(doc.header.engine)) {
        out.push(`[Engine "${doc.header.engine}"] is a package version, not a commit: the build that wrote this file cannot be pinpointed (§5.3).`);
    }
    return out;
}
