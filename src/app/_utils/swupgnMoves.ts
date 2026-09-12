import type { GameEvent, NameResolver, Seat } from '@/lib/swupgn';
import { frameAction, isPlayerAction } from './replayAction';

export interface ReplayMove {
    seq: string;
    t: GameEvent['t'];
    player: string;
    label: string;
}

/**
 * The eight event types §16 NUMBERS in the story — the things a player chose to do. One copy,
 * because two drifted lists of the same spec list is how the story-tab numbering broke before.
 * `storySeek` uses it for click-to-seek, `replayLiveCues` for what counts as a playback beat.
 */
export const NUMBERED_ACTIONS = new Set<GameEvent['t']>([
    'PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER', 'ATTACK', 'PASS',
    'CLAIM_INITIATIVE',
]);

// ABILITY_ACTIVATE is the ninth, but only when the player spent their action on it: a
// triggered, keyword or replacement ability is filed as a consequence, not numbered. The type
// alone cannot say, so this asks the record. Use it alongside NUMBERED_ACTIONS, never in it.
export const isNumberedAction = (e: GameEvent): boolean => NUMBERED_ACTIONS.has(e.t) || isPlayerAction(e);

// Rows the move list offers as click-to-seek targets. Wider than §16's numbered set: a
// DEFEAT and the GAME_END are worth seeking to even though the story indents them, and so
// is a leader flipping, which is the only record that says a double-sided leader changed.
const MOVE_TYPES = new Set<GameEvent['t']>([
    'PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER', 'LEADER_FLIP',
    'ATTACK', 'PASS', 'CLAIM_INITIATIVE', 'DEFEAT', 'GAME_END', 'UNDO',
]);

function who(p: Seat | undefined): string {
    return p === 1 ? 'Player 1' : p === 2 ? 'Player 2' : '';
}

function actorSeat(e: GameEvent): Seat | undefined {
    return 'p' in e ? (e.p as Seat | undefined) : undefined;
}

export function buildMoveList(events: GameEvent[], n: NameResolver): ReplayMove[] {
    const moves: ReplayMove[] = [];
    for (const e of events) {
        if (!MOVE_TYPES.has(e.t) && !isPlayerAction(e)) continue;
        moves.push({ seq: e.seq, t: e.t, player: who(actorSeat(e)), label: frameAction(e, n).label });
    }
    return moves;
}
