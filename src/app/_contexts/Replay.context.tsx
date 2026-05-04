'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
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

// Numeric-aware seq comparison. Splits on non-alphanumeric delimiters and compares
// each segment numerically if both are numbers, otherwise lexicographically.
// e.g., "R10.A.2" > "R2.A.9" (because 10 > 2 in the first numeric segment)
function compareSeq(a: string, b: string): number {
    const partsA = a.split(/([.\-])/);
    const partsB = b.split(/([.\-])/);
    const len = Math.max(partsA.length, partsB.length);
    for (let i = 0; i < len; i++) {
        const pa = partsA[i] ?? '';
        const pb = partsB[i] ?? '';
        const na = parseFloat(pa.replace(/^[A-Za-z]+/, ''));
        const nb = parseFloat(pb.replace(/^[A-Za-z]+/, ''));
        if (!isNaN(na) && !isNaN(nb)) {
            if (na !== nb) return na - nb;
            // If numeric parts equal, compare the full segment for letter suffixes (e.g., "1a" vs "1b")
            if (pa !== pb) return pa < pb ? -1 : 1;
        } else {
            if (pa !== pb) return pa < pb ? -1 : 1;
        }
    }
    return 0;
}

interface ReplayProviderProps {
    replay: ParsedReplay;
    children: ReactNode;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({ replay, children }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const snapshotCache = useRef<Map<number, any>>(new Map());

    const { snapshots, events, header } = replay;
    const totalSnapshots = snapshots.length;

    const [perspective, setPerspective] = useState('Player 1');

    // Reset state when a new replay is loaded
    useEffect(() => {
        setCurrentIndex(0);
        setIsPlaying(false);
        setPerspective('Player 1');
        snapshotCache.current.clear();
    }, [replay]);

    const getSnapshot = useCallback((index: number): any => {
        const cached = snapshotCache.current.get(index);
        if (cached) return cached;

        const snap = snapshots[index];
        if (!snap) return null;

        const raw = snap.rawJson ?? snap.snapshot;
        if (!raw) return null;

        try {
            const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
            const resolved = data.snapshot ?? data;
            snapshotCache.current.set(index, resolved);
            return resolved;
        } catch {
            console.error(`Failed to parse snapshot at index ${index}`);
            return null;
        }
    }, [snapshots]);

    // Derive player keys once from the first snapshot for a stable getOpponent
    const playerKeys = useMemo(() => {
        const first = getSnapshot(0);
        return first?.players ? Object.keys(first.players) : [];
    }, [getSnapshot]);

    const gameState = getSnapshot(currentIndex);

    const getOpponent = useCallback((player: string): string => {
        return playerKeys.find((id) => id !== player) || '';
    }, [playerKeys]);

    const gameMessages: IChatEntry[] = React.useMemo(() => {
        if (currentIndex === 0 || events.length === 0) return [];

        // Events and snapshots are stored in file order by the parser.
        // Build a lookup of event indices that fall between the previous
        // and current snapshot based on their position in the original file.
        // We use a numeric-aware seq comparator to handle multi-digit values
        // (e.g., "R10.A.12" should sort after "R2.A.9").
        const prevSeq = snapshots[currentIndex - 1]?.seq ?? '';
        const currSeq = snapshots[currentIndex]?.seq ?? '';

        const relevantEvents = events.filter((e) => compareSeq(e.seq, prevSeq) > 0 && compareSeq(e.seq, currSeq) <= 0);

        return relevantEvents.map((e) => ({
            date: e.seq,
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

    const value: IReplayContextType = useMemo(() => ({
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
    }), [gameState, perspective, getOpponent, gameMessages, snapshots, events,
        currentIndex, totalSnapshots, header, play, pause, isPlaying, speed,
        setSpeed, stepForward, stepBack, seekTo, togglePerspective]);

    return (
        <ReplayContext.Provider value={value}>
            {children}
        </ReplayContext.Provider>
    );
};
