'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// gameState mirrors the live board's gameState, which is typed `any`
// (IBoardState.gameState: any, same as Game.context.tsx which disables this rule).
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import type { SwuPgnDocument, ReducedState, Seat } from '@/lib/swupgn';
import { fold, serialize, render } from '@/lib/swupgn';
import { adaptState, deckOrderLengths, type SeatToPlayerId } from '@/app/_utils/swupgnBoardAdapter';
import { buildMoveList, type ReplayMove } from '@/app/_utils/swupgnMoves';
import { makeNameResolver } from '@/app/_utils/swupgnCardNames';

export interface IReplayContextType {
    gameState: any;
    connectedPlayer: string;
    getOpponent: (p: string) => string;
    isSpectator: boolean;
    gameMessages: { date: string; message: string[] }[];
    gameIsEnded: () => boolean;
    lobbyState: null;

    doc: SwuPgnDocument;
    currentIndex: number;
    totalFrames: number;
    header: SwuPgnDocument['header'];
    moves: ReplayMove[];
    currentMoveIndex: number;
    replayId: string | null;
    downloadReplay: () => void;

    /** Resolve a SET#NUM[:copy] card id to a display name (falls back to the raw id). */
    nameOf: (id: string) => string;

    // Download a human-readable text log of the game (reader's render()).
    downloadTextLog: () => void;
    // Fog-of-war: when true, the non-perspective player's hand renders face-down.
    fogOfWar: boolean;
    toggleFogOfWar: () => void;

    play: () => void; pause: () => void; isPlaying: boolean;
    speed: number; setSpeed: (s: number) => void;
    stepForward: () => void; stepBack: () => void; seekTo: (i: number) => void;
    seekToSeq: (seq: string) => void;
    currentEvents: string[];
    togglePerspective: () => void; currentPerspective: string;
}

export const ReplayContext = createContext<IReplayContextType | null>(null);

export function useReplay(): IReplayContextType {
    const ctx = useContext(ReplayContext);
    if (!ctx) throw new Error('useReplay must be used within a ReplayProvider');
    return ctx;
}

export const SPEED_INTERVALS: Record<number, number> = { 0.5: 4000, 1: 2000, 2: 1000, 4: 500 };

const P1 = 'Player 1';
const P2 = 'Player 2';
const SEAT_TO_ID: SeatToPlayerId = { 1: P1, 2: P2 };

interface ReplayProviderProps {
    doc: SwuPgnDocument;
    children: ReactNode;
    rawContent?: string | null;
    replayId?: string | null;
    initialFrame?: number;
    nameMap?: Record<string, string>;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({
    doc, children, rawContent = null, replayId = null, initialFrame = 0, nameMap = {},
}) => {
    const events = doc.events;
    const totalFrames = events.length;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [perspective, setPerspective] = useState(P1);
    const [fogOfWar, setFogOfWar] = useState(false);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const resolver = useMemo(() => makeNameResolver(nameMap), [nameMap]);
    const decks = useMemo(() => deckOrderLengths(doc), [doc]);
    const moves = useMemo(() => buildMoveList(events, resolver), [events, resolver]);

    // Per-frame ReducedState, computed once per document load (fold is O(n); this is O(n^2)
    // at load for an n-event game, acceptable for P0 — optimize with incremental fold later).
    const frameStates = useMemo<ReducedState[]>(() => {
        const out: ReducedState[] = [];
        for (let i = 0; i < events.length; i++) out.push(fold(events.slice(0, i + 1)));
        return out;
    }, [events]);

    useEffect(() => {
        setCurrentIndex(Math.max(0, Math.min(initialFrame, totalFrames - 1)));
        setIsPlaying(false);
        setPerspective(P1);
        setFogOfWar(false);
    }, [doc, initialFrame, totalFrames]);

    const gameState = useMemo(() => {
        if (!frameStates[currentIndex]) return null;
        // Fog-of-war hides the hand of whoever is NOT the current perspective.
        const oppSeat: Seat = perspective === P1 ? 2 : 1;
        const opts = fogOfWar ? { hideHandFor: oppSeat } : {};
        return adaptState(frameStates[currentIndex], doc, decks, SEAT_TO_ID, opts);
    }, [frameStates, currentIndex, doc, decks, fogOfWar, perspective]);

    const currentMoveIndex = useMemo(() => {
        let idx = -1;
        for (let i = 0; i < moves.length; i++) {
            const moveFrame = events.findIndex((e) => e.seq === moves[i].seq);
            if (moveFrame <= currentIndex) idx = i; else break;
        }
        return idx;
    }, [moves, events, currentIndex]);

    const currentEvents = useMemo(() => {
        const e = events[currentIndex];
        if (!e) return [];
        const m = moves.find((mv) => mv.seq === e.seq);
        return m ? [m.label] : [];
    }, [events, currentIndex, moves]);

    const getOpponent = useCallback((p: string) => (p === P1 ? P2 : P1), []);
    const downloadReplay = useCallback(() => {
        const content = rawContent ?? serialize(doc);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.header.p1}-vs-${doc.header.p2}.swupgn`.replace(/[^a-z0-9.-]+/gi, '-');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [rawContent, doc]);

    const downloadTextLog = useCallback(() => {
        const blob = new Blob([render(doc, resolver)], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${doc.header.p1}-vs-${doc.header.p2}.txt`.replace(/[^a-z0-9.-]+/gi, '-');
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }, [doc, resolver]);

    const toggleFogOfWar = useCallback(() => setFogOfWar((f) => !f), []);

    const stepForward = useCallback(() => setCurrentIndex((p) => Math.min(p + 1, totalFrames - 1)), [totalFrames]);
    const stepBack = useCallback(() => setCurrentIndex((p) => Math.max(p - 1, 0)), []);
    const seekTo = useCallback((i: number) => setCurrentIndex(Math.max(0, Math.min(i, totalFrames - 1))), [totalFrames]);
    const seekToSeq = useCallback((seq: string) => {
        const i = events.findIndex((e) => e.seq === seq);
        if (i >= 0) setCurrentIndex(i);
    }, [events]);
    const play = useCallback(() => setIsPlaying(true), []);
    const pause = useCallback(() => setIsPlaying(false), []);
    const togglePerspective = useCallback(() => setPerspective((p) => (p === P1 ? P2 : P1)), []);

    useEffect(() => {
        if (!isPlaying) return;
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev >= totalFrames - 1) { setIsPlaying(false); return prev; }
                return prev + 1;
            });
        }, SPEED_INTERVALS[speed] ?? 2000);
        return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    }, [isPlaying, speed, totalFrames]);

    const value: IReplayContextType = useMemo(() => ({
        gameState, connectedPlayer: perspective, getOpponent, isSpectator: true,
        gameMessages: [], gameIsEnded: () => true, lobbyState: null,
        doc, currentIndex, totalFrames, header: doc.header, moves, currentMoveIndex,
        replayId, downloadReplay, nameOf: resolver.nameOf,
        downloadTextLog, fogOfWar, toggleFogOfWar,
        play, pause, isPlaying, speed, setSpeed, stepForward, stepBack, seekTo,
        seekToSeq, currentEvents, togglePerspective, currentPerspective: perspective,
    }), [gameState, perspective, getOpponent, doc, currentIndex, totalFrames, moves,
        currentMoveIndex, replayId, downloadReplay, resolver, downloadTextLog, fogOfWar, toggleFogOfWar,
        play, pause, isPlaying, speed,
        stepForward, stepBack, seekTo, seekToSeq, currentEvents, togglePerspective]);

    return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
};
