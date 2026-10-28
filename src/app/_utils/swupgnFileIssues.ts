import { baseId, displayText, SwuPgnError, type SwuPgnDocument, type GameEvent, type ParseNotes } from '@/lib/swupgn';
import { isLetteredSeq, isNumberedAction } from './swupgnMoves';
import { isPreRelease } from './swupgnWriter';

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
    'PHASE_START', 'PHASE_END', 'ROUND_START', 'ROUND_END', 'GAME_END', 'UNDO',
]);

/** The complete zone vocabulary (spec §6.2). Any other string in from/to/zone is non-conformant. */
const ZONES = new Set(['deck', 'hand', 'resource', 'ground', 'space', 'discard', 'base', 'outsideTheGame', 'capture']);

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * The viewer refusing a file that parsed: nothing to replay, or more than the frame budget.
 * Typed like SwuPgnError so a caller branches on `code`, never on the message.
 */
export class ReplayRefusedError extends Error {
    public readonly code: 'no-events' | 'too-heavy';

    public constructor(code: 'no-events' | 'too-heavy', message: string) {
        super(message);
        this.name = 'ReplayRefusedError';
        this.code = code;
    }
}

const onLine = (e: SwuPgnError) => (e.line != null ? ` on line ${e.line}` : '');
const TOO_BIG = 'This replay is larger than any real game, so it was not opened.';

/**
 * What to tell the user when a replay cannot be opened. A parse error is told by its §24 code,
 * never by its message (which is free text, and may quote the file); a refusal by its own
 * code; anything else (storage, the network) by its message.
 */
export function replayErrorMessage(err: unknown, fallback = 'Failed to read the replay file.'): string {
    if (err instanceof ReplayRefusedError) {
        return err.message;
    }
    if (!(err instanceof SwuPgnError)) {
        return err instanceof Error && err.message ? err.message : fallback;
    }
    switch (err.code) {
        case 'not-swupgn':
            return 'This is not a SWU-PGN replay: a .swupgn file starts with a [Game "SWU-PGN/1.0"] line.';
        case 'unsupported-major':
            return 'This replay was written in a newer, incompatible version of SWU-PGN (this viewer reads 1.x), so it cannot be opened here. A newer Karabast may open it.';
        case 'too-large':
        case 'line-too-long':
        case 'too-many-records':
        case 'too-deep':
            return TOO_BIG;
        case 'bad-header-line':
            return `The replay's header is damaged${onLine(err)}: a header line holds something other than [Tag "value"] pairs.`;
        case 'bad-escape':
            return `The replay's header is damaged${onLine(err)}: a value uses a backslash escape other than \\\\ or \\".`;
        case 'duplicate-tag':
            return `The replay's header names the same tag twice${onLine(err)}, so there is no telling which value is right.`;
        case 'missing-tag':
            return 'The replay\'s header is missing a required tag, so it cannot be opened.';
        case 'bad-count':
            return 'The replay\'s header gives a count (Rounds, RecorderErrors, Undos, WriterRevision or GameNumber) that is not a whole number.';
        case 'duplicate-section':
            return `The replay has the same %%% section twice${onLine(err)}, so there is no telling which one to play.`;
        case 'record-outside-section':
            return `The replay is damaged${onLine(err)}: a record comes before the first %%% section.`;
        case 'bad-json':
            return `The replay is damaged${onLine(err)}: that line is not valid JSON. The file may be cut short or edited by hand.`;
        case 'duplicate-key':
            return `The replay is damaged${onLine(err)}: a record names the same field twice, so there is no telling which value is right.`;
        case 'reserved-key':
            return `The replay was refused${onLine(err)}: it uses a name reserved for safety (such as __proto__ or constructor) as a tag, a field or a status token.`;
        case 'not-object':
            return `The replay is damaged${onLine(err)}: a record is JSON but not an object.`;
        default:
            return `The replay could not be read (${err.code}${onLine(err)}).`;
    }
}

/** A `1.x` this reader is older than (§18). */
function newerMinor(doc: SwuPgnDocument & ParseNotes): string | null {
    const m = /^SWU-PGN\/1\.(\d+)$/.exec(String(doc.header.game));
    return m && Number(m[1]) > 0 ? doc.header.game : null;
}

