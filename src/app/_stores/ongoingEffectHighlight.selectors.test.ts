import { beforeEach, describe, expect, it } from 'vitest'
import type { OngoingEffectHighlightState } from './ongoingEffectHighlight.store'
import { selectHighlightRole, selectActive } from './ongoingEffectHighlight.selectors';
import { IOngoingEffectSummary } from '../_components/_sharedcomponents/Cards/CardTypes';

describe('ongoingEffectHighlight Selectors', () => {
    let state: OngoingEffectHighlightState;

    beforeEach(() => {
        state = {
            highlightedEffects: [],
            setHighlightedEffects: () => {},
            clearHighlightedEffects: () => {},
        } 
    });

    describe('selectHighlightRole', () => {
        it('should return undefined for no cardUuid', () => {
            const result = selectHighlightRole(state, undefined)
            expect(result).toBe(undefined)
        });

        it('should return "target" for card mapped to effect.targets', () => {
            const targetEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: '',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: ['uuid_001']
            }
            state.highlightedEffects.push(targetEffect)
            const result = selectHighlightRole(state, 'uuid_001')
            expect(result).toBe('target')
        });

        it('should return "source" for card mapped to effect.source', () => {
            const sourceEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: '',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                },
                sourceCardUuid: 'uuid_001',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(sourceEffect)
            const result = selectHighlightRole(state, 'uuid_001')
            expect(result).toBe('source')
        });

        it('should return "source" for card mapped to both', () => {
            const targetEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: '',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: ['uuid_001']
            }
            state.highlightedEffects.push(targetEffect)
            const sourceEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: '',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                },
                sourceCardUuid: 'uuid_001',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(sourceEffect)
            const result = selectHighlightRole(state, 'uuid_001')
            expect(result).toBe('source')
        });

        it('should return undefined for card not mapped either', () => {
            const unknownEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: '',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(unknownEffect)
            const result = selectHighlightRole(state, 'uuid_001')
            expect(result).toBe(undefined)
        });
    });

    describe('selectActive', () => {
        it('should return false for no matching effects with player', () => {
            const otherPlayerDiscardEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: 'player_2',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                    sourceZone: 'discard'
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(otherPlayerDiscardEffect)
            const otherZoneEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: 'player_1',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                    sourceZone: 'board'
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(otherZoneEffect)
            const result = selectActive(state, 'player_1')
            expect(result).toBe(false)
        });

        it('should return true for matching effect with player', () => {
            const playerDiscardEffect: IOngoingEffectSummary = {
                source: {
                    controllerId: 'player_1',
                    setId: {
                        number: 1,
                        set: 'SOR'
                    },
                    sourceTitle: '',
                    sourceZone: 'discard'
                },
                sourceCardUuid: '',
                hiddenFromOpponent: false,
                targets: []
            }
            state.highlightedEffects.push(playerDiscardEffect)
            const result = selectActive(state, 'player_1')
            expect(result).toBe(true)
        });
    });
});
