import type { OngoingEffectHighlightState } from './ongoingEffectHighlight.store';

export const selectHighlightRole = (state: OngoingEffectHighlightState, cardUuid?: string) => {
    if (!cardUuid) return undefined;

    for (const effect of state.highlightedEffects) {
        if (effect.sourceCardUuid === cardUuid) return 'source' as const;
    }

    for (const effect of state.highlightedEffects) {
        if (effect.targets.includes(cardUuid)) return 'target' as const;
    }

    return undefined;
};

export const selectActive = (state: OngoingEffectHighlightState, trayPlayer: string) => {
    return state.highlightedEffects.some(
        (effect) => effect.source.sourceZone === 'discard' &&
        effect.source.controllerId === trayPlayer
    )
};