import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { keyframes } from '@mui/system';
import { IConstantEffect } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

// ─── Pulse keyframes ───────────────────────────────────────────────────────
// Blue = SOURCE (the card emitting the effect)
// Red  = TARGET (the cards being affected)

const BLUE = '#00BAFF';
const RED = '#FF3231';

const bluePulse = keyframes`
  0%   { box-shadow: 0 0 0 2px ${BLUE}, 0 0 8px  ${BLUE}; }
  50%  { box-shadow: 0 0 0 3px ${BLUE}, 0 0 22px ${BLUE}; }
  100% { box-shadow: 0 0 0 2px ${BLUE}, 0 0 8px  ${BLUE}; }
`;

const redPulse = keyframes`
  0%   { box-shadow: 0 0 0 2px ${RED}, 0 0 8px  ${RED}; }
  50%  { box-shadow: 0 0 0 3px ${RED}, 0 0 22px ${RED}; }
  100% { box-shadow: 0 0 0 2px ${RED}, 0 0 8px  ${RED}; }
`;

export type EffectHighlightRole = 'source' | 'target' | null;

export const getCardHighlightRole = (
    cardUuid: string | undefined,
    highlightedEffect: IConstantEffect | null,
): EffectHighlightRole => {
    if (!cardUuid || !highlightedEffect) return null;
    if (highlightedEffect.sourceCardUuid === cardUuid) return 'source';
    if (highlightedEffect.targets.some((t) => t.uuid === cardUuid)) return 'target';
    return null;
};

/** sx fragment for any card — pulses blue if source, red if target, `{}` otherwise. */
export const getEffectHighlightSx = (
    cardUuid: string | undefined,
    highlightedEffect: IConstantEffect | null,
): Record<string, unknown> => {
    const role = getCardHighlightRole(cardUuid, highlightedEffect);
    if (!role) return {};
    const animationName = role === 'source' ? bluePulse : redPulse;
    return {
        animation: `${animationName} 1.4s ease-in-out infinite`,
        position: 'relative',
        zIndex: 3,
    };
};

/** True if the highlighted effect's source lives in this player's discard. */
export const isDiscardPileHighlightedByEffect = (
    highlightedEffect: IConstantEffect | null,
    trayPlayer: string,
): boolean => {
    if (!highlightedEffect) return false;
    if (highlightedEffect.sourceZone !== 'discard') return false;
    return highlightedEffect.cardData.controllerId === trayPlayer;
};

/** sx fragment for the discard pile widget — pulses blue when source is in there. */
export const getDiscardPileHighlightSx = (
    highlightedEffect: IConstantEffect | null,
    trayPlayer: string,
): SystemStyleObject<Theme> => {
    if (!isDiscardPileHighlightedByEffect(highlightedEffect, trayPlayer)) {
        return {};
    }
    return {
        animation: `${bluePulse} 1.4s ease-in-out infinite`,
        position: 'relative',
        zIndex: 3,
        borderRadius: '6px',
    };
};