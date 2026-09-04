'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// gameState mirrors the live board's gameState, which is typed `any`
// (IBoardState.gameState: any, same as Game.context.tsx which disables this rule).
import React, { createContext, useContext, useState, useCallback, useRef, useEffect, useMemo, ReactNode } from 'react';
import type { SwuPgnDocument, ReducedState, Seat, GameEvent } from '@/lib/swupgn';
import { foldFrames, serialize, render, baseId, normalizeEvents } from '@/lib/swupgn';
import { adaptState, deckOrderLengths, type SeatToPlayerId } from '@/app/_utils/swupgnBoardAdapter';
import { buildMoveList, type ReplayMove } from '@/app/_utils/swupgnMoves';
import { makeNameResolver } from '@/app/_utils/swupgnCardNames';
import { useCardStatMap } from '@/app/_utils/swupgnCardStats';
import { frameAction } from '@/app/_utils/replayAction';
import { triggerBlobDownload, sanitizeFilename } from '@/app/_utils/downloadBlob';

/** One resource commitment: what was taken, and what the player could have taken instead. */
export interface IResourcingDecision {
    seq: string;
    frame: number;
    seat: Seat;
    round: number;
    card: string;
    /** The hand as it stood BEFORE the commitment, including `card`. */
    handBefore: string[];
}

export interface IReplayContextType {
    gameState: any;
    connectedPlayer: string;
    getOpponent: (p: string) => string;
    isSpectator: boolean;
    gameMessages: { date: string; message: string[] }[];
    gameIsEnded: () => boolean;
    lobbyState: null;

    doc: SwuPgnDocument;
    /** The repaired event stream. Frame indices address THIS, not `doc.events` — the
     *  reader drops inert records, so the two are not the same length. */
    events: GameEvent[];
    /** Round boundaries as scrubber marks: frame index + "R1", "R2", ... */
    roundMarks: { value: number; label: string }[];
    /** Every resource commitment, with the hand it was chosen from. */
    resourcingDecisions: IResourcingDecision[];
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

// ms per frame at each speed. 1x is 1000ms (was 2000) so playback visibly progresses
// without feeling stuck; the other steps stay relative.
export const SPEED_INTERVALS: Record<number, number> = { 0.5: 2000, 1: 1000, 2: 500, 4: 250 };

const P1 = 'Player 1';
const P2 = 'Player 2';
const SEAT_TO_ID: SeatToPlayerId = { 1: P1, 2: P2 };

interface ReplayProviderProps {
    doc: SwuPgnDocument;
    children: ReactNode;
    rawContent?: string | null;
    replayId?: string | null;
    /** Opening position: a `seq` (stable across stream repairs) or a legacy frame index. */
    initialFrame?: number | string;
    nameMap?: Record<string, string>;
    // Deep-linked clip range (?from&to): seek to start and auto-play the range on load.
    clipStart?: number | null;
    clipEnd?: number | null;
}

export const ReplayProvider: React.FC<ReplayProviderProps> = ({
    doc, children, rawContent = null, replayId = null, initialFrame = 0, nameMap = {},
    clipStart = null, clipEnd = null,
}) => {
    // Read the repaired stream, not the file's literal events: forceteki never emits a
    // decrement when a status token leaves its host, and deck searches emit inert MOVEs
    // that cost a scrubber frame each. See normalizeEvents.
    const events = useMemo(() => normalizeEvents(doc.events), [doc]);
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
    const statMap = useCardStatMap();
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

    // Whether each frame actually changes the rendered board vs the previous frame.
    // adaptState is a pure function of the ReducedState, so frames whose state is
    // byte-identical render identically — those are the no-op frames (shuffles, hidden
    // choices) that auto-playback skips so only visible changes hold on screen.
    const boardChanged = useMemo<boolean[]>(() => {
        const flags = new Array<boolean>(frameStates.length);
        let prevKey = '';
        for (let i = 0; i < frameStates.length; i++) {
            const key = JSON.stringify(frameStates[i]);
            flags[i] = i === 0 || key !== prevKey;
            prevKey = key;
        }
        return flags;
    }, [frameStates]);

    // Frames that are part of a "draw burst" — a DRAW summary or a deck->hand MOVE. A round
    // starts with several of these back-to-back; we collapse the run so playback shows the
    // whole drawn hand in one step instead of dealing card-by-card.
    const isDrawBurst = useMemo<boolean[]>(() => events.map((e) =>
        e.t === 'DRAW' || (e.t === 'MOVE' && e.to === 'hand' && e.from === 'deck')
    ), [events]);

    // Resource commitments paired with the hand they were chosen from. The board can only
    // show the hand AFTER the pick (the card has already left it on that frame), but what
    // makes a resourcing decision reviewable is the alternatives that were passed over.
    const resourcingDecisions = useMemo<IResourcingDecision[]>(() => {
        let round = 0;
        const out: IResourcingDecision[] = [];
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if (e.t === 'ROUND_START') { round = e.round; continue; }
            if (e.t !== 'MOVE' || e.to !== 'resource' || e.from !== 'hand' || !e.p) continue;
            const before = frameStates[i - 1]?.players[e.p]?.hand ?? [];
            out.push({
                seq: e.seq, frame: i, seat: e.p, round, card: e.card,
                // Guard the fold missing the card (a keyframe can resync the hand): the
                // committed card is part of the choice by definition.
                handBefore: before.includes(e.card) ? [...before] : [...before, e.card],
            });
        }
        return out;
    }, [events, frameStates]);

