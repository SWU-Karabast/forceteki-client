'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// gameState mirrors the live board's gameState, which is typed `any`
// (IBoardState.gameState: any, same as Game.context.tsx which disables this rule).
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import type { SwuPgnDocument, ReducedState, Seat } from '@/lib/swupgn';
import { foldFrames, serialize, render } from '@/lib/swupgn';
import { adaptState, deckOrderLengths, type SeatToPlayerId } from '@/app/_utils/swupgnBoardAdapter';
import { buildMoveList, type ReplayMove } from '@/app/_utils/swupgnMoves';
import { makeNameResolver } from '@/app/_utils/swupgnCardNames';
import { triggerBlobDownload, sanitizeFilename } from '@/app/_utils/downloadBlob';

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
    // Clip range [start,end] (frame indices); playback loops within it. Null = whole game.
    clip: { start: number; end: number } | null;
    setClipStart: () => void;
    setClipEnd: () => void;
    clearClip: () => void;

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
    // Deep-linked clip range (?from&to): seek to start and auto-play the range on load.
    clipStart?: number | null;
    clipEnd?: number | null;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({
    doc, children, rawContent = null, replayId = null, initialFrame = 0, nameMap = {},
    clipStart = null, clipEnd = null,
}) => {
    const events = doc.events;
    const totalFrames = events.length;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [perspective, setPerspective] = useState(P1);
    const [fogOfWar, setFogOfWar] = useState(false);
    const [clip, setClipState] = useState<{ start: number; end: number } | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const resolver = useMemo(() => makeNameResolver(nameMap), [nameMap]);
    const decks = useMemo(() => deckOrderLengths(doc), [doc]);
    const moves = useMemo(() => buildMoveList(events, resolver), [events, resolver]);

    // Per-frame ReducedState, computed once per document load via a single O(n) forward
    // pass (foldFrames) instead of re-folding every prefix (which was O(n^2)).
    const frameStates = useMemo<ReducedState[]>(() => foldFrames(events), [events]);

    // seq -> frame index, built once, so currentMoveIndex is a cheap lookup rather than
    // an events.findIndex() per move on every frame change (was O(moves x events)).
    const seqToFrame = useMemo(() => {
        const m = new Map<string, number>();
        for (let i = 0; i < events.length; i++) m.set(events[i].seq, i);
        return m;
    }, [events]);
    const moveFrames = useMemo(() => moves.map((mv) => seqToFrame.get(mv.seq) ?? -1), [moves, seqToFrame]);

    useEffect(() => {
        setPerspective(P1);
        setFogOfWar(false);
        // A deep-linked clip range (?from&to) seeks to its start and auto-plays; otherwise
        // honor ?t (initialFrame) and start paused.
        const hasClip = clipStart != null && clipEnd != null && clipEnd >= clipStart;
        if (hasClip) {
            setClipState({ start: clipStart!, end: clipEnd! });
            setCurrentIndex(Math.max(0, Math.min(clipStart!, totalFrames - 1)));
            setIsPlaying(true);
        } else {
            setClipState(null);
            setCurrentIndex(Math.max(0, Math.min(initialFrame, totalFrames - 1)));
            setIsPlaying(false);
        }
    }, [doc, initialFrame, totalFrames, clipStart, clipEnd]);

    const gameState = useMemo(() => {
        if (!frameStates[currentIndex]) return null;
        // Fog-of-war hides the hand of whoever is NOT the current perspective.
        const oppSeat: Seat = perspective === P1 ? 2 : 1;
        const opts = fogOfWar ? { hideHandFor: oppSeat } : {};
        return adaptState(frameStates[currentIndex], doc, decks, SEAT_TO_ID, opts);
    }, [frameStates, currentIndex, doc, decks, fogOfWar, perspective]);

    const currentMoveIndex = useMemo(() => {
        // moveFrames is ascending (moves are in timeline order), so stop at the first
        // move that lands after the current frame.
        let idx = -1;
        for (let i = 0; i < moveFrames.length; i++) {
            const f = moveFrames[i];
            if (f >= 0 && f <= currentIndex) idx = i; else if (f > currentIndex) break;
        }
        return idx;
    }, [moveFrames, currentIndex]);

    const currentEvents = useMemo(() => {
        const e = events[currentIndex];
        if (!e) return [];
        const m = moves.find((mv) => mv.seq === e.seq);
        return m ? [m.label] : [];
    }, [events, currentIndex, moves]);

    const getOpponent = useCallback((p: string) => (p === P1 ? P2 : P1), []);
    const downloadReplay = useCallback(() => {
        const blob = new Blob([rawContent ?? serialize(doc)], { type: 'text/plain' });
        triggerBlobDownload(blob, sanitizeFilename(`${doc.header.p1}-vs-${doc.header.p2}.swupgn`));
    }, [rawContent, doc]);

    const downloadTextLog = useCallback(() => {
        const blob = new Blob([render(doc, resolver)], { type: 'text/plain' });
        triggerBlobDownload(blob, sanitizeFilename(`${doc.header.p1}-vs-${doc.header.p2}.txt`));
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

    // Clip authoring: set the in/out point to the current frame; clear to drop the clip.
    const setClipStart = useCallback(() => setClipState((c) => ({ start: currentIndex, end: Math.max(currentIndex, c?.end ?? currentIndex) })), [currentIndex]);
    const setClipEnd = useCallback(() => setClipState((c) => ({ start: Math.min(currentIndex, c?.start ?? currentIndex), end: currentIndex })), [currentIndex]);
    const clearClip = useCallback(() => setClipState(null), []);

    useEffect(() => {
        if (!isPlaying) return;
        // A clip loops within [start, end]; normal playback runs to the end and stops.
        const lastFrame = clip ? clip.end : totalFrames - 1;
        intervalRef.current = setInterval(() => {
            setCurrentIndex((prev) => {
                if (prev >= lastFrame) {
                    if (clip) return clip.start; // loop the clip
                    setIsPlaying(false);
                    return prev;
                }
                return prev + 1;
            });
        }, SPEED_INTERVALS[speed] ?? 2000);
        return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    }, [isPlaying, speed, totalFrames, clip]);

    const value: IReplayContextType = useMemo(() => ({
        gameState, connectedPlayer: perspective, getOpponent, isSpectator: true,
        gameMessages: [], gameIsEnded: () => true, lobbyState: null,
        doc, currentIndex, totalFrames, header: doc.header, moves, currentMoveIndex,
        replayId, downloadReplay, nameOf: resolver.nameOf,
        downloadTextLog, fogOfWar, toggleFogOfWar,
        clip, setClipStart, setClipEnd, clearClip,
        play, pause, isPlaying, speed, setSpeed, stepForward, stepBack, seekTo,
        seekToSeq, currentEvents, togglePerspective, currentPerspective: perspective,
    }), [gameState, perspective, getOpponent, doc, currentIndex, totalFrames, moves,
        currentMoveIndex, replayId, downloadReplay, resolver, downloadTextLog, fogOfWar, toggleFogOfWar,
        clip, setClipStart, setClipEnd, clearClip,
        play, pause, isPlaying, speed,
        stepForward, stepBack, seekTo, seekToSeq, currentEvents, togglePerspective]);

    return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
};
