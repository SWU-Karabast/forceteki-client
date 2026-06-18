import { baseId, type GameEvent, type NameResolver, type Seat } from '@/lib/swupgn';

// What happened on the current frame, for the animated caption + board highlight. Unlike
// the move list (buildMoveList), this covers EVERY frame's event — including ability
// activations (so leader actions are surfaced), resourcing, draws, and discards.
export interface FrameAction {
    label: string;
    // In-play card ids to glow this frame (the cards that just acted). Cards that move to a
    // face-down pile (resourced/discarded) aren't individually highlightable — caption only.
    highlight: string[];
    // Coarse kind, for styling/telemetry if needed.
    kind: 'play' | 'deploy' | 'ability' | 'attack' | 'defeat' | 'resource' | 'discard' | 'draw' | 'other' | 'none';
}

const who = (p?: Seat): string => (p === 1 ? 'Player 1' : p === 2 ? 'Player 2' : '');
const plural = (n: number) => (n === 1 ? '' : 's');

export function frameAction(e: GameEvent | undefined, n: NameResolver): FrameAction {
    const nm = (id: string) => n.nameOf(baseId(id));
    if (!e) return { label: '', highlight: [], kind: 'none' };
    switch (e.t) {
        case 'PLAY':
        case 'PLAY_SMUGGLE':
            return { label: `${who(e.p)} plays ${nm(e.card)}`, highlight: [e.card], kind: 'play' };
        case 'PLAY_UPGRADE':
            return {
                label: `${who(e.p)} plays ${nm(e.card)}${e.target ? ` on ${nm(e.target)}` : ''}`,
                highlight: e.target ? [e.card, e.target] : [e.card],
                kind: 'play',
            };
        case 'PLAY_EVENT':
            return { label: `${who(e.p)} plays ${nm(e.card)}`, highlight: [], kind: 'play' };
        case 'DEPLOY_LEADER':
            return { label: `${who(e.p)} deploys ${nm(e.card)}`, highlight: [e.card], kind: 'deploy' };
        case 'ABILITY_ACTIVATE':
            return { label: `${who(e.p)} uses ${nm(e.card)}'s ability`, highlight: [e.card], kind: 'ability' };
        case 'ATTACK':
            return {
                label: `${who(e.p)} attacks ${e.defenderType === 'base' ? 'base' : nm(e.def)} with ${nm(e.atk)}`,
                highlight: e.defenderType === 'base' ? [e.atk] : [e.atk, e.def],
                kind: 'attack',
            };
        case 'DEFEAT':
            return { label: `${nm(e.card)} is defeated`, highlight: [], kind: 'defeat' };
        case 'RESOURCE':
            return { label: `${who(e.p)} resources ${nm(e.card)}`, highlight: [], kind: 'resource' };
        case 'MOVE':
            if (e.to === 'resource' && e.from === 'hand') {
                return { label: `${who(e.p)} resources ${nm(e.card)}`, highlight: [], kind: 'resource' };
            }
            return { label: '', highlight: [], kind: 'none' };
        case 'DISCARD':
            return { label: `${who(e.p)} discards ${e.cards.length} card${plural(e.cards.length)}`, highlight: [], kind: 'discard' };
        case 'DRAW':
            return { label: `${who(e.p)} draws ${e.count} card${plural(e.count)}`, highlight: [], kind: 'draw' };
        case 'CLAIM_INITIATIVE':
            return { label: `${who(e.p)} claims initiative`, highlight: [], kind: 'other' };
        case 'PASS':
            return { label: `${who(e.p)} passes`, highlight: [], kind: 'other' };
        case 'GAME_END':
            return {
                label: e.winner === 'Draw' ? `Draw (${e.reason})` : `${who(e.winner as Seat)} wins (${e.reason})`,
                highlight: [], kind: 'other',
            };
        default:
            return { label: '', highlight: [], kind: 'none' };
    }
}
