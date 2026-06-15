'use client';
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';
import { IBoardState } from '@/app/_hooks/useBoardState';
import { ParsedReplay, ReplayEvent, ReplaySnapshot } from '@/app/_utils/replayParser';
import {
    compareSeq, buildMoveList, buildChapters, describeEvent, eventCardRefs,
    ReplayMove, ReplayChapter,
} from '@/app/_utils/replayMoves';

// Re-export for convenience
export type { ParsedReplay, ReplayEvent, ReplaySnapshot };
export type { ReplayMove, ReplayChapter };

export interface IReplayContextType extends IBoardState {
    snapshots: ReplaySnapshot[];
    events: ReplayEvent[];
    currentIndex: number;
    totalSnapshots: number;
    header: Record<string, string>;
    cardNames: Record<string, string>;

    /** Discrete human-readable beats across the whole replay (for the move list). */
    moves: ReplayMove[];

    /** Index into `moves` of the latest beat at/before the current frame, or -1. */
    currentMoveIndex: number;

    /** Round/phase jump points for the scrub bar. */
    chapters: ReplayChapter[];

    /** Human descriptions of the events resolved in the current frame. */
    currentEvents: string[];

    /** Card refs (SET#NUM / TOKEN:name) touched in the current frame, for board highlighting. */
    highlightedCardRefs: string[];

    /** Stored id of this replay (for share links), or null if not persisted. */
    replayId: string | null;

    /** Re-download the loaded .swureplay file. */
    downloadReplay: () => void;

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

/**
 * Set of card refs (SET#NUM) to highlight on the board for the current replay
 * frame. Safe to call from shared components (e.g. GameCard) that also render
 * in the live game — returns an empty set when there is no ReplayProvider, so
 * the live game is never affected.
 */
export function useReplayHighlightSet(): Set<string> {
    const context = useContext(ReplayContext);
    return useMemo(() => new Set(context?.highlightedCardRefs ?? []), [context?.highlightedCardRefs]);
}

export const SPEED_INTERVALS: Record<number, number> = {
    0.5: 4000,
    1: 2000,
    2: 1000,
    4: 500,
};

interface ReplayProviderProps {
    replay: ParsedReplay;
    children: ReactNode;

    /** Frame to open on first load (deep-link ?t=N). */
    initialFrame?: number;

    /** Stored id of this replay, for building share links. */
    replayId?: string | null;

    /** Raw .swureplay content, kept so the viewer can re-download the file. */
    rawContent?: string | null;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({ replay, children, initialFrame = 0, replayId = null, rawContent = null }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const snapshotCache = useRef<Map<number, any>>(new Map());

    const { snapshots, events, header, cardNames } = replay;
    const totalSnapshots = snapshots.length;

    const [perspective, setPerspective] = useState('Player 1');

    // Reset state when a new replay is loaded; honor the deep-link initial frame.
    useEffect(() => {
        setCurrentIndex(Math.max(0, Math.min(initialFrame, snapshots.length - 1)));
        setIsPlaying(false);
        setPerspective('Player 1');
        snapshotCache.current.clear();
    }, [replay, initialFrame, snapshots.length]);

    const downloadReplay = useCallback(() => {
        if (!rawContent) return;
        const p1 = (header.Player1 || 'Player 1').replace(/[^a-z0-9]+/gi, '-');
        const p2 = (header.Player2 || 'Player 2').replace(/[^a-z0-9]+/gi, '-');
        const blob = new Blob([rawContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${p1}-vs-${p2}.swureplay`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [rawContent, header]);

    const getSnapshot = useCallback((index: number): any => {
        if (snapshotCache.current.has(index)) return snapshotCache.current.get(index);

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

    // Events whose outcome resolves in the current frame (after the previous
    // snapshot, up to and including this one). Drives the caption, chat, and
    // board highlight. Numeric-aware comparator handles multi-digit seqs
    // (e.g., "R10.A.12" sorts after "R2.A.9").
    const currentFrameEvents: ReplayEvent[] = useMemo(() => {
        if (currentIndex === 0 || events.length === 0) return [];
        const prevSeq = snapshots[currentIndex - 1]?.seq ?? '';
        const currSeq = snapshots[currentIndex]?.seq ?? '';
        return events.filter((e) => e.seq && compareSeq(e.seq, prevSeq) > 0 && compareSeq(e.seq, currSeq) <= 0);
    }, [currentIndex, events, snapshots]);

    const gameMessages: IChatEntry[] = useMemo(
        () => currentFrameEvents.map((e) => ({ date: e.seq, message: [describeEvent(e, cardNames)] })),
        [currentFrameEvents, cardNames]
    );

    const currentEvents: string[] = useMemo(
        () => currentFrameEvents.map((e) => describeEvent(e, cardNames)),
        [currentFrameEvents, cardNames]
    );

    const highlightedCardRefs: string[] = useMemo(
        () => Array.from(new Set(currentFrameEvents.flatMap(eventCardRefs))),
        [currentFrameEvents]
    );

    const moves = useMemo(() => buildMoveList(events, snapshots, cardNames), [events, snapshots, cardNames]);
    const chapters = useMemo(() => buildChapters(snapshots), [snapshots]);
    const currentMoveIndex = useMemo(() => {
        let idx = -1;
        for (let i = 0; i < moves.length; i++) {
            if (moves[i].snapshotIndex <= currentIndex) idx = i;
            else break;
        }
        return idx;
    }, [moves, currentIndex]);

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
        gameIsEnded: () => true,
        lobbyState: null,

        snapshots,
        events,
        currentIndex,
        totalSnapshots,
        header,
        cardNames,

        moves,
        currentMoveIndex,
        chapters,
        currentEvents,
        highlightedCardRefs,
        replayId,
        downloadReplay,

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
        currentIndex, totalSnapshots, header, cardNames, moves, currentMoveIndex,
        chapters, currentEvents, highlightedCardRefs, replayId, downloadReplay,
        play, pause, isPlaying, speed,
        setSpeed, stepForward, stepBack, seekTo, togglePerspective]);

    return (
        <ReplayContext.Provider value={value}>
            {children}
        </ReplayContext.Provider>
    );
};
