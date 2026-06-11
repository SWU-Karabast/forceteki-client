'use client';
import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import type { Theme } from '@mui/material';
import type { SystemStyleObject } from '@mui/system';
import { keyframes } from '@mui/system';
import { IConstantEffect } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

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

interface IConstantEffectHighlightContext {
    highlightedEffects: IConstantEffect[];
    setHighlightedEffects: (effects: IConstantEffect[]) => void;   // pass [] to clear
    highlightRoles: ReadonlyMap<string, EffectHighlightRole>;
}

const Ctx = createContext<IConstantEffectHighlightContext | undefined>(undefined);

export const ConstantEffectHighlightProvider = ({ children }: { children: ReactNode }) => {
    const [highlightedEffects, setHighlightedEffects] = useState<IConstantEffect[]>([]);

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
        <Ctx.Provider value={{ highlightedEffects, setHighlightedEffects, highlightRoles }}>
            {children}
        </Ctx.Provider>
    );
};

export const useConstantEffectHighlight = () => {
    const ctx = useContext(Ctx);
    if (!ctx) throw new Error('useConstantEffectHighlight must be used within ConstantEffectHighlightProvider');
    return ctx;
};

export const useEffectHighlightSx = (cardUuid?: string): SystemStyleObject<Theme> => {
    const { highlightRoles } = useConstantEffectHighlight();
    const role = cardUuid ? highlightRoles.get(cardUuid) : undefined;
    return role ? roleSx[role] : EMPTY_SX;
};

export const useDiscardPileHighlightSx = (trayPlayer: string): SystemStyleObject<Theme> => {
    const { highlightedEffects } = useConstantEffectHighlight();
    const active = highlightedEffects.some(
        (e) => e.source.sourceZone === 'discard' && e.source.controllerId === trayPlayer,
    );
    return active ? roleSx.source : EMPTY_SX;
};