export function fileIssues(doc: SwuPgnDocument & ParseNotes): FileIssue[] {
    // Every message may quote the file (an Engine, a tag value, a section name): neutralised for display (§23).
    return fileIssuesOf(doc).map((i) => ({ ...i, message: displayText(i.message) }));
}

function fileIssuesOf(doc: SwuPgnDocument & ParseNotes): FileIssue[] {
    const out: FileIssue[] = [];
    const h = doc.header;

    // §3 [C-01]: say when a file is a pre-release file, without blocking it. Pre-release is a
    // pilot writer's file with no WriterRevision ([V-04], §25); another writer's file without the
    // tag is an ordinary file ([W-12]). A WriterRevision that is not a count never gets here:
    // parse() refuses it (bad-count).
    if (isPreRelease(h)) {
        out.push({ severity: 'info', message: 'Pre-release file from a pilot writer (no [WriterRevision]): written before SWU-PGN 1.0 was published, so some records follow an earlier shape. It replays, with the notes below on what that costs (Appendix C).' });
    }
    // §18: a reader SHOULD warn that a file is newer than it is. What it adds is skipped.
    const newer = newerMinor(doc);
    if (newer) {
        out.push({ severity: 'info', message: `Written as ${newer}, newer than this viewer's SWU-PGN/1.0: anything the newer version added is skipped (§18).` });
    }

    // §18: a section this reader does not know is skipped. Name it, so a misspelled banner
    // (`%%% EVENT`) is not just a file with nothing in it.
    if (doc.skippedSections?.length) {
        out.push({ severity: 'info', message: `Skipped ${plural(doc.skippedSections.length, 'section')} this reader does not know (${skippedSectionList(doc.skippedSections)}): a newer format's, or a misspelled banner (§18).` });
    }

    // §5.3 provenance sentinels: accept the file, but do not present it as traceable.
    // §5.3: a build with uncommitted changes. The file is real, but the source it ran is not on record.
    if (/-dirty$/.test(h.engine)) {
        out.push({ severity: 'warning', message: `Uncommitted build: the writer recorded [Engine "${h.engine}"], so the code that wrote this file is not exactly any published commit (§5.3).` });
    }
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
    let unknownDefeats = 0;
    let inertMoves = 0;
    let badZones = 0;
    let partialKeyframes = 0;
    for (const e of doc.events as Array<GameEvent & { from?: unknown; to?: unknown; zone?: unknown; keyframe?: { players?: Record<string, unknown> } }>) {
        if (e == null || typeof e !== 'object') continue;
        const t = String(e.t);
        if (!KNOWN_EVENT_TYPES.has(t)) {
            // §18: an `X_` extension is ignored without a warning.
            if (!t.startsWith('X_')) unknownTypes.set(t, (unknownTypes.get(t) ?? 0) + 1);
            continue;
        }
        if (t === 'DEFEAT' && (e as { reason?: unknown }).reason === 'unknown') unknownDefeats++;
        if (t === 'MOVE') {
            // §10.1: from/to required, non-empty, distinct, and from the vocabulary. A MOVE from an
            // arena to itself is an attachment changing hosts (§2.1 rule 4), not inert.
            if (!e.from || !e.to || (e.from === e.to && e.from !== 'ground' && e.from !== 'space')) inertMoves++;
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
    // §2.1: a DEFEAT whose reason the writer could not tell means the file is not complete.
    if (unknownDefeats > 0) {
        out.push({ severity: 'info', message: `${plural(unknownDefeats, 'defeat')} recorded with reason "unknown": the writer could not tell why ${unknownDefeats === 1 ? 'that card' : 'those cards'} left play, so this file is not complete (§2.1).` });
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
    // §10.2: GAME_END.winner MUST agree with Result, and a file with no GAME_END is Incomplete.
    // The last GAME_END counts (play may go on after the game ends); an outcome from a newer minor
    // is skipped (§18). The header still shows the file's Result: this only says they disagree.
    if (resultMismatch(doc)) {
        out.push({ severity: 'warning', message: 'The Result in the header doesn\'t match how the game ended (§10.2).' });
    }
    return out;
}

const RESULT_OF_WINNER = new Map<unknown, string>([[1, 'P1'], [2, 'P2'], ['Draw', 'Draw']]);

/** The validator's `result-mismatch` (§24), by the same rule. */
export function resultMismatch(doc: SwuPgnDocument): boolean {
    const result = doc.header.result;
    if (!['P1', 'P2', 'Draw', 'Incomplete'].includes(result)) {
        return false;
    }
    const gameEnd = (Array.isArray(doc.events) ? doc.events : [])
        .filter((e) => e != null && typeof e === 'object' && e.t === 'GAME_END').pop() as { winner?: unknown } | undefined;
    const expected = gameEnd ? RESULT_OF_WINNER.get(gameEnd.winner) : 'Incomplete';
    return expected !== undefined && expected !== result;
}

/**
 * The names of sections parse() skipped, for a message: a file can carry any number of unknown
 * `%%%` banners of any length, so at most three are named, each cut short, plus how many more.
 */
export function skippedSectionList(names: readonly string[], banner = true): string {
    const shown = names.slice(0, 3).map((n) => `${banner ? '%%% ' : ''}${n.length > 40 ? `${n.slice(0, 39)}…` : n}`);
    return names.length > 3 ? `${shown.join(', ')} and ${names.length - 3} more` : shown.join(', ');
}

/**
 * Which writer generation produced this file, and what that costs the replay (spec §22).
 *
 * The format never bumped its version for these, so the header cannot say; each row of §22's
 * table names the record that gives the generation away. One line per detected generation,
 * each ending with what it means for fidelity. A current file yields nothing.
 */
export function writerGeneration(doc: SwuPgnDocument & ParseNotes): string[] {
    const out: string[] = [];
    const events = (Array.isArray(doc.events) ? doc.events : []).filter((e): e is GameEvent => e != null && typeof e === 'object');
    const has = (t: string) => events.some((e) => e.t === t);
    const keyframes = events.flatMap((e) => ((e.t === 'ROUND_START' || e.t === 'ROUND_END') && e.keyframe && typeof e.keyframe === 'object' ? [e.keyframe] : []));
    const keyframeSeats = keyframes.flatMap((k) => Object.values(k.players ?? {})).filter((p) => p != null && typeof p === 'object');
    const keyframeCards = keyframeSeats.flatMap((p) => (Array.isArray(p.cards) ? p.cards : [])).filter((c) => c != null && typeof c === 'object');
    const enteredArena = events.some((e) => e.t === 'MOVE' && (e.to === 'ground' || e.to === 'space'));

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
    // By base id: in a mirror match seat 2's leader is `SET#NUM:2` (§11), the header names `SET#NUM`.
    const leaderIds = new Set([doc.header.p1Leader, doc.header.p2Leader].map((id) => baseId(String(id))));
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
            && !/^base@[12]$/.test(String(e.card)) && !leaderIds.has(baseId(String(e.card)))) {
            // §22: a base activating its own Epic Action used to name itself by card id. Only
            // `base@N` resolves to a seat (§6.3), so the spent flag is lost. An epic activation
            // that names neither a base nor either seat's leader is that early writer.
            baseEpicByCardId++;
        }
    }
    // §22: before the Part D-1 fix, the ROUND_END keyframe was taken AFTER the round had rolled
    // over, so it claimed `phase: setup` and `initiativeTaken: false` in a round whose initiative
    // WAS claimed -- one keyframe mismatch per such round, on every game that writer produced.
    // Only say so when it actually costs a mismatch (a round nobody claimed in reads the same
    // either way), because this line exists to explain the FileHealth badge, not to add to it.
    // One pass for the claimed rounds: scanning every event per ROUND_END was quadratic. `seq`
    // comes off the file and may be any JSON value.
    const claimedRounds = new Set(events.flatMap((c) => (c.t === 'CLAIM_INITIATIVE' ? [/^R(\d+)\./.exec(String(c.seq))?.[1]] : [])));
    const staleRoundEnd = events.filter((e) => e.t === 'ROUND_END'
        && e.keyframe?.phase === 'setup' && e.keyframe?.initiativeTaken === false
        && claimedRounds.has(String(e.round))).length;
    if (staleRoundEnd > 0) {
        out.push(`Pre-D-1 writer: ${plural(staleRoundEnd, 'ROUND_END keyframe')} snapshotted after the round rolled over, so the initiative counter in ${staleRoundEnd === 1 ? 'it disagrees' : 'them disagrees'} with the events (§22). That is the whole of the mismatch count; the events themselves are intact.`);
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
    // Appendix C: a pilot writer's file with no WriterRevision is a pre-release file. That alone is no line here (the hand-written `minimal` vector carries no tag
    // either); each pilot behaviour that changes what the replay shows gets its own below.
    const baseIds = new Set([doc.header.p1Base, doc.header.p2Base].map(String));
    let passAfterOwnAction = 0;
    let deployAsSecondAction = 0;
    let frameworkSrc = 0;
    let baseByCardId = 0;
    let shortDraw = 0;
    let fortifyNoHost = 0;
    let lastAction: GameEvent | undefined;
    // Once a player claims the initiative they are out of the phase, so the opponent acts
    // alone and its own PASS ends the phase (CR 6): a PASS after its own action, legitimately.
    let claimedThisPhase = false;
    for (const e of events) {
        if (e.t === 'PASS' && !isLetteredSeq(e.seq) && !claimedThisPhase && lastAction && 'p' in lastAction && lastAction.p === e.p) passAfterOwnAction++;
        if (e.t === 'DEPLOY_LEADER' && !isLetteredSeq(e.seq) && lastAction?.t === 'ABILITY_ACTIVATE'
            && (lastAction.kind === 'epic' || lastAction.epic === true) && baseId(String(lastAction.card)) === baseId(String(e.card))) deployAsSecondAction++;
        if ((e.t === 'DAMAGE' || e.t === 'HEAL') && typeof e.src === 'string' && /^Framework effect/.test(e.src)) frameworkSrc++;
        if (((e.t === 'DAMAGE' || e.t === 'HEAL') && baseIds.has(String(e.src))) || (e.t === 'DEFEAT' && baseIds.has(String(e.defeatedBy)))) baseByCardId++;
        if (e.t === 'DRAW' && Array.isArray(e.cards) && e.cards.length > 0 && e.count !== e.cards.length) shortDraw++;
        if (e.t === 'MOVE' && e.to === 'base' && e.from !== 'base' && e.kind === 'upgrade' && !e.attachedTo) fortifyNoHost++;
        if (isNumberedAction(e)) lastAction = e;
        else if (e.t === 'PHASE_START' || e.t === 'ROUND_START') { lastAction = undefined; claimedThisPhase = false; }
        if (e.t === 'CLAIM_INITIATIVE') claimedThisPhase = true;
    }
    // Appendix C: a file that states a WriterRevision, or comes from a writer the pilot registry
    // does not list (§25), is not a pilot file, so none of these rows describe it; a match there
    // is a coincidence of play, not the early writer.
    const pilot = isPreRelease(doc.header);
    if (pilot && passAfterOwnAction > 0) {
        out.push('PASS written after every action (pilot writer): each action is followed by a "passes" line, and action numbers differ from a current file of the same game (§22).');
    }
    if (pilot && deployAsSecondAction > 0) {
        out.push(`${plural(deployAsSecondAction, 'leader deploy')} numbered as an action of ${deployAsSecondAction === 1 ? 'its' : 'their'} own after the Epic Action that performed ${deployAsSecondAction === 1 ? 'it' : 'them'} (pilot writer): one action reads as two (§22).`);
    }
    if (pilot && frameworkSrc > 0) {
        out.push('Damage the rules dealt (drawing from an empty deck) names "Framework effect" as its source (pilot writer): read as no source (§22).');
    }
    if (pilot && baseByCardId > 0) {
        out.push(`A base is named by its card id rather than base@N in ${plural(baseByCardId, 'record')} (pilot writer): damage, heals and defeats that base dealt are not tied to its seat (§22).`);
    }
    if (pilot && shortDraw > 0) {
        out.push(`${plural(shortDraw, 'DRAW')} counting the cards asked for, not the cards drawn (pilot writer): the hand follows the cards listed (§22).`);
    }
    if (pilot && fortifyNoHost > 0 && !keyframeSeats.some((p) => Array.isArray(p.baseUpgrades))) {
        out.push(`${plural(fortifyNoHost, 'Fortify upgrade')} played onto a base the file does not name, and no keyframe lists base upgrades (pilot writer): each is placed on its player's own base, unverified (§22).`);
    }
    if (/^forceteki@\d+\.\d+\.\d+$/.test(doc.header.engine)) {
        out.push(`[Engine "${doc.header.engine}"] is a package version, not a commit: the build that wrote this file cannot be pinpointed (§5.3).`);
    }
    return out;
}
