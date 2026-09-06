import type { GameEvent, ReducedState, Seat } from '@/lib/swupgn';
import { isSeat } from '@/lib/swupgn';
import { parseSetId } from './swupgnBoardAdapter';

/**
 * The cues the live board shows around the cards, rebuilt per frame from the file so a replay
 * reads like a game in progress: whose action it is (the blue/red aura under each hand),
 * which unit is attacking what (the attack/defend arrows), what was played last (the card
 * preview in the opponent tray), and how long a frame should hold during playback.
 * Every one is a pure function of the event stream; nothing here assumes a rule.
 */

/** Events a player chose to do (spec §16): a beat of playback, and a change of whose action it is. */
const NUMBERED = new Set<GameEvent['t']>(['PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER', 'ATTACK', 'PASS', 'CLAIM_INITIATIVE']);

/**
 * Whose action it is on each frame of an action phase; `undefined` outside one (the trays
 * colour setup and regroup by phase instead). A record that names a seat (`p`) is that seat
 * acting: the numbered actions, and the records the engine writes around them (a cost paid, a
 * card moved, a choice made). A record that names none (an EXHAUST, a STATS, the damage of an
 * attack) keeps the seat of the record before it. Each action phase opens on the initiative
 * holder, who acts first.
 */
export function activeSeatByFrame(events: GameEvent[], frames: ReducedState[]): Array<Seat | undefined> {
    const out: Array<Seat | undefined> = new Array(events.length);
    let inAction = false;
    let seat: Seat | undefined;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e != null && typeof e === 'object') {
            if (e.t === 'PHASE_START' || e.t === 'ROUND_START') {
                inAction = e.t === 'PHASE_START' && e.phase === 'action';
                seat = inAction ? (frames[i]?.initiative ?? undefined) : undefined;
            } else if (inAction && 'p' in e && isSeat(e.p)) {
                seat = e.p;
            }
        }
        out[i] = inAction ? seat : undefined;
    }
    return out;
}

export interface AttackCue { atk: string; def: string }

/**
 * The attack in progress on each frame: the ATTACK record and every consequence filed under
 * it (`R2.A.1` → `R2.A.1a`, `R2.A.1b`, …, spec §9.1), so the arrows stay up while the
 * damage lands. Consequences of a *later* action are not the attack's.
 */
export function attackByFrame(events: GameEvent[]): Array<AttackCue | undefined> {
    const out: Array<AttackCue | undefined> = new Array(events.length);
    let cur: { cue: AttackCue; re: RegExp } | undefined;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e == null || typeof e !== 'object') { out[i] = undefined; continue; }
        if (e.t === 'ATTACK') {
            cur = { cue: { atk: String(e.atk), def: String(e.def) }, re: new RegExp(`^${String(e.seq).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[a-z]+$`) };
            out[i] = cur.cue;
            continue;
        }
        if (cur && cur.re.test(String(e.seq))) { out[i] = cur.cue; continue; }
        cur = undefined;
        out[i] = undefined;
    }
    return out;
}

/** The last card a player played, as the live board previews it, per frame. */
export function lastPlayedByFrame(events: GameEvent[]): Array<{ set: string; number: number } | undefined> {
    const out: Array<{ set: string; number: number } | undefined> = new Array(events.length);
    let last: { set: string; number: number } | undefined;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e != null && typeof e === 'object' && (e.t === 'PLAY' || e.t === 'PLAY_EVENT' || e.t === 'PLAY_UPGRADE' || e.t === 'PLAY_SMUGGLE') && typeof e.card === 'string' && !e.card.startsWith('TOKEN:')) {
            const id = parseSetId(e.card);
            if (id.set && Number.isFinite(id.number)) last = id;
        }
        out[i] = last;
    }
    return out;
}

/** A consequence holds for a fraction of the beat: an action, then its effects in quick succession. */
const CONSEQUENCE_FRACTION = 0.45;
const MIN_HOLD_MS = 120;

/**
 * How long playback holds a frame. A player's action (and a round or phase banner, and the
 * game's end) holds for the full interval; the records that resolve it — the cost paid, the
 * damage dealt, a unit exhausting — pass at a fraction of it, the way an attack resolves in
 * one motion at the table rather than one beat per bookkeeping line.
 */
export function frameHoldMs(e: GameEvent | undefined, intervalMs: number): number {
    const beat = e != null && typeof e === 'object'
        && (NUMBERED.has(e.t) || e.t === 'ROUND_START' || e.t === 'PHASE_START' || e.t === 'GAME_END');
    return beat ? intervalMs : Math.max(MIN_HOLD_MS, Math.round(intervalMs * CONSEQUENCE_FRACTION));
}
