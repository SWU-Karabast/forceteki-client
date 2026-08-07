'use client';
import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { keyframes } from '@mui/system';
import { IOngoingEffectSummary } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

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

interface IOngoingEffectHighlightContext {
    highlightedEffects: IOngoingEffectSummary[];
    setHighlightedEffects: (effects: IOngoingEffectSummary[]) => void;   // pass [] to clear
    highlightRoles: ReadonlyMap<string, EffectHighlightRole>;
}

const ongoingEffectsContext = createContext<IOngoingEffectHighlightContext | undefined>(undefined);

export const OngoingEffectHighlightProvider = ({ children }: { children: ReactNode }) => {
    const [highlightedEffects, setHighlightedEffects] = useState<IOngoingEffectSummary[]>([]);

    const highlightRoles = useMemo(() => {
        const map = new Map<string, EffectHighlightRole>();
        for (const effect of highlightedEffects) {
            for (const uuid of effect.targets) map.set(uuid, 'target');
        }
        // sources second, so a card that's both source and target pulses as source
        for (const effect of highlightedEffects) {
            map.set(effect.sourceCardUuid, 'source');
        }
        return map;
    }, [highlightedEffects]);

    return (
        <ongoingEffectsContext.Provider value={{ highlightedEffects, setHighlightedEffects, highlightRoles }}>
            {children}
        </ongoingEffectsContext.Provider>
    );
};

export const useOngoingEffectHighlight = () => {
    const context = useContext(ongoingEffectsContext);
    if (!context) throw new Error('useOngoingEffectHighlight must be used within an OngoingEffectHighlightProvider');
    return context;
};

export const useOngoingEffectHighlightSx = (cardUuid?: string): SystemStyleObject<Theme> => {
    const { highlightRoles } = useOngoingEffectHighlight();
    const role = cardUuid ? highlightRoles.get(cardUuid) : undefined;
    return role ? roleSx[role] : EMPTY_SX;
};

export const useDiscardPileHighlightSx = (trayPlayer: string): SystemStyleObject<Theme> => {
    const { highlightedEffects } = useOngoingEffectHighlight();
    const active = highlightedEffects.some(
        (highlightedEffect) => highlightedEffect.source.sourceZone === 'discard' && highlightedEffect.source.controllerId === trayPlayer,
    );
    return active ? roleSx.source : EMPTY_SX;
};