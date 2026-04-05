'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, ReactNode } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';
import { IBoardState } from '@/app/_hooks/useBoardState';
import { ParsedReplay, ReplayEvent, ReplaySnapshot } from '@/app/_utils/replayParser';

// Re-export for convenience
export type { ParsedReplay, ReplayEvent, ReplaySnapshot };

export interface IReplayContextType extends IBoardState {
    snapshots: ReplaySnapshot[];
    events: ReplayEvent[];
    currentIndex: number;
    totalSnapshots: number;
    header: Record<string, string>;

    play: () => void;
    pause: () => void;
    isPlaying: boolean;
    speed: number;
    setSpeed: (s: number) => void;
    stepForward: () => void;
    stepBack: () => void;
    seekTo: (index: number) => void;

    togglePerspective: () => void;
    currentPerspective: string;
}

export const ReplayContext = createContext<IReplayContextType | null>(null);

export function useReplay(): IReplayContextType {
    const context = useContext(ReplayContext);
    if (!context) {
        throw new Error('useReplay must be used within a ReplayProvider');
    }
    return context;
}

const SPEED_INTERVALS: Record<number, number> = {
    0.5: 4000,
    1: 2000,
    2: 1000,
    4: 500,
};

interface ReplayProviderProps {
    replay: ParsedReplay;
    children: ReactNode;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({ replay, children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [perspective, setPerspective] = useState('Player 1');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const { snapshots, events, header } = replay;
    const totalSnapshots = snapshots.length;

    const getSnapshot = useCallback((index: number): any => {
        const snap = snapshots[index];
        if (!snap) return null;
        if (snap.snapshot) return snap.snapshot;
        if (snap.rawJson) {
            const parsed = JSON.parse(snap.rawJson);
            snap.snapshot = parsed.snapshot ?? parsed;
            delete snap.rawJson;
            return snap.snapshot;
        }
        return null;
    }, [snapshots]);

    const gameState = getSnapshot(currentIndex);

    const getOpponent = useCallback((player: string): string => {
        if (!gameState?.players) return '';
        const playerIds = Object.keys(gameState.players);
        return playerIds.find((id) => id !== player) || '';
    }, [gameState]);

    const gameMessages: IChatEntry[] = React.useMemo(() => {
        if (currentIndex === 0 || events.length === 0) return [];

        const prevSeq = snapshots[currentIndex - 1]?.seq ?? '';
        const currSeq = snapshots[currentIndex]?.seq ?? '';

        const relevantEvents = events.filter((e) => e.seq > prevSeq && e.seq <= currSeq);

        return relevantEvents.map((e) => ({
            date: new Date().toISOString(),
            message: [`${e.type}: ${e.player ?? ''} ${e.card ?? ''} ${e.target ?? ''}`.trim()],
        }));
    }, [currentIndex, events, snapshots]);

    const togglePerspective = useCallback(() => {
        setPerspective((prev) => (prev === 'Player 1' ? 'Player 2' : 'Player 1'));
    }, []);

    const stepForward = useCallback(() => {
        setCurrentIndex((prev) => Math.min(prev + 1, totalSnapshots - 1));
    }, [totalSnapshots]);

    const stepBack = useCallback(() => {
        setCurrentIndex((prev) => Math.max(prev - 1, 0));
    }, []);

    const seekTo = useCallback((index: number) => {
        setCurrentIndex(Math.max(0, Math.min(index, totalSnapshots - 1)));
    }, [totalSnapshots]);

    const play = useCallback(() => {
        setIsPlaying(true);
    }, []);

    const pause = useCallback(() => {
        setIsPlaying(false);
    }, []);

    useEffect(() => {
        if (isPlaying) {
            intervalRef.current = setInterval(() => {
                setCurrentIndex((prev) => {
                    if (prev >= totalSnapshots - 1) {
                        setIsPlaying(false);
                        return prev;
                    }
                    return prev + 1;
                });
            }, SPEED_INTERVALS[speed] ?? 2000);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [isPlaying, speed, totalSnapshots]);

    const value: IReplayContextType = {
        gameState,
        connectedPlayer: perspective,
        getOpponent,
        isSpectator: true,
        gameMessages,

        snapshots,
        events,
        currentIndex,
        totalSnapshots,
        header,

        play,
        pause,
        isPlaying,
        speed,
        setSpeed,
        stepForward,
        stepBack,
        seekTo,

        togglePerspective,
        currentPerspective: perspective,
    };

    return (
        <ReplayContext.Provider value={value}>
            {children}
        </ReplayContext.Provider>
    );
};
