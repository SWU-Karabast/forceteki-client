import type { CardInstanceState, ReducedState, Seat } from '@/lib/swupgn';

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

// ReducedState and Seat are imported for use in Tasks 6-7 which extend this file.
// They are referenced here to satisfy type-only usage until then.
export type { ReducedState, Seat };
