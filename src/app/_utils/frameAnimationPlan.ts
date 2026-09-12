// The PURE planning layer of the replay beat animator: measured rects (before +
// after) plus the beat's typed `Transition`s decide WHAT to animate, as a list of
// typed `Intent`s. No DOM, no WAAPI, no timers -- the overlay renderer turns each
// intent into a `Stage` primitive call. Ported from karabuddy's
// app/(app)/r/[slug]/frameAnimationPlan.ts (same author): the geometry helpers
// (`center`, `dist`, MOVE_THRESHOLD, the 62%-toward-the-opponent base stage, the
// side-by-side resource lineup, the hidden-placeholder pool) carry over verbatim,
// while everything that reconciled log text against a board diff is gone -- our
// transitions already say what happened.
import type { Seat } from '@/lib/swupgn';
import type { Point, Snap } from './animPrimitives';
import { DURATION } from './replayTiming';
import type { Transition } from './replayTransitions';

export type Snapshot = Map<string, Snap>;

export interface PlanInput {
    prev: Snapshot;
    next: Snapshot;
    transitions: Transition[];
    bottomSeat: Seat;                                   // the perspective player sits at the bottom
    piles: { resource: Record<Seat, Snap | null>; discard: Record<Seat, Snap | null> };
    bases: Record<Seat, Snap | null>;
    hidden: Record<Seat, Snap[]>;                       // face-down hand placeholders, in DOM order
    arenaBand: { top: number; bottom: number };         // a rect centred outside the band is a tray rect
}

export type Intent =
    | { type: 'move'; uuid: string; from: Snap; to: Snap; delay: number }
    | { type: 'enter'; uuid: string; delay: number }
    | { type: 'exit'; uuid: string; rect: Snap; delay: number }
    | { type: 'playFlip'; uuid: string; from: Snap; to: Snap; faceDown: boolean }
    | { type: 'lunge'; uuid: string; from: Snap; to: Snap; delay: number }
    | { type: 'shake'; uuid: string; amplitude: number; delay: number }
    | { type: 'tracer'; from: Point; to: Point; color: string; delay: number }
    | { type: 'flash'; rect: Snap; color: string; delay: number }
    | { type: 'eventStage'; uuid: string; from: Snap; to: Snap | null; stage: Point; faceDown: boolean }
    | { type: 'upgradeStage'; uuid: string; from: Snap; unit: Snap; stage: Point; faceDown: boolean }
    | { type: 'resourceStage'; uuid: string; from: Snap; pile: Snap; stage: Point; faceDown: boolean }
    | { type: 'leaderDeploy'; uuid: string; from: Snap; to: Snap; stage: Point };

/** px of POSITION change that counts as a real move (ignores size-only grid reflows). */
export const MOVE_THRESHOLD = 8;
const DAMAGE_COLOR = '#ff5a4d';
const HEAL_COLOR = '#46d27a';
const DEFEAT_COLOR = '#17171d';

/** A defeat triggered by an attack lands mid-lunge; a shake lands a hair earlier. */
const STRIKE = Math.round(DURATION.lunge * 0.45);
const IMPACT = Math.round(DURATION.lunge * 0.42);

/** Transitions whose seat is the seat ACTING this beat (a defeat's seat is the victim's owner). */
const ACTING = new Set<Transition['kind']>(['play', 'upgrade', 'event', 'leaderDeploy', 'attack', 'resource']);

type Of<K extends Transition['kind']> = Extract<Transition, { kind: K }>;

const center = (s: Snap): Point => ({ x: s.x + s.w / 2, y: s.y + s.h / 2 });
const dist = (a: Snap, b: Snap) => Math.hypot(a.x - b.x, a.y - b.y);
const other = (s: Seat): Seat => (s === 1 ? 2 : 1);

