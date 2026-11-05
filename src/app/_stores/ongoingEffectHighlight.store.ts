import { create } from 'zustand'
import { IOngoingEffectSummary } from '../_components/_sharedcomponents/Cards/CardTypes'

export interface OngoingEffectHighlightState {
    highlightedEffects: IOngoingEffectSummary[];
    setHighlightedEffects: (effects: IOngoingEffectSummary[]) => void;
    clearHighlightedEffects: () => void;
}

export const useOngoingEffectHighlightStore =
    create<OngoingEffectHighlightState>((set) => ({
        highlightedEffects: [],
        setHighlightedEffects: (highlightedEffects) => set({ highlightedEffects }),
        clearHighlightedEffects: () => set({ highlightedEffects: [] }),
    }));