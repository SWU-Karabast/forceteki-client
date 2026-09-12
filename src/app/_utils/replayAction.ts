import { type GameEvent, type NameResolver, type Seat, asIdList } from '@/lib/swupgn';

// What happened on the current frame, for the animated caption + board highlight. Unlike
// the move list (buildMoveList), this covers EVERY frame's event, worded as the story's
// table words it (spec §16): the same sentence a reader finds in `%%% STORY`, one frame at a
// time. Mechanism records (MOVE, EXHAUST, the resource counters, STATS, choices, shuffles)
// print nothing, as they print nothing in the story.
export interface FrameAction {
    label: string;
    // In-play card ids to glow this frame (the cards that just acted). Cards that move to a
    // face-down pile (resourced/discarded) aren't individually highlightable — caption only.
    highlight: string[];
    // Coarse kind, for styling/telemetry if needed.
    kind: 'play' | 'deploy' | 'ability' | 'attack' | 'defeat' | 'resource' | 'discard' | 'draw' | 'other' | 'none';
}

const who = (p?: Seat): string => (p === 1 ? 'Player 1' : p === 2 ? 'Player 2' : '');
const other = (p?: Seat): Seat | undefined => (p === 1 ? 2 : p === 2 ? 1 : undefined);
const isBase = (id: unknown): boolean => typeof id === 'string' && /^base@[12]$/.test(id);

/**
 * An ABILITY_ACTIVATE the player SPENT their action on (CR 6.1), which §16 numbers as its own
 * action. `kind` is the writer's stable answer; the `_action_N` id suffix is the fallback for
 * files written before `kind` existed, where the record is also filed as a lettered
 * consequence of whatever came before it (spec §22).
 */
export function isPlayerAction(e: GameEvent): boolean {
    if (e.t !== 'ABILITY_ACTIVATE') return false;
    if (e.kind) return e.kind === 'action' || e.kind === 'epic';
    return e.epic === true || /_action_\d+$/.test(String(e.ability ?? ''));
}

/**
 * The story's `nm()` (spec §16): `base@N` is "Player N's base"; a copy keeps its ` #N` so two
 * Wampas read as "Wampa" and "Wampa #2". Every NameResolver strips the suffix before lookup.
 */
export function storyName(id: string, n: NameResolver): string {
    // Takes a BARE resolver (one that maps SET#NUM -> title). Passing a resolver that already
    // ran through here appends the copy suffix twice: "Ant Droid #2 #2".
    const s = String(id);
    const base = /^base@([12])$/.exec(s);
    if (base) return `${who(Number(base[1]) as Seat)}'s base`;
    const copy = /:(\d+)$/.exec(s);
    return n.nameOf(s) + (copy ? ` #${copy[1]}` : '');
}

const none: FrameAction = { label: '', highlight: [], kind: 'none' };
const cost = (e: { cost?: unknown }): string => (typeof e.cost === 'number' ? ` (cost ${e.cost})` : '');

