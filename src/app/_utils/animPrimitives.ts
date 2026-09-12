// Animation PRIMITIVE vocabulary for the replay viewer's beat animator. Each
// primitive calls only `Stage` methods (never the DOM directly), so it can be
// unit-tested in node with a recording fake and reused unchanged once a later
// task mounts the real overlay `Stage`. Ported from karabuddy's
// app/(app)/r/[slug]/animPrimitives.ts (same author): `el.animate(...)` +
// `stage.track(...)` became `s.animate(el, ..., onDone)` and
// `window.setTimeout` became `s.later`, so the stage owns every side effect.
import { DURATION } from './replayTiming';

export interface Snap { x: number; y: number; w: number; h: number; html: string }
export interface Point { x: number; y: number }

export interface Stage {
    rate: number; // playbackRate for every animation
    findCard(uuid: string): HTMLElement | null; // the LIVE node
    clone(snap: Snap, zIndex?: number): HTMLElement; // overlay clone at snap's rect, transform-origin 0 0
    layer(snap: Snap, zIndex: number, opts?: { origin?: string; shadow?: string }): { outer: HTMLElement; inner: HTMLElement }; // outer moves, inner flips
    face(html: string): HTMLElement; // a fill-parent face built from outerHTML
    node(): HTMLElement; // a bare element the caller styles and mounts; the stage creates it so primitives never touch `document`
    mount(el: HTMLElement): void; // append a raw FX node to the overlay
    rel(p: Point): { left: number; top: number }; // screen point → overlay-relative
    hide(el: HTMLElement | null): void;
    show(el: HTMLElement | null): void;
    animate(el: Element, keyframes: Keyframe[], timing: KeyframeEffectOptions, onDone?: () => void): void; // owns WAAPI, rate and cleanup
    later(ms: number, fn: () => void): void; // rate-scaled setTimeout the stage can cancel
}

const EASING = 'cubic-bezier(0.4, 0, 0.2, 1)';
const LUNGE_EASING = 'cubic-bezier(0.34, 1.2, 0.64, 1)';

// SLIDE (FLIP): a card glides from its old rect to its new one. The clone carries
// the NEW look; the live card is hidden until it lands. A near-1 scale is snapped
// to 1 so an incidental grid resize doesn't also swell the card.
export function slide(s: Stage, p: { uuid: string; from: Snap; to: Snap; delay?: number }): void {
    const { from: o, to: n } = p;
    const live = s.findCard(p.uuid);
    const el = s.clone(n);
    const rawSx = o.w / n.w, rawSy = o.h / n.h;
    const sx = Math.abs(rawSx - 1) < 0.08 ? 1 : rawSx;
    const sy = Math.abs(rawSy - 1) < 0.08 ? 1 : rawSy;
    const startT = `translate(${o.x - n.x}px, ${o.y - n.y}px) scale(${sx}, ${sy})`;
    el.style.transform = startT;
    s.hide(live);
    s.animate(el, [{ transform: startT }, { transform: 'translate(0, 0) scale(1, 1)' }],
        { duration: DURATION.slide, delay: p.delay ?? 0, fill: 'both', easing: EASING },
        () => { el.remove(); s.show(live); });
}

// ENTER (fade): a card materializing in place (e.g. a created token). Animates
// the LIVE element — no clone — fading + scaling up from 0.82.
export function enterFade(s: Stage, p: { uuid: string; delay?: number }): void {
    const live = s.findCard(p.uuid);
    if (!live) return;
    s.hide(live);
    s.animate(live, [{ opacity: 0, transform: 'scale(0.82)' }, { opacity: 1, transform: 'scale(1)' }],
        { duration: DURATION.enter, delay: p.delay ?? 0, fill: 'both', easing: EASING },
        () => s.show(live));
}

