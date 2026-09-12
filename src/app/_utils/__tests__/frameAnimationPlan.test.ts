import { describe, it, expect } from 'vitest';
import { planBeat, type PlanInput } from '../frameAnimationPlan';
import type { Snap } from '../animPrimitives';
import { DURATION } from '../replayTiming';

const r = (x: number, y: number, html = 'x'): Snap => ({ x, y, w: 100, h: 140, html });
const base = (): PlanInput => ({
    prev: new Map(), next: new Map(), transitions: [], bottomSeat: 1,
    piles: { resource: { 1: r(0, 800), 2: r(0, 0) }, discard: { 1: r(1300, 800), 2: r(1300, 0) } },
    bases: { 1: r(600, 600, 'base1'), 2: r(600, 200, 'base2') },
    hidden: { 1: [], 2: [r(500, 20, 'back'), r(560, 20, 'back')] },
    arenaBand: { top: 180, bottom: 700 },
});

describe('planBeat', () => {
    it('a play from the perspective hand flies face-up to its slot', () => {
        const i = base();
        i.prev.set('ASH#056', r(500, 820, 'front')); i.next.set('ASH#056', r(900, 500, 'front'));
        i.transitions = [{ kind: 'play', card: 'ASH#056', seat: 1, to: 'groundArena', token: false }];
        expect(planBeat(i)).toEqual([{ type: 'playFlip', uuid: 'ASH#056', from: r(500, 820, 'front'), to: r(900, 500, 'front'), faceDown: false }]);
    });
    it('a play from the opponent hand takes a face-down placeholder as its origin', () => {
        const i = base();
        i.next.set('LAW#159', r(900, 250, 'front'));
        i.transitions = [{ kind: 'play', card: 'LAW#159', seat: 2, to: 'groundArena', token: false }];
        expect(planBeat(i)).toEqual([{ type: 'playFlip', uuid: 'LAW#159', from: r(500, 20, 'back'), to: r(900, 250, 'front'), faceDown: true }]);
    });
    it('an attack lunges, shakes a survivor, and delays the loser\'s exit to the strike', () => {
        const i = base();
        i.prev.set('A', r(900, 500)); i.next.set('A', r(900, 500));
        i.prev.set('B', r(900, 250)); i.next.set('B', r(900, 250));
        i.transitions = [{ kind: 'attack', atk: 'A', def: 'B', seat: 1, defenderType: 'unit', survived: true }];
        expect(planBeat(i)).toEqual([
            { type: 'lunge', uuid: 'A', from: r(900, 500), to: r(900, 250), delay: 0 },
            { type: 'shake', uuid: 'B', amplitude: 7, delay: Math.round(DURATION.lunge * 0.42) },
        ]);
        const j = base();
        j.prev.set('A', r(900, 500)); j.next.set('A', r(900, 500)); j.prev.set('B', r(900, 250));
        j.transitions = [
            { kind: 'attack', atk: 'A', def: 'B', seat: 1, defenderType: 'unit', survived: false },
            { kind: 'defeat', card: 'B', seat: 2, reason: 'combat', by: 'A' },
        ];
        expect(planBeat(j)).toEqual([
            { type: 'lunge', uuid: 'A', from: r(900, 500), to: r(900, 250), delay: 0 },
            { type: 'exit', uuid: 'B', rect: r(900, 250), delay: Math.round(DURATION.lunge * 0.45) },
        ]);
    });
    it('a base attack lunges at the base and shakes it by the damage', () => {
        const i = base();
        i.prev.set('A', r(900, 500)); i.next.set('A', r(900, 500));
        i.prev.set('base@2', r(600, 200, 'base2')); i.next.set('base@2', r(600, 200, 'base2'));
        i.transitions = [
            { kind: 'attack', atk: 'A', def: 'base@2', seat: 1, defenderType: 'base', survived: true },
            { kind: 'baseHit', seat: 2, amt: 5, hp: 25 },
        ];
        expect(planBeat(i)).toEqual([
            { type: 'lunge', uuid: 'A', from: r(900, 500), to: r(600, 200, 'base2'), delay: 0 },
            { type: 'shake', uuid: 'base@2', amplitude: 8, delay: Math.round(DURATION.lunge * 0.42) },
        ]);
    });
    it('a damage bolt streaks from its source, flashes the target, and recoils a survivor', () => {
        const i = base();
        i.prev.set('S', r(900, 500)); i.next.set('S', r(900, 500));
        i.prev.set('T', r(900, 250)); i.next.set('T', r(900, 250));
        i.transitions = [{ kind: 'damage', src: 'S', tgt: 'T', amt: 2, hp: 3, survived: true }];
        expect(planBeat(i)).toEqual([
            { type: 'tracer', from: { x: 950, y: 570 }, to: { x: 950, y: 320 }, color: '#ff5a4d', delay: 0 },
            { type: 'flash', rect: r(900, 250), color: '#ff5a4d', delay: 0 },
            { type: 'shake', uuid: 'T', amplitude: 7, delay: DURATION.tracer },
        ]);
    });
    it('an ability defeat fires a bolt from the leader and fades the target when it lands', () => {
        const i = base();
        i.prev.set('LAW#008', r(600, 60, 'leader')); i.next.set('LAW#008', r(600, 60, 'leader'));
        i.prev.set('LAW#159', r(900, 250));
        i.transitions = [{ kind: 'defeat', card: 'LAW#159', seat: 2, reason: 'ability', by: 'LAW#008' }];
        expect(planBeat(i)).toEqual([
            { type: 'tracer', from: { x: 650, y: 130 }, to: { x: 950, y: 320 }, color: '#17171d', delay: 0 },
            { type: 'exit', uuid: 'LAW#159', rect: r(900, 250), delay: DURATION.tracer },
        ]);
    });
    it('a survivor slides into a vacated arena slot after the exit; a hand reflow does not animate', () => {
        const i = base();
        i.prev.set('C', r(1010, 500)); i.next.set('C', r(900, 500));
        i.prev.set('H', r(600, 820)); i.next.set('H', r(540, 820));
        i.transitions = [];
        expect(planBeat(i)).toEqual([{ type: 'move', uuid: 'C', from: r(1010, 500), to: r(900, 500), delay: 0 }]);
    });
    it('a resource commit presents the card lifted toward the board then drops it into the pile', () => {
        const i = base();
        i.prev.set('ASH#031', r(500, 820, 'front'));
        i.transitions = [{ kind: 'resource', card: 'ASH#031', seat: 1 }];
        const [intent] = planBeat(i);
        expect(intent.type).toBe('resourceStage');
        if (intent.type === 'resourceStage') { expect(intent.pile).toEqual(r(0, 800)); expect(intent.stage.y).toBeLessThan(820); expect(intent.faceDown).toBe(false); }
    });
});