export function frameAction(e: GameEvent | undefined, n: NameResolver): FrameAction {
    if (!e || typeof e !== 'object') return none;
    const nm = (id: string) => storyName(id, n);
    const list = (ids: unknown) => asIdList(ids).map(nm).join(', ');
    const unit = (id: string): string[] => (isBase(id) ? [] : [id]);
    switch (e.t) {
        case 'PLAY':
        case 'PLAY_SMUGGLE':
            return { label: `${who(e.p)} plays ${nm(e.card)}${e.zone ? ` to ${e.zone}` : ''}${cost(e)}`, highlight: [e.card], kind: 'play' };
        case 'PLAY_UPGRADE':
            return {
                label: `${who(e.p)} plays ${nm(e.card)}${e.target ? ` on ${nm(e.target)}` : e.zone ? ` to ${e.zone}` : ''}${cost(e)}`,
                highlight: e.target ? [e.card, e.target] : [e.card],
                kind: 'play',
            };
        case 'PLAY_EVENT':
            return { label: `${who(e.p)} plays ${nm(e.card)}${cost(e)}`, highlight: [], kind: 'play' };
        case 'DEPLOY_LEADER':
            return {
                label: `${who(e.p)} deploys ${nm(e.card)}${e.target ? ` as a pilot on ${nm(e.target)}` : ''}`,
                highlight: e.target ? [e.card, e.target] : [e.card],
                kind: 'deploy',
            };
        case 'ABILITY_ACTIVATE':
            // An action or Epic Action is the player's own action, and the story names them that
            // way ("Player 1 uses Director Krennic", "... 's Epic Action"). Every other kind is
            // something the game did, so the card is the subject: "Ant Droid uses an ability".
            return isPlayerAction(e)
                ? { label: `${who(e.p)} uses ${nm(e.card)}${e.kind === 'epic' || e.epic ? '\'s Epic Action' : ''}`, highlight: [e.card], kind: 'ability' }
                : { label: `${nm(e.card)} uses an ability`, highlight: [e.card], kind: 'ability' };
        case 'UNDO':
            // The retracted records are already gone from the stream: this marks WHERE.
            return { label: `${who(e.by)} takes back a move`, highlight: [], kind: 'other' };
        case 'TRIGGER':
            return { label: `${nm(e.card)} triggers`, highlight: [e.card], kind: 'ability' };
        case 'ATTACK':
            return {
                label: `${who(e.p)} attacks ${e.defenderType === 'base' ? `${who(other(e.p))}'s base` : nm(e.def)} with ${nm(e.atk)}`,
                highlight: e.defenderType === 'base' ? [e.atk] : [e.atk, e.def],
                kind: 'attack',
            };
        case 'DAMAGE':
            return { label: `${e.amt} damage to ${nm(e.tgt)} — ${e.hp} HP left`, highlight: unit(e.tgt), kind: 'other' };
        case 'OVERWHELM':
            return { label: `${e.amt} Overwhelm damage to ${who(other(e.p))}'s base — ${e.hp} HP left`, highlight: [], kind: 'other' };
        case 'HEAL':
            return { label: `${e.amt} healed on ${nm(e.tgt)} — ${e.hp} HP left`, highlight: unit(e.tgt), kind: 'other' };
        case 'DEFEAT':
            return { label: `${nm(e.card)} is defeated${e.defeatedBy ? ` by ${nm(e.defeatedBy)}` : ''}`, highlight: [], kind: 'defeat' };
        case 'STATUS_TOKEN':
            return { label: `${nm(e.card)} ${e.count < 0 ? 'loses' : 'gains'} ${Math.abs(e.count)} ${e.token}`, highlight: [e.card], kind: 'other' };
        case 'SHIELD_GAIN':
            return { label: `${nm(e.card)} gains ${e.count ?? 1} shield`, highlight: [e.card], kind: 'other' };
        case 'SHIELD_USE':
            return { label: `${nm(e.card)} loses ${e.count ?? 1} shield`, highlight: [e.card], kind: 'other' };
        case 'EXPERIENCE_GAIN':
            return { label: `${nm(e.card)} ${e.count < 0 ? 'loses' : 'gains'} ${Math.abs(e.count)} experience`, highlight: [e.card], kind: 'other' };
        case 'DRAW':
            return { label: `${who(e.p)} draws ${e.count}${asIdList(e.cards).length ? `: ${list(e.cards)}` : ''}`, highlight: [], kind: 'draw' };
        case 'DISCARD':
            return { label: `${who(e.p)} discards ${list(e.cards)}`, highlight: [], kind: 'discard' };
        case 'RESOURCE':
            return { label: `${who(e.p)} resources ${nm(e.card)}`, highlight: [], kind: 'resource' };
        case 'MOVE':
            // A 1.1 file has no RESOURCE record (spec §22.1); the MOVE into the row is the
            // only place the commitment shows. Every other MOVE is mechanism.
            if (e.to === 'resource' && e.from === 'hand') {
                return { label: `${who(e.p)} resources ${nm(e.card)}`, highlight: [], kind: 'resource' };
            }
            return none;
        case 'REVEAL':
            return { label: `${who(e.p)} reveals ${list(e.cards)}`, highlight: [], kind: 'other' };
        case 'SEARCH':
            return { label: e.found ? `${who(e.p)} searches, finds ${list(e.found)}` : `${who(e.p)} searches their deck`, highlight: [], kind: 'other' };
        case 'CREATE_TOKEN':
            return { label: `${who(e.p)} creates ${nm(e.token)} in ${e.zone}`, highlight: [e.token], kind: 'other' };
        case 'CAPTURE':
            return { label: `${who(e.p)} captures ${nm(e.card)}${e.by ? ` with ${nm(e.by)}` : ''}`, highlight: e.by ? unit(e.by) : [], kind: 'other' };
        case 'RESCUE':
            return { label: `${who(e.p)} rescues ${nm(e.card)}`, highlight: [e.card], kind: 'other' };
        case 'TAKE_CONTROL':
            return { label: `${who(e.p)} takes control of ${nm(e.card)}`, highlight: [e.card], kind: 'other' };
        case 'MULLIGAN':
            return { label: `${who(e.p)} mulligans`, highlight: [], kind: 'other' };
        case 'KEEP_HAND':
            return { label: `${who(e.p)} keeps their hand`, highlight: [], kind: 'other' };
        case 'CLAIM_INITIATIVE':
            return { label: `${who(e.p)} claims initiative`, highlight: [], kind: 'other' };
        // A double-sided leader turning over is a visible beat, not mechanism: its title,
        // aspects and traits all change and no other record implies it (§16 words it exactly
        // this way, and render.ts prints the same line).
        case 'LEADER_FLIP':
            return { label: `${who(e.p)} flips ${nm(e.card)}`, highlight: [e.card], kind: 'other' };
        case 'PASS':
            return { label: `${who(e.p)} passes`, highlight: [], kind: 'other' };
        case 'GAME_END':
            return {
                label: e.winner === 'Draw' ? `Game ends in a draw — ${e.reason}` : `${who(e.winner as Seat)} wins — ${e.reason}`,
                highlight: [], kind: 'other',
            };
        // Mechanism, not story (spec §16): the board shows what these did.
        case 'EXHAUST': case 'READY': case 'EXHAUST_RESOURCES': case 'READY_RESOURCES': case 'STATS':
        case 'CHOICE': case 'MODAL_CHOICE': case 'SHUFFLE': case 'PHASE_START': case 'PHASE_END':
        case 'ROUND_START': case 'ROUND_END':
            return none;
        default:
            return none;
    }
}
