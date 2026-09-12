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
    board?(): HTMLElement | null; // the whole board, for the leader-deploy landing shake
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
    land: { at: Point; scale: number };   // where the clone ends up: destination CENTRE + scale
    total: number;
    arrive: number;
    depart: number;
    fadeOut: boolean;
    delay?: number;
    zIndex: number;
    shadow?: string;
    initial?: () => HTMLElement;          // the first inner face (default: the departing card)
    riseEasing?: string;
    landEasing?: string;
    onDone?: () => void;
}): { inner: HTMLElement } {
    const { outer, inner } = s.layer(p.from, p.zIndex, { shadow: p.shadow });
    inner.appendChild(p.initial ? p.initial() : s.face(p.from.html));
    const cx = p.from.x + p.from.w / 2, cy = p.from.y + p.from.h / 2;
    const tStage = `translate(${p.stage.x - cx}px, ${p.stage.y - cy}px) scale(${p.scale})`;
    const tEnd = `translate(${p.land.at.x - cx}px, ${p.land.at.y - cy}px) scale(${p.land.scale})`;
    // Opacity is carried by EVERY keyframe: named only on the last, WAAPI would
    // synthesise an implicit opacity:1 start and fade across the whole flight
    // instead of only the landing leg.
    s.animate(outer, [
        { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0, easing: p.riseEasing ?? EASING },
        { transform: tStage, opacity: 1, offset: p.arrive, easing: 'linear' },
        { transform: tStage, opacity: 1, offset: p.depart, easing: p.landEasing ?? EASING },
        { transform: tEnd, opacity: p.fadeOut ? 0 : 1, offset: 1 },
    ], { duration: p.total, delay: p.delay ?? 0, fill: 'both' },
    () => { outer.remove(); p.onDone?.(); });
    return { inner };
}

// ---------------------------------------------------------------------------
// The four COMPOSITE plays, ported from karabuddy's FrameAnimator executor
// (cases eventStage / upgradeStage / resourceStage / leaderDeploy). Each is
// `stagePresent` plus its own flip and flourishes; the scales, arrive/depart
// offsets and easings are karabuddy's. Our `Intent`s carry no card ART (the
// planner never measured any), so a reveal only happens where the beat measured
// a real face: an opponent's hidden event/upgrade stays a cardback in flight.
// ---------------------------------------------------------------------------

const RISE_EASING = 'cubic-bezier(0.3, 0, 0.2, 1)';
const LAND_EASING = 'cubic-bezier(0.5, 0, 0.7, 1)';
const CARDBACK_URL = '/card-back.png';
const EVENT_SCALE = 2.1, EVENT_ARRIVE = 0.26, EVENT_DEPART = 0.74, EVENT_FLIP_AT = 130, EVENT_FLIP_MS = 260;
const UPGRADE_SCALE = 1.7, UPGRADE_ARRIVE = 0.28, UPGRADE_DEPART = 0.66;
const RESOURCE_SCALE = 1.65, RESOURCE_ARRIVE = 0.265, RESOURCE_DEPART = 0.595, RESOURCE_FLIP_MS = 300;
const LEADER_SCALE = 2.3, LEADER_RISE_MS = 400, LEADER_HOLD_MS = 450, LEADER_FLIP_MS = 280;

const mid = (r: Snap): Point => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });

/** A pile is a single stacked box: land shrunk into it, never smaller than a quarter. */
const intoPile = (from: Snap, pile: Snap) => ({ at: mid(pile), scale: Math.max(0.25, pile.w / from.w) });

/** A fill-parent face painted from an image url: the cardback a resourced card turns
 *  to, and the card ART a hidden-hand play reveals (a face-down play has no rendered
 *  destination to clone, so the caller resolves the art url and passes it in). */
function artNode(s: Stage, url: string, backing = ''): HTMLElement {
    const n = s.node();
    Object.assign(n.style, {
        position: 'absolute', inset: '0', borderRadius: '7px', backgroundColor: backing,
        backgroundImage: `url(${url})`, backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    } as Partial<CSSStyleDeclaration>);
    return n;
}
const cardback = (s: Stage) => artNode(s, CARDBACK_URL, '#0a0c10');

// EVENT: the card flies out of the hand toward the bases, pauses grown at the
// stage point ("held above the board" to be read), then drops into the discard
// pile and fades — the pile is one stacked box, so there is no per-card render
// to hand off to.
export function eventStage(s: Stage, p: { uuid: string; from: Snap; to: Snap | null; stage: Point; faceDown: boolean; faceUp?: string }): void {
    const live = p.to ? s.findCard(p.uuid) : null;
    s.hide(live);
    const { inner } = stagePresent(s, {
        from: p.from, stage: p.stage, scale: EVENT_SCALE,
        land: p.to ? intoPile(p.from, p.to) : { at: p.stage, scale: 0.5 },
        arrive: EVENT_ARRIVE, depart: EVENT_DEPART, total: DURATION.eventPresent,
        fadeOut: true, zIndex: 12, shadow: 'drop-shadow(0 16px 26px rgba(0, 0, 0, 0.55))',
        riseEasing: RISE_EASING, landEasing: LAND_EASING,
        onDone: () => s.show(live),
    });
    // A hidden-hand play flips face-up mid-flight: the cardback becomes the card's
    // art (the discard pile is one stacked box, so it renders no face to clone).
    const build = p.faceUp ? () => artNode(s, p.faceUp!) : p.to?.html ? () => s.face(p.to!.html) : null;
    if (p.faceDown && build) flip(s, inner, { build, at: EVENT_FLIP_AT, duration: EVENT_FLIP_MS });
}

