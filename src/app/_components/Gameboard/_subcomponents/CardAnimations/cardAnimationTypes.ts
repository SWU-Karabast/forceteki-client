/**
 * Animation records as the server sends them in each gamestate's `newAnimations`. They mirror
 * `server/game/core/animation/AnimationTypes.ts` in forceteki. A record says what happened, never
 * how to draw it; choosing the effect, its timing and its layout is left to the client.
 *
 * Records in the same `batch` happened simultaneously under the rules. Batch ids only increase,
 * so a later batch (a defeat) can be paced after an earlier one (the damage that caused it).
 */
export type AnimationRecordKind = 'damage' | 'defeat';

interface IAnimationRecordBase {
    seq: number;
    batch: number;
    kind: AnimationRecordKind;
}

export interface IDamageAnimationRecord extends IAnimationRecordBase {
    kind: 'damage';

    /** uuid of the damaged card. */
    cardId: string;

    /** uuids of the cards that dealt the damage; empty when the server could not resolve one. */
    sourceCardIds: string[];

    /** Damage that actually landed, after shields and HP caps. Always above zero. */
    amount: number;
}

export interface IDefeatAnimationRecord extends IAnimationRecordBase {
    kind: 'defeat';

    /** uuid of the defeated card: a unit, base, upgrade, token or resource. */
    cardId: string;
}

export type AnimationRecord = IDamageAnimationRecord | IDefeatAnimationRecord;

/**
 * A record as it sits in the client's feed. `key` is assigned on arrival and only ever grows,
 * across games and reconnects alike, so the animation layer can tell which entries it has
 * already played without relying on server seq numbers, which restart with each game.
 */
export interface IAnimationFeedEntry {
    key: number;
    record: AnimationRecord;
}
