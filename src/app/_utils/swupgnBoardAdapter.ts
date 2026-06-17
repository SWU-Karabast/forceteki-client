import type { CardInstanceState, ReducedState, Seat, SwuPgnDocument, PlayerState, SetupInitRecord } from '@/lib/swupgn';

/** Minimal card shape the board reads. Replay is read-only, so selection/prompt
 *  fields are defaulted to inert values. Kept loose to match the codebase's
 *  existing gameState typing (IBoardState.gameState: any). */
export interface AdaptedCard {
    uuid: string;
    setId: { set: string; number: number };
    name?: string;
    zone: string;
    controllerId: string;
    ownerId: string;
    type: string;
    damage: number;
    exhausted: boolean;
    selected: boolean;
    selectable: boolean;
    upgrades?: string[];
    shields?: number;
    experience?: number;
    statusTokens?: Record<string, number>;
    subcards?: AdaptedCard[];
}

/** ReducedState arena zones → board cardPiles zone names. */
export const ZONE_MAP: Record<string, string> = {
    ground: 'groundArena',
    space: 'spaceArena',
};

/** Parse "SET#NUM[:copy]" into a board setId. */
export function parseSetId(id: string): { set: string; number: number } {
    const base = id.replace(/:\d+$/, '');
    const [set, num] = base.split('#');
    return { set, number: Number(num) };
}

/** Build a board card from a bare id (hand/discard piles carry only ids). */
export function cardFromId(
    id: string, zone: string, controllerId: string, ownerId: string,
): AdaptedCard {
    return {
        uuid: id,
        setId: parseSetId(id),
        zone,
        controllerId,
        ownerId,
        type: 'unit',
        damage: 0,
        exhausted: false,
        selected: false,
        selectable: false,
    };
}

/** Build a board card from a folded in-play instance. */
export function cardFromInstance(inst: CardInstanceState, ownerId: string): AdaptedCard {
    return {
        ...cardFromId(inst.id, ZONE_MAP[inst.zone] ?? inst.zone, ownerId, ownerId),
        damage: inst.damage,
        exhausted: inst.exhausted,
        upgrades: inst.upgrades,
        shields: inst.shields,
        experience: inst.experience,
        statusTokens: inst.statusTokens,
    };
}

export type { ReducedState, Seat };

export type SeatToPlayerId = Record<Seat, string>;

/** Pull each seat's starting deck-order length from the INIT setup record. */
export function deckOrderLengths(doc: SwuPgnDocument): Record<Seat, number> {
    const init = doc.setup.find((r): r is SetupInitRecord => (r as SetupInitRecord).t === 'INIT');
    return {
        1: init?.p1DeckOrder.length ?? 0,
        2: init?.p2DeckOrder.length ?? 0,
    };
}

function facedownStack(count: number, zone: string, owner: string): AdaptedCard[] {
    // Resource/credit identities aren't in ReducedState; render N inert placeholders.
    return Array.from({ length: Math.max(0, count) }, (_, i) => ({
        uuid: `${owner}:${zone}:${i}`,
        setId: { set: '', number: 0 },
        zone, controllerId: owner, ownerId: owner, type: 'token',
        damage: 0, exhausted: false,
        selected: false, selectable: false,
    }));
}

function adaptPlayer(
    ps: PlayerState, playerId: string, deckOrderLen: number,
    leaderId: string, baseId: string,
): any {
    const inPlay = ps.cards.map((c) => cardFromInstance(c, playerId));
    const ground = inPlay.filter((c) => c.zone === 'groundArena');
    const space = inPlay.filter((c) => c.zone === 'spaceArena');
    const hand = ps.hand.map((id) => cardFromId(id, 'hand', playerId, playerId));
    const discard = ps.discard.map((id) => cardFromId(id, 'discard', playerId, playerId));
    const resourcesTotal = ps.resourcesReady + ps.resourcesExhausted;
    const numCardsInDeck = Math.max(
        0,
        deckOrderLen - hand.length - resourcesTotal - discard.length - inPlay.length,
    );
    const leader = cardFromId(leaderId, 'leader', playerId, playerId);
    leader.type = 'leader';
    const base = cardFromId(baseId, 'base', playerId, playerId);
    base.type = 'base';
    return {
        user: { username: playerId },
        leader,
        base,
        hasInitiative: false, // set by adaptState from ReducedState.initiative
        isActionPhaseActivePlayer: false,
        // The live board reads `promptState.<field>` WITHOUT null-guarding promptState
        // (e.g. LeaderBaseCard/GameCard read promptState.distributeAmongTargets). Replay
        // has no prompts, but the object must exist so those reads return undefined
        // instead of throwing.
        promptState: {},
        availableResources: ps.resourcesReady,
        numCardsInDeck,
        forceToken: { active: ps.hasForce, uuid: `${playerId}:force` },
        cardPiles: {
            hand,
            discard,
            groundArena: ground,
            spaceArena: space,
            resources: facedownStack(resourcesTotal, 'resources', playerId),
            credits: facedownStack(ps.credits, 'credits', playerId),
            capturedZone: [] as AdaptedCard[],
        },
    };
}

/** Map a folded ReducedState + document context into the board's gameState shape. */
export function adaptState(
    s: ReducedState, doc: SwuPgnDocument,
    decks: Record<Seat, number>, seatToId: SeatToPlayerId,
): any {
    const players: Record<string, any> = {};
    for (const seat of [1, 2] as Seat[]) {
        const ps = s.players[seat];
        const playerId = seatToId[seat];
        if (!ps) { continue; }
        const leaderId = seat === 1 ? doc.header.p1Leader : doc.header.p2Leader;
        const baseSetId = seat === 1 ? doc.header.p1Base : doc.header.p2Base;
        const adapted = adaptPlayer(ps, playerId, decks[seat], leaderId, baseSetId);
        adapted.hasInitiative = s.initiative === seat;
        players[playerId] = adapted;
    }
    return {
        players,
        phase: s.phase,
        initiativeClaimed: s.initiative != null,
        clientUIProperties: {},
        winners: [],
    };
}
