import { type GameEvent, type NameResolver, type Seat, asIdList, displayText, flatten, shorten } from '@/lib/swupgn';
import { effectEndLine, effectStartLine } from './effectWords';

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
    // Both parts are cut as render()'s nm() cuts them, so an id the index does not list, or a
    // crafted copy number, cannot run past 120 characters either (§16, R-04).
    return shorten(n.nameOf(s)) + (copy ? shorten(` #${copy[1]}`) : '');
}

const none: FrameAction = { label: '', highlight: [], kind: 'none' };
const cost = (e: { cost?: unknown }): string => (typeof e.cost === 'number' ? ` (cost ${e.cost})` : '');

/** `n` may be a sided resolver (`sidedResolver`); its `frontNameOf` names a two-sided card's
 *  printed front, which the deploy and flip captions need whichever side is up. The label
 *  interpolates file text (a `Reason`, a raw id), so it is neutralised for display (§23). */
/**
 * `hiddenSeat`: the seat whose hand is hidden (the viewer's fog-of-war). Its draws and
 * resource picks are said by count, never by card, so a caption cannot spoil what the board hides.
 */
export interface IFrameActionOptions {
    hiddenSeat?: Seat;
    // Effect id -> source card (effectWords.effectSources), so an EFFECT_END, which carries only
    // the id, is named by its source as the story names it. Without it the id is shown.
    effectSourceOf?: (id: string) => string | undefined;
}

export function frameAction(e: GameEvent | undefined, n: NameResolver & { frontNameOf?: (id: string) => string }, opts: IFrameActionOptions = {}): FrameAction {
    const a = frameActionOf(e, n, opts.hiddenSeat, opts.effectSourceOf);
    // One record is one line (§16), here as in the story: displayText keeps tab and line feed
    // for notes, so the caption and the move list flatten what it kept.
    return a.label ? { ...a, label: flatten(displayText(a.label)) } : a;
}