export function planBeat(input: PlanInput): Intent[] {
    const { prev, next, transitions, bottomSeat, piles, bases, arenaBand } = input;
    // Face-down hand placeholders are consumed in DOM order: a second hidden play
    // in the same beat takes the next one. Copied so the input stays untouched.
    const pool: Record<Seat, Snap[]> = { 1: [...input.hidden[1]], 2: [...input.hidden[2]] };
    // Rule 13: one intent owns a card's visual per beat -- the move/enter/exit
    // sweeps skip everything a play/stage/lunge/exit already claimed.
    const owned = new Set<string>();
    // Attackers that actually got a lunge intent pushed (rect(s) resolved below) -- the
    // defeat case below only skips an exit for these; an attack transition whose lunge was
    // skipped (missing attacker/defender rect) must not be assumed to own the corpse's fade.
    const lunged = new Set<string>();
    // Rule 14: enters/plays, then lunges/bolts, then exits, then moves.
    const plays: Intent[] = [];
    const fx: Intent[] = [];
    const exits: Intent[] = [];
    const moves: Intent[] = [];

    const rect = (uuid: string) => prev.get(uuid) ?? next.get(uuid);
    const isTray = (s: Snap) => s.y + s.h / 2 < arenaBand.top || s.y + s.h / 2 > arenaBand.bottom;
    // A card leaving a hand: our own hand shows it (a prev rect), the opponent's is
    // a face-down placeholder off the pool.
    const fromHand = (card: string, seat: Seat): { from: Snap; faceDown: boolean } | null => {
        const own = prev.get(card);
        if (own) return { from: own, faceDown: false };
        const hidden = pool[seat].shift();
        return hidden ? { from: hidden, faceDown: true } : null;
    };
    // The event stage point: 62% of the way from the caster's base to the other one
    // ("presented" across the table).
    const baseStage = (seat: Seat): Point | null => {
        const own = bases[seat], opp = bases[other(seat)];
        if (!own || !opp) return null;
        const o = center(own), t = center(opp);
        return { x: o.x + (t.x - o.x) * 0.62, y: o.y + (t.y - o.y) * 0.62 };
    };

    /** Present toward the board interior: up for the perspective player, down for the opponent. */
    const lift = (seat: Seat) => (seat === bottomSeat ? -1 : 1);

    const attacks = transitions.filter((t): t is Of<'attack'> => t.kind === 'attack');
    const bolts = transitions.filter((t): t is Of<'damage'> => t.kind === 'damage');
    // The bolt source of last resort (rules 5, 7, 8): PlanInput carries no seat ->
    // leader map, so an unattributable bolt leaves from the acting seat's base.
    const acting = transitions.find((t) => ACTING.has(t.kind));
    const actorSeat = acting && 'seat' in acting ? acting.seat : undefined;

    for (const t of transitions) {
        switch (t.kind) {
            // Rules 2 + 3: a token materializes in place; anything else flies from the
            // hand (face-up from ours, face-down from theirs) into its slot.
            case 'play': {
                if (t.token) { owned.add(t.card); plays.push({ type: 'enter', uuid: t.card, delay: 0 }); break; }
                const src = fromHand(t.card, t.seat);
                const to = next.get(t.card);
                if (!src || !to) break;
                owned.add(t.card);
                plays.push({ type: 'playFlip', uuid: t.card, from: src.from, to, faceDown: src.faceDown });
                break;
            }
            // Rule 10: present above the host, then tuck under it (an upgrade renders
            // only as the host's strip, so it has no rect of its own).
            case 'upgrade': {
                const unit = next.get(t.host) ?? prev.get(t.host);
                const src = unit ? fromHand(t.card, t.seat) : null;
                if (!unit || !src) break;
                owned.add(t.card);
                plays.push({ type: 'upgradeStage', uuid: t.card, from: src.from, unit, stage: { x: center(unit).x, y: center(unit).y - unit.h * 0.7 }, faceDown: src.faceDown });
                break;
            }
            // Rule 9: present at the stage point, then drop to the discard pile.
            case 'event': {
                const src = fromHand(t.card, t.seat);
                if (!src) break;
                owned.add(t.card);
                plays.push({ type: 'eventStage', uuid: t.card, from: src.from, to: piles.discard[t.seat], stage: baseStage(t.seat) ?? center(src.from), faceDown: src.faceDown });
                break;
            }
            // Rule 12: raise off the leader slot, present midway, land in the arena --
            // or, for a pilot, tuck onto the host like an upgrade.
            case 'leaderDeploy': {
                const from = prev.get(t.card);
                if (!from) break;
                const unit = t.pilotHost ? next.get(t.pilotHost) ?? prev.get(t.pilotHost) : undefined;
                if (t.pilotHost) {
                    if (!unit) break;
                    owned.add(t.card);
                    plays.push({ type: 'upgradeStage', uuid: t.card, from, unit, stage: { x: center(unit).x, y: center(unit).y - unit.h * 0.7 }, faceDown: false });
                    break;
                }
                const to = next.get(t.card);
                if (!to) break;
                owned.add(t.card);
                const f = center(from), n = center(to);
                plays.push({ type: 'leaderDeploy', uuid: t.card, from, to, stage: { x: (f.x + n.x) / 2, y: (f.y + n.y) / 2 + lift(t.seat) * Math.max(from.h, to.h) * 1.35 } });
                break;
            }
            // Rule 4: the lunge OWNS the attacker's visual (even when it trades and
            // dies -- then it lunges a clone). A base defender shakes off its baseHit
            // instead, with the damage for an amplitude (rule 6).
            case 'attack': {
                const a = rect(t.atk);
                const d = t.defenderType === 'base' ? bases[other(t.seat)] ?? rect(t.def) : rect(t.def);
                if (!a || !d) break;
                owned.add(t.atk);
                lunged.add(t.atk);
                fx.push({ type: 'lunge', uuid: t.atk, from: a, to: d, delay: 0 });
                if (t.survived && t.defenderType === 'unit') fx.push({ type: 'shake', uuid: t.def, amplitude: 7, delay: IMPACT });
                break;
            }
            // Rule 5: a bolt from its source (or the acting seat's base), a flash on
            // the spot it struck, and a recoil if the target lived. Every intent's
            // `delay` is when the effect is SCHEDULED, so the flash carries the bolt's
            // delay -- the `flash` primitive owns the `DURATION.tracer - 70` offset that
            // lands the wash as the bolt connects.
            case 'damage': {
                const tgt = rect(t.tgt);
                if (!tgt) break;
                const src = (t.src ? rect(t.src) : null) ?? (actorSeat ? bases[actorSeat] : null);
                if (src) fx.push({ type: 'tracer', from: center(src), to: center(tgt), color: DAMAGE_COLOR, delay: 0 });
                fx.push({ type: 'flash', rect: tgt, color: DAMAGE_COLOR, delay: 0 });
                if (t.survived) fx.push({ type: 'shake', uuid: t.tgt, amplitude: 7, delay: DURATION.tracer });
                break;
            }
            // Rule 6: the base recoils by how hard it was hit -- on the strike when a
            // lunge put it there.
            case 'baseHit':
                fx.push({ type: 'shake', uuid: `base@${t.seat}`, amplitude: Math.min(18, t.amt * 1.5 + 0.5), delay: attacks.length ? IMPACT : 0 });
                break;
            // Rule 7.
            case 'heal': {
                const tgt = rect(t.tgt);
                const src = actorSeat ? bases[actorSeat] : null;
                if (tgt && src) fx.push({ type: 'tracer', from: center(src), to: center(tgt), color: HEAL_COLOR, delay: 0 });
                break;
            }
            // Rule 8: the corpse fades when the thing that killed it lands -- mid-lunge
            // for combat, on the bolt for damage or an ability (which fires its own dark
            // bolt). A defeated ATTACKER has no exit: its lunge already owns it.
            case 'defeat': {
                const from = prev.get(t.card) ?? next.get(t.card);
                if (!from) break;
                owned.add(t.card);
                const by = t.reason === 'ability' && t.by ? rect(t.by) ?? bases[actorSeat ?? other(t.seat)] : null;
                if (by) fx.push({ type: 'tracer', from: center(by), to: center(from), color: DEFEAT_COLOR, delay: 0 });
                const delay = attacks.some((a) => a.def === t.card) ? STRIKE
                    : bolts.some((b) => b.tgt === t.card) || by ? DURATION.tracer : 0;
                if (!lunged.has(t.card)) exits.push({ type: 'exit', uuid: t.card, rect: from, delay });
                break;
            }
            // Rule 11, grouped below (cards committed together line up side by side).
            default: break;
        }
    }

    // Rule 11: the beat's resource commits present at a shared lineup lifted toward
    // the board interior, then drop into the seat's pile.
    for (const seat of [1, 2] as Seat[]) {
        const items: { uuid: string; from: Snap; faceDown: boolean }[] = [];
        for (const t of transitions) {
            if (t.kind !== 'resource' || t.seat !== seat) continue;
            const src = fromHand(t.card, seat);
            if (!src) continue;
            owned.add(t.card);
            items.push({ uuid: t.card, ...src });
        }
        const pile = piles.resource[seat];
        if (!items.length || !pile) continue;
        const pc = center(pile);
        const avgX = items.reduce((s, i) => s + center(i.from).x, 0) / items.length;
        const avgY = items.reduce((s, i) => s + center(i.from).y, 0) / items.length;
        const spacing = items[0].from.w * 2;
        const x0 = (avgX + pc.x) / 2;
        const y = avgY + lift(seat) * Math.max(...items.map((i) => i.from.h)) * 1.3;
        items.forEach((it, k) => plays.push({
            type: 'resourceStage', uuid: it.uuid, from: it.from, pile,
            stage: { x: x0 + (k - (items.length - 1) / 2) * spacing, y }, faceDown: it.faceDown,
        }));
    }

    // Rules 1 + 13: what the transitions didn't claim. An arena reflow animates (a
    // survivor sliding into a defeated unit's slot); a tray reflow (the hand
    // re-centering) never does.
    for (const [uuid, n] of next) {
        if (owned.has(uuid)) continue;
        const o = prev.get(uuid);
        if (!o) { plays.push({ type: 'enter', uuid, delay: 0 }); continue; }
        if (isTray(o) && isTray(n)) continue;
        if (dist(n, o) <= MOVE_THRESHOLD) continue;
        moves.push({ type: 'move', uuid, from: o, to: n, delay: 0 });
    }
    for (const [uuid, o] of prev) {
        if (next.has(uuid) || owned.has(uuid)) continue;
        exits.push({ type: 'exit', uuid, rect: o, delay: 0 });
    }

    return [...plays, ...fx, ...exits, ...moves];
}
