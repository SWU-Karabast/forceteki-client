import { useOngoingEffectHighlightStore } from '../_stores/ongoingEffectHighlight.store';
import { selectHighlightRole, selectActive } from '../_stores/ongoingEffectHighlight.selectors';
import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { keyframes } from '@mui/system';

type EffectHighlightRole = 'source' | 'target';

const pulse = (color: string) => keyframes`
    0%   { box-shadow: 0 0 0 2px ${color}, 0 0 8px  ${color}; }
    50%  { box-shadow: 0 0 0 3px ${color}, 0 0 22px ${color}; }
    100% { box-shadow: 0 0 0 2px ${color}, 0 0 8px  ${color}; }
`;
const bluePulse = pulse('var(--initiative-blue)');
const redPulse = pulse('var(--initiative-red)');
const roleSx: Record<EffectHighlightRole, SystemStyleObject<Theme>> = {
    source: { animation: `${bluePulse} 1.4s ease-in-out infinite`, position: 'relative', zIndex: 3 },
    target: { animation: `${redPulse} 1.4s ease-in-out infinite`, position: 'relative', zIndex: 3 },
};

const EMPTY_SX: SystemStyleObject<Theme> = {};

export const useHighlightRole = (cardUuid?: string) => {
    return useOngoingEffectHighlightStore((state) => selectHighlightRole(state, cardUuid))
};

export const useOngoingEffectHighlightSx = (cardUuid?: string): SystemStyleObject<Theme> => {
    const role = useHighlightRole(cardUuid)
    return role ? roleSx[role] : EMPTY_SX;
};

export const useDiscardPileHighlightSx = (trayPlayer: string) => {
    const active = useOngoingEffectHighlightStore((state) => selectActive(state, trayPlayer))
    return active ? roleSx.source : EMPTY_SX;
};