// UPGRADE: fly out of the hand, present grown above the host, then tuck UNDER it
// — the clone lands at the unit's lower edge, scaled to the unit's width, and
// fades out, handing off to the host's rendered upgrade strip beneath.
export function upgradeStage(s: Stage, p: { uuid: string; from: Snap; unit: Snap; stage: Point; faceDown: boolean; faceUp?: string }): void {
    const { inner } = stagePresent(s, {
        from: p.from, stage: p.stage, scale: UPGRADE_SCALE,
        land: { at: { x: p.unit.x + p.unit.w / 2, y: p.unit.y + p.unit.h * 0.62 }, scale: p.unit.w / p.from.w },
        arrive: UPGRADE_ARRIVE, depart: UPGRADE_DEPART, total: DURATION.upgradePresent,
        fadeOut: true, zIndex: 12, shadow: 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.55))',
        riseEasing: RISE_EASING, landEasing: LAND_EASING,
    });
    // An upgrade renders only as its host's strip, so a hidden-hand play likewise has
    // no face to clone: it flips the cardback to the card's art on the way up.
    if (p.faceDown && p.faceUp) flip(s, inner, { build: () => artNode(s, p.faceUp!), at: EVENT_FLIP_AT, duration: EVENT_FLIP_MS });
}

// RESOURCE: the card grows (presented face-up to be read), flips to its back as
// it commits — that is how a card is resourced in the physical game — then
// shrinks into the resource pile and fades. An already-face-down source (the
// opponent's hidden hand) is a cardback throughout, so it just drops.
export function resourceStage(s: Stage, p: { uuid: string; from: Snap; pile: Snap; stage: Point; faceDown: boolean }): void {
    const { inner } = stagePresent(s, {
        from: p.from, stage: p.stage, scale: RESOURCE_SCALE, land: intoPile(p.from, p.pile),
        arrive: RESOURCE_ARRIVE, depart: RESOURCE_DEPART, total: DURATION.resource,
        fadeOut: true, zIndex: 12, shadow: 'drop-shadow(0 14px 22px rgba(0, 0, 0, 0.55))',
        riseEasing: RISE_EASING, landEasing: LAND_EASING,
    });
    // The flip starts AFTER the read-hold (as the drop begins), so the face sits
    // readable through the pause.
    if (!p.faceDown) flip(s, inner, { build: () => cardback(s), at: RESOURCE_DEPART * DURATION.resource, duration: RESOURCE_FLIP_MS });
}

// LEADER DEPLOY: raise the leader off the table under a spotlight vignette,
// hold, flip to its unit side as the slam begins, and land in the arena slot —
// shaking the whole board on the landing. The deployed unit stays hidden until
// the clone lands.
export function leaderDeploy(s: Stage, p: { uuid: string; from: Snap; to: Snap; stage: Point }): void {
    const live = s.findCard(p.uuid);
    s.hide(live);
    const total = DURATION.leaderDeploy;
    // The vignette darkens the board edges as the leader rises, holds through the
    // present AND the slam, and lifts only AFTER it lands.
    const vigTotal = total + DURATION.vignette;
    const vig = s.node();
    Object.assign(vig.style, {
        position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '13', opacity: '0',
        background: 'radial-gradient(ellipse 62% 62% at 50% 45%, transparent 14%, rgba(0,0,0,0.92) 86%)',
    } as Partial<CSSStyleDeclaration>);
    s.mount(vig);
    s.animate(vig, [
        { opacity: 0, offset: 0 }, { opacity: 0.9, offset: LEADER_RISE_MS / vigTotal },
        { opacity: 0.9, offset: total / vigTotal }, { opacity: 0, offset: 1 },
    ], { duration: vigTotal, easing: 'ease-in-out' }, () => vig.remove());
    const depart = (LEADER_RISE_MS + LEADER_HOLD_MS) / total;
    const { inner } = stagePresent(s, {
        from: p.from, stage: p.stage, scale: LEADER_SCALE, land: { at: mid(p.to), scale: p.to.w / p.from.w },
        arrive: LEADER_RISE_MS / total, depart, total,
        // Only the CARD rises: the player-name plate renders inside the leader's
        // element and stays on the board, so a clone carrying it reads as a duplicate.
        initial: () => { const f = s.face(p.from.html); f.querySelectorAll('[data-leader-nameplate]').forEach((el) => el.remove()); return f; },
        fadeOut: false, zIndex: 14, shadow: 'drop-shadow(0 22px 34px rgba(0, 0, 0, 0.6))',
        riseEasing: 'cubic-bezier(0.2, 0, 0.2, 1)', landEasing: 'cubic-bezier(0.55, 0, 0.85, 0.5)',
        onDone: () => s.show(live),
    });
    flip(s, inner, { build: () => s.face(p.to.html), at: LEADER_RISE_MS + LEADER_HOLD_MS, duration: LEADER_FLIP_MS });
    // The board shake rides a `later` rather than the animation's onDone: onDone
    // also fires on a cancel, and a stepped-past deploy must not jolt the board.
    s.later(total, () => {
        const b = s.board?.();
        if (!b) return;
        s.animate(b, [
            { transform: 'translate(0, 0)' }, { transform: 'translate(-5px, 4px)' }, { transform: 'translate(5px, -3px)' },
            { transform: 'translate(-4px, 2px)' }, { transform: 'translate(3px, -1px)' }, { transform: 'translate(0, 0)' },
        ], { duration: 380, easing: 'ease-out' });
    });
}
