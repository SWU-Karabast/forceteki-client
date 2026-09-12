'use client';
import React, { useLayoutEffect, useRef } from 'react';
import { useReplay } from '@/app/_contexts/Replay.context';
import { beatAt } from '@/app/_utils/replayBeats';
import { planBeat, type Intent } from '@/app/_utils/frameAnimationPlan';
import { createBoardGeometry, snapOf, type Snapshot } from '@/app/_utils/boardGeometry';
import { RAPID_STEP_MS } from '@/app/_utils/replayTiming';
import * as P from '@/app/_utils/animPrimitives';
import { parseSetId } from '@/app/_utils/swupgnBoardAdapter';
import { s3CardImageURL, type CardImageLocale } from '@/app/_utils/s3Utils';
import { useCardImageLocale } from '@/app/_contexts/CardImageLocale.context';
import type { Seat } from '@/lib/swupgn';

/**
 * Card motion between beats. Runs AFTER React commits the new frame (useLayoutEffect on
 * currentIndex): measures every [data-card-uuid] rect, diffs against the previous beat's
 * rects, plans intents from the beat's transitions, and runs them as Web Animations on
 * clones in this overlay. Forward by exactly one beat animates; anything else snaps.
 */
const ReplayAnimator: React.FC<{ containerRef: React.RefObject<HTMLElement | null> }> = ({ containerRef }) => {
    const { currentIndex, beats, transitionsOf, speed, isPlaying, currentPerspective, animate, gameState } = useReplay();
    const locale = useCardImageLocale();
    const overlayRef = useRef<HTMLDivElement>(null);
    const prevRects = useRef<Snapshot | null>(null);
    const prevIndex = useRef(currentIndex);
    const lastRun = useRef(0);
    // Each animation with the cleanup it owes: a cancel fires `oncancel` on a LATER
    // task, so the previous beat's `show()` / zIndex restore would land after the new
    // beat had already hidden its cards. The cleanup runs them itself instead.
    const active = useRef<{ anim: Animation; onDone?: () => void }[]>([]);
    const timers = useRef<number[]>([]);
    const hidden = useRef<HTMLElement[]>([]);

    useLayoutEffect(() => {
        const container = containerRef.current, overlay = overlayRef.current;
        if (!container || !overlay) return;
        // 1. cancel whatever is still running, restore hidden live cards, empty the overlay
        active.current.forEach(({ anim, onDone }) => { anim.onfinish = anim.oncancel = null; anim.cancel(); onDone?.(); }); active.current = [];
        timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
        hidden.current.forEach((el) => { el.style.opacity = ''; }); hidden.current = [];
        overlay.replaceChildren();
        // 2. measure the committed frame
        const geom = createBoardGeometry(container);
        const next = geom.measureAll();
        const old = prevRects.current;
        prevRects.current = next;
        const from = prevIndex.current; prevIndex.current = currentIndex;
        const now = performance.now(); const dt = now - lastRun.current; lastRun.current = now;
        // 3. animate only a deliberate forward step of exactly one beat
        const fromBeat = beatAt(beats, from), toBeat = beatAt(beats, currentIndex);
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (!old || !animate || reduced || currentIndex <= from || toBeat.index !== fromBeat.index + 1 || dt < RAPID_STEP_MS) return;
        // 4. plan and run
        const cRect = container.getBoundingClientRect();
        const ids = { 1: 'Player 1', 2: 'Player 2' } as const;
        const bottomSeat: Seat = currentPerspective === ids[1] ? 1 : 2;
        // A base card's uuid is its set id, so `base@<seat>` is resolved off the board's
        // own layout instead of the measured map.
        const baseEls = geom.bases(bottomSeat);
        const intents = planBeat({
            prev: old, next, transitions: transitionsOf(toBeat), bottomSeat,
            piles: { resource: { 1: geom.pile('resource', ids[1]), 2: geom.pile('resource', ids[2]) }, discard: { 1: geom.pile('discard', ids[1]), 2: geom.pile('discard', ids[2]) } },
            bases: { 1: snapOf(baseEls[1]), 2: snapOf(baseEls[2]) },
            hidden: { 1: geom.hidden(ids[1]), 2: geom.hidden(ids[2]) },
            arenaBand: geom.arenaBand(),
        });
        const rate = isPlaying ? Math.max(0.05, speed) : 1;   // manual steps play at natural pace
        const stage: P.Stage = {
            rate,
            findCard: (u) => {
                const base = /^base@([12])$/.exec(u);
                if (base) return baseEls[Number(base[1]) as Seat];
                return container.querySelector<HTMLElement>(`[data-card-uuid="${CSS.escape(u)}"]`);
            },
            clone: (snap, z) => { const el = fromHtml(snap.html); Object.assign(el.style, { position: 'absolute', left: `${snap.x - cRect.left}px`, top: `${snap.y - cRect.top}px`, width: `${snap.w}px`, height: `${snap.h}px`, margin: '0', pointerEvents: 'none', transformOrigin: '0 0', zIndex: z != null ? String(z) : '' }); overlay.appendChild(el); return el; },
            layer: (snap, z, opts) => { const outer = document.createElement('div'); Object.assign(outer.style, { position: 'absolute', left: `${snap.x - cRect.left}px`, top: `${snap.y - cRect.top}px`, width: `${snap.w}px`, height: `${snap.h}px`, transformOrigin: opts?.origin ?? 'center', pointerEvents: 'none', zIndex: String(z), filter: opts?.shadow ?? '' }); const inner = document.createElement('div'); Object.assign(inner.style, { width: '100%', height: '100%', position: 'relative', transformOrigin: 'center' }); outer.appendChild(inner); overlay.appendChild(outer); return { outer, inner }; },
            face: (html) => { const el = fromHtml(html); Object.assign(el.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', margin: '0' }); return el; },
            node: () => document.createElement('div'),
            mount: (el) => overlay.appendChild(el),
            rel: (p) => ({ left: p.x - cRect.left, top: p.y - cRect.top }),
            hide: (el) => { if (el) { el.style.opacity = '0'; hidden.current.push(el); } },
            show: (el) => { if (el) el.style.opacity = ''; },
            animate: (el, kf, timing, onDone) => { const a = el.animate(kf, timing); a.playbackRate = rate; active.current.push({ anim: a, onDone }); a.onfinish = a.oncancel = () => onDone?.(); },
            later: (ms, fn) => { timers.current.push(window.setTimeout(fn, ms / rate)); },
            board: () => container,
        };
        for (const intent of intents) run(intent, stage, locale);
    // gameState is in the deps so the effect runs after the board re-rendered the new frame.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, gameState]);

    return <div ref={overlayRef} aria-hidden style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 5 }} />;
};

function fromHtml(html: string): HTMLElement {
    const box = document.createElement('div'); box.innerHTML = html;
    const el = (box.firstElementChild as HTMLElement) ?? box;
    // A clone must never answer a `[data-card-uuid]` query: it would be measured as
    // the card's rect next beat, or hidden in place of the live node.
    el.removeAttribute('data-card-uuid');
    return el;
}

/** The card's own art, for a face-down play that has no rendered face to clone: the
 *  intent's uuid IS the card's `SET#NUM` id. */
const faceArt = (uuid: string, locale: CardImageLocale) => s3CardImageURL({ setId: parseSetId(uuid), type: '', id: uuid }, locale);

function run(i: Intent, s: P.Stage, locale: CardImageLocale): void {
    switch (i.type) {
        case 'move': return P.slide(s, { uuid: i.uuid, from: i.from, to: i.to, delay: i.delay });
        case 'enter': return P.enterFade(s, { uuid: i.uuid, delay: i.delay });
        case 'exit': return P.exitFade(s, { from: i.rect, delay: i.delay });
        case 'playFlip': return P.playFlip(s, { uuid: i.uuid, from: i.from, to: i.to, faceDown: i.faceDown });
        case 'lunge': return P.lunge(s, { uuid: i.uuid, from: i.from, to: i.to, delay: i.delay });
        case 'shake': return P.shake(s, { uuid: i.uuid, amplitude: i.amplitude, delay: i.delay });
        case 'tracer': return P.tracer(s, { from: i.from, to: i.to, color: i.color, delay: i.delay });
        case 'flash': return P.flash(s, { rect: i.rect, color: i.color, delay: i.delay });
        case 'eventStage': return P.eventStage(s, { ...i, faceUp: i.faceDown ? faceArt(i.uuid, locale) : undefined });
        case 'upgradeStage': return P.upgradeStage(s, { ...i, faceUp: i.faceDown ? faceArt(i.uuid, locale) : undefined });
        case 'resourceStage': return P.resourceStage(s, i);
        case 'leaderDeploy': return P.leaderDeploy(s, i);
    }
}
export default ReplayAnimator;
