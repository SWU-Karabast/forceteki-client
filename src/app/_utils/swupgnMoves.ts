import type { GameEvent, NameResolver, Seat } from '@/lib/swupgn';
import { frameAction } from './replayAction';

export interface ReplayMove {
    seq: string;
    t: GameEvent['t'];
    player: string;
    label: string;
}

const MOVE_TYPES = new Set<GameEvent['t']>([
    'PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER',
    'ATTACK', 'PASS', 'CLAIM_INITIATIVE', 'DEFEAT', 'GAME_END',
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
        if (!MOVE_TYPES.has(e.t)) continue;
        moves.push({ seq: e.seq, t: e.t, player: who(actorSeat(e)), label: frameAction(e, n).label });
    }
    return moves;
}
