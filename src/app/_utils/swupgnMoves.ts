import { baseId, type GameEvent, type NameResolver, type Seat } from '@/lib/swupgn';

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

/** One-line label for a discrete move. */
function label(e: GameEvent, n: NameResolver): string {
    const nm = (id: string) => n.nameOf(baseId(id));
    switch (e.t) {
        case 'PLAY':
        case 'PLAY_UPGRADE':
        case 'PLAY_SMUGGLE':
            return `${who(e.p)} plays ${nm(e.card)}`;
        case 'PLAY_EVENT':
            return `${who(e.p)} plays ${nm(e.card)}`;
        case 'DEPLOY_LEADER':
            return `${who(e.p)} deploys ${nm(e.card)}`;
        case 'ATTACK':
            return `${who(e.p)} attacks ${e.defenderType === 'base' ? 'base' : nm(e.def)} with ${nm(e.atk)}`;
        case 'PASS':
            return `${who(e.p)} passes`;
        case 'CLAIM_INITIATIVE':
            return `${who(e.p)} claims initiative`;
        case 'DEFEAT':
            return `${nm(e.card)} is defeated`;
        case 'GAME_END':
            return e.winner === 'Draw'
                ? `Draw (${e.reason})`
                : `${who(e.winner as Seat)} wins (${e.reason})`;
        default:
            return e.t;
    }
}

function actorSeat(e: GameEvent): Seat | undefined {
    return 'p' in e ? (e.p as Seat | undefined) : undefined;
}

export function buildMoveList(events: GameEvent[], n: NameResolver): ReplayMove[] {
    const moves: ReplayMove[] = [];
    for (const e of events) {
        if (!MOVE_TYPES.has(e.t)) continue;
        moves.push({ seq: e.seq, t: e.t, player: who(actorSeat(e)), label: label(e, n) });
    }
    return moves;
}
