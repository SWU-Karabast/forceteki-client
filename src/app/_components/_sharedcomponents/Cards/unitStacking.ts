import { CardStyle, ICardData, IOngoingEffectSummary } from './CardTypes';
import { cannotBeAttacked, hasSentinel, isBlanked, isStolen } from './cardUtils';

/**
 * A key that identifies the effects on a card, ignoring any effects that originate from the card itself or its subcards.
 */
const effectKey = (card: ICardData, effects: IOngoingEffectSummary[]) => {
    const ownUuids = new Set([card.uuid, ...(card.subcards ?? []).map((s) => s.uuid)]);
    return effects
        .filter((e) => e.targets.includes(card.uuid) && !ownUuids.has(e.sourceCardUuid))
        .map((e) => `${e.sourceCardUuid}:${e.source.effectDescription ?? ''}`)
        .sort();
};

/**
 * Everything a player can see or act on. Token units with the same key are interchangeable,
 * so they share a stack, any difference (damage, buffs, effects, selection, upgrades...) splits them.
 */
const stackKey = (card: ICardData, effects: IOngoingEffectSummary[]) => JSON.stringify([
    effectKey(card, effects),
    card.setId, card.exhausted, card.damage, card.power, card.hp,
    card.selectable, card.selected, card.isAttacker, card.isDefender,
    hasSentinel(card, CardStyle.InPlay), cannotBeAttacked(card, CardStyle.InPlay),
    isBlanked(card, CardStyle.InPlay), isStolen(card, CardStyle.InPlay),
    (card.subcards ?? []).map((s) => JSON.stringify([s.setId, s.selectable, s.selected])).sort(),
]);

/** Only plain token units stack. Clones and units holding captured cards always stand alone. */
const isStackable = (card: ICardData) =>
    card.printedType === 'tokenUnit' && !card.clonedCardId && !card.capturedCards?.length;

/**
 * Groups identical token units a group sits where its first card was. Everything else is a group of one.
 * During a distribution prompt the amount assigned to a token.
 */
export const groupUnits = (
    cards: ICardData[],
    effects: IOngoingEffectSummary[],
    assigned: ReadonlyMap<string, number> = new Map(),
): ICardData[][] => {
    const groups = new Map<string, ICardData[]>();
    for (const card of cards) {
        const key = isStackable(card) ? `${stackKey(card, effects)}|${assigned.get(card.uuid) ?? 0}` : card.uuid;
        groups.set(key, [...(groups.get(key) ?? []), card]);
    }
    return [...groups.values()];
};