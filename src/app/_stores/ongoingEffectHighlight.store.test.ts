import { beforeEach, describe, expect, it } from 'vitest'
import { useOngoingEffectHighlightStore } from './ongoingEffectHighlight.store'
import { IOngoingEffectSummary } from '../_components/_sharedcomponents/Cards/CardTypes';

const createOngoingEffect = (
    sourceCardUuid = 'source-1',
    targets: string[] = [],
): IOngoingEffectSummary => ({
    source: {
        controllerId: 'player-1',
        setId: {
            number: 1,
            set: 'SOR',
        },
        sourceTitle: 'Test effect',
        sourceZone: 'discard',
    },
    sourceCardUuid,
    hiddenFromOpponent: false,
    targets,
})

describe('ongoingEffectHighlightStore', () => {
    beforeEach(() => {
        useOngoingEffectHighlightStore.setState({ highlightedEffects: [] });
    });

    it('starts with no highlighted effects', () => {
        expect(useOngoingEffectHighlightStore.getState().highlightedEffects).toEqual([])
    });

    it('stores highlighted effects', () => {
        const effects = [createOngoingEffect('source-1', ['target-1'])]
        useOngoingEffectHighlightStore.getState().setHighlightedEffects(effects)
        expect(useOngoingEffectHighlightStore.getState().highlightedEffects).toEqual(effects)
    });

    it('replaces the existing highlighted effects', () => {
        const firstEffects = [createOngoingEffect('source-1')];
        const secondEffects = [createOngoingEffect('source-2')];

        useOngoingEffectHighlightStore
            .getState()
            .setHighlightedEffects(firstEffects);

        useOngoingEffectHighlightStore
            .getState()
            .setHighlightedEffects(secondEffects);

        expect(
            useOngoingEffectHighlightStore.getState().highlightedEffects,
        ).toEqual(secondEffects);
    });

    it('clears highlighted effects', () => {
        useOngoingEffectHighlightStore
            .getState()
            .setHighlightedEffects([createOngoingEffect()]);

        useOngoingEffectHighlightStore
            .getState()
            .clearHighlightedEffects();

        expect(
            useOngoingEffectHighlightStore.getState().highlightedEffects,
        ).toEqual([]);
    });
});