    // Round boundaries, for landmarks on an otherwise featureless 500-frame scrubber.
    const roundMarks = useMemo(
        () => events.flatMap((e, i) => (e.t === 'ROUND_START' ? [{ value: i, label: `R${e.round}` }] : [])),
        [events],
    );

    // Per-frame base HP. ReducedState seeds every base at 30 because the fold has no card
    // data, so a 33- or 28-HP base reads wrong until its first DAMAGE event — and the base
    // never showed damage at all. Seed from printed HP instead and apply the ABSOLUTE `hp`
    // the engine puts on every base DAMAGE/HEAL/OVERWHELM.
    const baseHpByFrame = useMemo<Array<Record<Seat, number | undefined>>>(() => {
        const printed: Record<Seat, number | undefined> = {
            1: statMap[baseId(doc.header.p1Base)]?.hp,
            2: statMap[baseId(doc.header.p2Base)]?.hp,
        };
        const cur: Record<Seat, number | undefined> = { 1: printed[1], 2: printed[2] };
        const out: Array<Record<Seat, number | undefined>> = new Array(events.length);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if (e.t === 'DAMAGE' || e.t === 'HEAL' || e.t === 'OVERWHELM') {
                const m = /^base@(\d)$/.exec(e.tgt);
                if (m) cur[Number(m[1]) as Seat] = e.hp;
            }
            out[i] = { 1: cur[1], 2: cur[2] };
        }
        return out;
    }, [events, doc.header.p1Base, doc.header.p2Base, statMap]);

    // Per-frame resource-pile contents. The fold tracks only a COUNT (ReducedState mirrors
    // forceteki's reference PlayerState, which has no resource identities), but the card ids
    // are right there in the `hand -> resource` MOVEs — and which card a player commits is
    // the single most reviewable decision in the game. Derived here, alongside
    // leaderExhaustByFrame, rather than by adding a client-only field to ReducedState.
    const resourcedByFrame = useMemo<Array<Record<Seat, string[]>>>(() => {
        const cur: Record<Seat, string[]> = { 1: [], 2: [] };
        const out: Array<Record<Seat, string[]>> = new Array(events.length);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if (e.t === 'MOVE' && e.p) {
                if (e.to === 'resource' && e.from !== 'resource') {
                    cur[e.p] = [...cur[e.p], e.card];
                } else if (e.from === 'resource' && e.to !== 'resource') {
                    cur[e.p] = cur[e.p].filter((c) => c !== e.card);
                }
            }
            out[i] = { 1: cur[1], 2: cur[2] };
        }
        return out;
    }, [events]);

    // Per-frame exhausted state of each leader, from EXHAUST/READY events for the leader id.
    // A leader exhausts when it uses its action ability (Karabast then dims the leader). The
    // undeployed leader isn't a folded card, so without this the board would never show it.
    const leaderExhaustByFrame = useMemo<Array<Record<Seat, boolean>>>(() => {
        const lead: Record<Seat, string> = { 1: baseId(doc.header.p1Leader), 2: baseId(doc.header.p2Leader) };
        const cur: Record<Seat, boolean> = { 1: false, 2: false };
        const out: Array<Record<Seat, boolean>> = new Array(events.length);
        for (let i = 0; i < events.length; i++) {
            const e = events[i];
            if ((e.t === 'EXHAUST' || e.t === 'READY') && 'card' in e) {
                const on = e.t === 'EXHAUST';
                for (const seat of [1, 2] as Seat[]) if (baseId(e.card) === lead[seat]) cur[seat] = on;
            }
            out[i] = { ...cur };
        }
        return out;
    }, [events, doc.header.p1Leader, doc.header.p2Leader]);

    // Next frame that visibly changes the board, capped at lastFrame. Used by auto-playback
    // (NOT manual step) so the interval fast-forwards over visually-identical no-op frames.
    const nextMeaningfulFrame = useCallback((from: number, lastFrame: number): number => {
        let i = from + 1;
        // Skip frames that don't change the board, and skip mid-draw-burst frames (stop on
        // the LAST draw of a run so the whole drawn hand appears at once).
        while (i < lastFrame && (!boardChanged[i] || (isDrawBurst[i] && isDrawBurst[i + 1]))) i++;
        return Math.min(i, lastFrame);
    }, [boardChanged, isDrawBurst]);

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
            // Open on frame 0 unless a ?t deep-link says otherwise. Playback used to skip to
            // the first ROUND_START, which hid the setup prologue — including both players'
            // opening resource picks, which are exactly what a replay is reviewed for.
            //
            // A `seq` deep-link is resolved against the repaired stream, so it lands on the
            // same MOMENT even though the reader drops inert records; a bare number is a
            // legacy index and is taken at face value.
            const seqIndex = typeof initialFrame === 'string' && !/^\d+$/.test(initialFrame)
                ? events.findIndex((e) => e.seq === initialFrame)
                : -1;
            const target = seqIndex >= 0 ? seqIndex : Number(initialFrame) || 0;
            setCurrentIndex(Math.max(0, Math.min(target, totalFrames - 1)));
            setIsPlaying(false);
        }
    }, [doc, events, initialFrame, totalFrames, clipStart, clipEnd]);

    // What happened on the current frame: a caption + the in-play card(s) to glow.
    const action = useMemo(() => frameAction(events[currentIndex], resolver), [events, currentIndex, resolver]);

    const gameState = useMemo(() => {
        if (!frameStates[currentIndex]) return null;
        // Fog-of-war hides the hand of whoever is NOT the current perspective.
        const oppSeat: Seat = perspective === P1 ? 2 : 1;
        // Units in play this frame that weren't in the previous one → animate them in.
        const prev = frameStates[currentIndex - 1];
        let enteringIds: string[] | undefined;
        if (prev) {
            const prevIds = new Set<string>();
            for (const seat of [1, 2] as Seat[]) for (const c of prev.players[seat]?.cards ?? []) prevIds.add(c.id);
            const cur = frameStates[currentIndex];
            enteringIds = [];
            for (const seat of [1, 2] as Seat[]) for (const c of cur.players[seat]?.cards ?? []) {
                if (!prevIds.has(c.id)) enteringIds.push(c.id);
            }
        }
        const opts: { hideHandFor?: Seat; highlightIds?: string[]; leaderExhausted?: Partial<Record<Seat, boolean>>; baseHp?: Partial<Record<Seat, number>>; resourcedIds?: Partial<Record<Seat, string[]>>; enteringIds?: string[]; attackingIds?: string[] } = {
            ...(fogOfWar ? { hideHandFor: oppSeat } : {}),
            highlightIds: action.highlight,
            leaderExhausted: leaderExhaustByFrame[currentIndex],
            // Fog-of-war hides the opponent's hand; their face-down resources go with it.
            baseHp: baseHpByFrame[currentIndex],
            resourcedIds: fogOfWar
                ? { [perspective === P1 ? 1 : 2]: resourcedByFrame[currentIndex]?.[perspective === P1 ? 1 : 2] ?? [] } as Partial<Record<Seat, string[]>>
                : resourcedByFrame[currentIndex],
            enteringIds,
            // On an ATTACK frame the attacker is the first highlight id; lunge it.
            attackingIds: action.kind === 'attack' && action.highlight[0] ? [action.highlight[0]] : undefined,
        };
        return adaptState(frameStates[currentIndex], doc, decks, SEAT_TO_ID, opts, statMap);
    }, [frameStates, currentIndex, doc, decks, fogOfWar, perspective, statMap, action, leaderExhaustByFrame, resourcedByFrame, baseHpByFrame]);

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

    // Caption text for the current frame (richer than the move list: includes ability
    // activations, resourcing, draws, discards). Empty string when nothing noteworthy.
    const currentEvents = useMemo(() => (action.label ? [action.label] : []), [action]);

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
    const play = useCallback(() => {
        setIsPlaying(true);
        // Advance immediately so Play gives instant feedback instead of a dead wait for
        // the first interval tick. Skips to the next visibly-meaningful frame.
        setCurrentIndex((prev) => {
            const lastFrame = clip ? clip.end : totalFrames - 1;
            return prev < lastFrame ? nextMeaningfulFrame(prev, lastFrame) : prev;
        });
    }, [clip, totalFrames, nextMeaningfulFrame]);
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
                // Fast-forward over visually-identical no-op frames during auto-playback.
                return nextMeaningfulFrame(prev, lastFrame);
            });
        }, SPEED_INTERVALS[speed] ?? 1000);
        return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
    }, [isPlaying, speed, totalFrames, clip, nextMeaningfulFrame]);

    const value: IReplayContextType = useMemo(() => ({
        gameState, connectedPlayer: perspective, getOpponent, isSpectator: true,
        gameMessages: [], gameIsEnded: () => true, lobbyState: null,
        doc, events, roundMarks, resourcingDecisions, currentIndex, totalFrames, header: doc.header, moves, currentMoveIndex,
        replayId, downloadReplay, nameOf: resolver.nameOf,
        downloadTextLog, fogOfWar, toggleFogOfWar,
        clip, setClipStart, setClipEnd, clearClip,
        play, pause, isPlaying, speed, setSpeed, stepForward, stepBack, seekTo,
        seekToSeq, currentEvents, togglePerspective, currentPerspective: perspective,
    }), [gameState, perspective, getOpponent, doc, events, roundMarks, resourcingDecisions, currentIndex, totalFrames, moves,
        currentMoveIndex, replayId, downloadReplay, resolver, downloadTextLog, fogOfWar, toggleFogOfWar,
        clip, setClipStart, setClipEnd, clearClip,
        play, pause, isPlaying, speed,
        stepForward, stepBack, seekTo, seekToSeq, currentEvents, togglePerspective]);

    return <ReplayContext.Provider value={value}>{children}</ReplayContext.Provider>;
};