// EXIT (fade): a card leaving the board (defeated / bounced). Clones its OLD
// rect and fades + shrinks it out (the live card is already gone from the frame).
export function exitFade(s: Stage, p: { from: Snap; delay?: number }): void {
    const el = s.clone(p.from);
    s.animate(el, [{ opacity: 1, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(0.82)' }],
        { duration: DURATION.exit, delay: p.delay ?? 0, fill: 'backwards', easing: EASING }, () => el.remove());
}

// FLIP: a card's inner faces flip (scaleX 1 → 0.04 → 1), swapping content at the
// narrow point. The swap timer runs through `s.later` so the stage can rate-scale
// and cancel it.
export function flip(s: Stage, inner: HTMLElement, p: { build: () => HTMLElement; at: number; duration: number; onDone?: () => void }): void {
    s.later(p.at + p.duration / 2, () => inner.replaceChildren(p.build()));
    s.animate(inner, [{ transform: 'scaleX(1)' }, { transform: 'scaleX(0.04)' }, { transform: 'scaleX(1)' }],
        { duration: p.duration, delay: p.at, fill: 'backwards', easing: 'ease-in-out' }, p.onDone);
}

// PLAY-FLIP: a card played from a hidden hand — it slides face-down from the
// opponent's hand into its arena slot, then flips to reveal the real card. A
// face-up play (our own hand) skips the flip and just lands.
export function playFlip(s: Stage, p: { uuid: string; from: Snap; to: Snap; faceDown: boolean }): void {
    const { from, to } = p;
    const live = s.findCard(p.uuid);
    s.hide(live);
    const { outer, inner } = s.layer(to, 8);
    inner.appendChild(s.face(from.html));
    const sx = from.w / to.w, sy = from.h / to.h, tx = from.x - to.x, ty = from.y - to.y;
    s.animate(outer, [{ transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})` }, { transform: 'translate(0,0) scale(1,1)' }],
        { duration: DURATION.playMove, fill: 'backwards', easing: EASING });
    if (p.faceDown) {
        flip(s, inner, { build: () => s.face(to.html), at: DURATION.playMove, duration: DURATION.playFlip, onDone: () => { outer.remove(); s.show(live); } });
    } else {
        s.later(DURATION.playMove, () => { outer.remove(); s.show(live); });
    }
}

// LUNGE: an attacker thrusts ~55% of the way to its target and recoils. A
// SURVIVING attacker lunges as the LIVE element (a clone could be left behind as
// a stationary ghost). A traded-away attacker (gone from the board) lunges a
// clone. Karabuddy also lifts overflow-clipping on the live card's ancestors
// here via `stage.unclip`; our board container has no such clipping ancestor,
// so that call is dropped.
export function lunge(s: Stage, p: { uuid: string; from: Snap; to: Snap; delay?: number }): void {
    const { from: a, to: t } = p;
    // Rounded to the nearest pixel: 0.55 has no exact binary representation, so an
    // unrounded product (e.g. 200 * 0.55) can land a floating-point hair past the
    // intended whole-pixel offset.
    const dx = Math.round((t.x + t.w / 2 - (a.x + a.w / 2)) * 0.55);
    const dy = Math.round((t.y + t.h / 2 - (a.y + a.h / 2)) * 0.55);
    const kf: Keyframe[] = [
        { transform: 'translate(0,0) scale(1)', offset: 0 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.08)`, offset: 0.42 },
        { transform: 'translate(0,0) scale(1)', offset: 1 },
    ];
    const live = s.findCard(p.uuid);
    if (live) {
        const pz = live.style.zIndex, pp = live.style.position;
        if (!live.style.position) live.style.position = 'relative';
        live.style.zIndex = '20';
        s.animate(live, kf, { duration: DURATION.lunge, delay: p.delay ?? 0, easing: LUNGE_EASING },
            () => { live.style.zIndex = pz; live.style.position = pp; });
    } else {
        const el = s.clone(a, 10);
        s.animate(el, kf, { duration: DURATION.lunge, delay: p.delay ?? 0, easing: LUNGE_EASING }, () => el.remove());
    }
}

/** A damped recoil (SWUForge's hit-shake): 3 cycles, each peak 0.62 of the last. */
export function shake(s: Stage, p: { uuid: string; amplitude: number; delay?: number }): void {
    const live = s.findCard(p.uuid);
    if (!live) return;
    const kf: Keyframe[] = [{ transform: 'translate(0, 0)' }];
    let a = p.amplitude;
    for (let i = 0; i < 6; i++) { kf.push({ transform: `translate(${(i % 2 ? 1 : -1) * a}px, ${a * 0.3}px) rotate(${(i % 2 ? 1 : -1) * 1.5}deg)` }); a *= 0.62; }
    kf.push({ transform: 'translate(0, 0)' });
    s.animate(live, kf, { duration: DURATION.shake, delay: p.delay ?? 0, easing: 'cubic-bezier(0.36, 0.07, 0.19, 0.97)' });
}

// TRACER: a colored bolt that streaks from a source point to a target (damage /
// heal). Invisible until it begins (matters when delayed behind a staged event).
// The orb is a bare `s.node()`, not `document.createElement`, so this stays
// DOM-free outside the stage and testable in node.
export function tracer(s: Stage, p: { from: Point; to: Point; color: string; delay?: number }): void {
    const size = 16;
    const o = s.rel(p.from);
    const orb = s.node();
    Object.assign(orb.style, {
        position: 'absolute', left: `${o.left - size / 2}px`, top: `${o.top - size / 2}px`,
        width: `${size}px`, height: `${size}px`, borderRadius: '50%', opacity: '0',
        background: p.color, boxShadow: `0 0 10px 3px ${p.color}`, pointerEvents: 'none', zIndex: '11',
    } as Partial<CSSStyleDeclaration>);
    s.mount(orb);
    const dx = p.to.x - p.from.x, dy = p.to.y - p.from.y;
    s.animate(orb, [
        { transform: 'translate(0,0) scale(0.5)', opacity: 0.3, offset: 0 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5}px) scale(1)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(1.4)`, opacity: 1, offset: 1 },
    ], { duration: DURATION.tracer, delay: p.delay ?? 0, easing: 'cubic-bezier(0.4, 0, 0.6, 1)' }, () => orb.remove());
}

// FLASH: a colored impact wash over the struck card, timed to land as the bolt
// connects (tracer duration - 70ms, plus any event-effect delay).
// The wash is a bare `s.node()`, not `document.createElement`, so this stays
// DOM-free outside the stage and testable in node.
export function flash(s: Stage, p: { rect: Snap; color: string; delay?: number }): void {
    const f = s.rel(p.rect);
    const el = s.node();
    Object.assign(el.style, {
        position: 'absolute', left: `${f.left}px`, top: `${f.top}px`, width: `${p.rect.w}px`, height: `${p.rect.h}px`,
        borderRadius: '7px', background: p.color, opacity: '0', pointerEvents: 'none', zIndex: '9', mixBlendMode: 'screen',
    } as Partial<CSSStyleDeclaration>);
    s.mount(el);
    s.animate(el, [{ opacity: 0 }, { opacity: 0.55 }, { opacity: 0 }],
        { duration: 240, delay: (p.delay ?? 0) + DURATION.tracer - 70, fill: 'backwards', easing: 'ease-out' },
        () => el.remove());
}

// STAGE-PRESENT: the shared "fly out → present grown at a stage point (held to
// read) → land" path behind every composite play (resource, event, upgrade,
// leader deploy). Builds the two-layer clone and runs the outer's 4-keyframe
// rise→hold→land; the caller flips the inner mid-flight (the `flip` primitive)
// and hooks the landing (board shake / upgrade reveal / show the live card) via
// `onDone`. The composites themselves (a later task) pass the exact transforms.
export function stagePresent(s: Stage, p: {
    from: Snap;
    stage: Point;
    scale: number;
    to: Snap | null;
    total: number;
    arrive: number;
    depart: number;
    fadeOut: boolean;
    delay?: number;
    zIndex: number;
    onDone?: () => void;
}): { inner: HTMLElement } {
    const { outer, inner } = s.layer(p.from, p.zIndex);
    const cx = p.from.x + p.from.w / 2, cy = p.from.y + p.from.h / 2;
    const tStage = `translate(${p.stage.x - cx}px, ${p.stage.y - cy}px) scale(${p.scale})`;
    const tEnd = p.to
        ? `translate(${p.to.x + p.to.w / 2 - cx}px, ${p.to.y + p.to.h / 2 - cy}px) scale(${p.to.w / p.from.w}, ${p.to.h / p.from.h})`
        : 'translate(0,0) scale(1)';
    s.animate(outer, [
        { transform: 'translate(0,0) scale(1)', offset: 0, easing: EASING },
        { transform: tStage, offset: p.arrive, easing: 'linear' },
        { transform: tStage, offset: p.depart, easing: EASING },
        { transform: tEnd, opacity: p.fadeOut ? 0 : 1, offset: 1 },
    ], { duration: p.total, delay: p.delay ?? 0, fill: 'both' },
    () => { outer.remove(); p.onDone?.(); });
    return { inner };
}
