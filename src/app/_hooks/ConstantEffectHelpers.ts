import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { keyframes } from '@mui/system';
import { IConstantEffect } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

const pulse = (color: string) => keyframes`
  0%   { box-shadow: 0 0 0 2px ${color}, 0 0 8px  ${color}; }
  50%  { box-shadow: 0 0 0 3px ${color}, 0 0 22px ${color}; }
  100% { box-shadow: 0 0 0 2px ${color}, 0 0 8px  ${color}; }
`;

const bluePulse = pulse('var(--initiative-blue)');
const redPulse = pulse('var(--initiative-red)');

const highlightSx = (animationName: typeof bluePulse): SystemStyleObject<Theme> => ({
    animation: `${animationName} 1.4s ease-in-out infinite`,
    position: 'relative',
    zIndex: 3,
});

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
): SystemStyleObject<Theme> => {
    const role = getCardHighlightRole(cardUuid, highlightedEffect);
    if (!role) return {};
    return highlightSx(role === 'source' ? bluePulse : redPulse);
};

/** True if the highlighted effect's source lives in this player's discard. */
export const isDiscardPileHighlightedByEffect = (
    highlightedEffect: IConstantEffect | null,
    trayPlayer: string,
): boolean => {
    if (!highlightedEffect) return false;
    if (highlightedEffect.cardData.sourceZone !== 'discard') return false;
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
    return { ...highlightSx(bluePulse), borderRadius: '6px' };
};