function frameActionOf(
    e: GameEvent | undefined,
    n: NameResolver & { frontNameOf?: (id: string) => string },
    hiddenSeat?: Seat,
    effectSourceOf?: (id: string) => string | undefined,
): FrameAction {
    if (!e || typeof e !== 'object') return none;
    const hidden = hiddenSeat !== undefined && 'p' in e && e.p === hiddenSeat;
    const nm = (id: string) => storyName(id, n);
    const list = (ids: unknown) => asIdList(ids).map(nm).join(', ');
    const unit = (id: string): string[] => (isBase(id) ? [] : [id]);
    // The printed front, whichever side is up (a sided resolver knows; any other is its own name).
    const front = (id: string) => storyName(id, { nameOf: n.frontNameOf ?? n.nameOf });
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
        case 'DEPLOY_LEADER': {
            // A leader whose Leader Unit side is another card says which (§16): "deploys Grand
            // Moff Tarkin, Tyrant of the Outer Rim as The Death Star, Icon of Tyranny".
            const back = n.backNameOf?.(e.card);
            return {
                label: `${who(e.p)} deploys ${front(e.card)}${back ? ` as ${storyName(e.card, { nameOf: () => back })}` : ''}${e.target ? ` as a pilot on ${nm(e.target)}` : ''}`,
                highlight: e.target ? [e.card, e.target] : [e.card],
                kind: 'deploy',
            };
        }
        case 'ABILITY_ACTIVATE': {
            // An action or Epic Action is the player's own action, and the story names them that
            // way ("Player 1 uses Director Krennic", "... 's Epic Action"). Every other kind is
            // something the game did, so the card is the subject: "Ant Droid uses an ability".
            // A granted ability names its grantor: the base has no such text of its own.
            // One another card's ability made the player use names that card too (§16, "used by").
            const granted = (typeof e.grantedBy === 'string' ? ` (granted by ${nm(e.grantedBy)})` : '') +
                (typeof e.usedBy === 'string' ? ` (used by ${nm(e.usedBy)})` : '');
            return isPlayerAction(e)
                ? { label: `${who(e.p)} uses ${nm(e.card)}${e.kind === 'epic' || e.epic ? '\'s Epic Action' : ''}${granted}`, highlight: unit(e.card), kind: 'ability' }
                : { label: `${nm(e.card)} uses an ability${granted}`, highlight: unit(e.card), kind: 'ability' };
        }
        case 'UNDO':
            // The retracted records are already gone from the stream: this marks WHERE.
            // `by` is optional: render() names no one as "A player", and so does the caption.
            return { label: `${e.by ? who(e.by) : 'A player'} takes back a move`, highlight: [], kind: 'other' };
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
            return { label: `${who(e.p)} draws ${e.count}${!hidden && asIdList(e.cards).length ? `: ${list(e.cards)}` : ''}`, highlight: [], kind: 'draw' };
        case 'DISCARD':
            return { label: `${who(e.p)} discards ${list(e.cards)}`, highlight: [], kind: 'discard' };
        case 'RESOURCE':
            return { label: `${who(e.p)} resources ${hidden ? 'a card' : nm(e.card)}`, highlight: [], kind: 'resource' };
        case 'MOVE':
            // A file without RESOURCE records (an early writer's); the MOVE into the row is the
            // only place the commitment shows. Every other MOVE is mechanism.
            if (e.to === 'resource' && e.from === 'hand') {
                return { label: `${who(e.p)} resources ${hidden ? 'a card' : nm(e.card)}`, highlight: [], kind: 'resource' };
            }
            return none;
        case 'REVEAL':
            return { label: `${who(e.p)} reveals ${list(e.cards)}`, highlight: [], kind: 'other' };
        // A look names whose zone it was and, in an omniscient file, the cards seen (§16).
        case 'LOOK': {
            // Listed with ` · `, as the story lists cards (render.ts `list`).
            const seen = asIdList(e.cards).length ? `: ${asIdList(e.cards).map(nm).join(' · ')}` : '';
            return { label: `${who(e.p)} looks at ${e.count} ${e.count === 1 ? 'card' : 'cards'} of ${who(e.owner)}'s ${e.zone}${seen}`, highlight: [], kind: 'other' };
        }
        // The named card is the file's text, cut like a card name.
        case 'NAME':
            return { label: `${who(e.p)} names ${shorten(String(e.name))}`, highlight: [], kind: 'other' };
        case 'EFFECT_START':
            return { label: effectStartLine(e, nm), highlight: asIdList(e.targets).filter((id) => !isBase(id)), kind: 'ability' };
        case 'EFFECT_END':
            return { label: effectEndLine(e, nm, effectSourceOf), highlight: [], kind: 'other' };
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
        case 'LEADER_FLIP': {
            // Named by the face it left (with its copy suffix, as nm() prints it), then the face it
            // landed on (bare), exactly as render() words it.
            const back = n.backNameOf?.(e.card);
            const frontName = (n.frontNameOf ?? n.nameOf)(e.card);
            const sides = back
                ? { left: e.onStartingSide ? storyName(e.card, { nameOf: () => back }) : front(e.card), landed: ` to ${e.onStartingSide ? frontName : back}` }
                : { left: nm(e.card), landed: '' };
            return { label: `${who(e.p)} flips ${sides.left}${sides.landed}`, highlight: [e.card], kind: 'other' };
        }
        case 'PASS':
            return { label: `${who(e.p)} passes`, highlight: [], kind: 'other' };
        case 'GAME_END':
            return {
                // `winner` is 1, 2 or "Draw" (§10.2). render() prints `Player N wins` for any other
                // value; a caption names no winner the file does not (File Health reports it).
                label: e.winner === 'Draw' ? `Game ends in a draw — ${e.reason}`
                    : e.winner === 1 || e.winner === 2 ? `${who(e.winner)} wins — ${e.reason}` : `Game ends — ${e.reason}`,
                highlight: [], kind: 'other',
            };
        // Mechanism, not story (spec §16): the board shows what these did.
        case 'EXHAUST': case 'READY': case 'EXHAUST_RESOURCES': case 'READY_RESOURCES': case 'STATS':
        case 'CHOICE': case 'MODAL_CHOICE': case 'SHUFFLE': case 'PHASE_START': case 'PHASE_END':
        case 'ROUND_START': case 'ROUND_END':
        // A limited ability's uses reset when its card changes zone: the board's state, not story.
        case 'ABILITY_RESET':
            return none;
        default:
            return none;
    }
}
