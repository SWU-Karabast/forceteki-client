import { describe, it, expect } from 'vitest';
import type { GameEvent } from '@/lib/swupgn';
import { entryExhaustByFrame } from '../entryExhaust';

const ev = (over: object, seq = 'x'): GameEvent => ({ seq, ...over } as GameEvent);
const ids = (s: ReadonlySet<string>) => [...s].sort();

describe('entryExhaustByFrame', () => {
    it('marks the frames from the arrival MOVE up to (not including) the entering EXHAUST', () => {
        const events = [
            ev({ t: 'EXHAUST_RESOURCES', p: 1, amount: 2 }),
            ev({ t: 'MOVE', card: 'W', from: 'hand', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'STATS', card: 'W', power: 4, hp: 5 }),
            ev({ t: 'PLAY', p: 1, card: 'W', zone: 'ground', cost: 2 }),
            ev({ t: 'EXHAUST', card: 'W' }),
            ev({ t: 'PASS', p: 2 }),
        ];
        expect(entryExhaustByFrame(events).map(ids)).toEqual([[], ['W'], ['W'], ['W'], [], []]);
    });

    it('leaves a unit the file never exhausts alone (enters-ready effects, a deployed leader)', () => {
        const events = [
            ev({ t: 'MOVE', card: 'R', from: 'hand', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'PLAY', p: 1, card: 'R' }),
            ev({ t: 'MOVE', card: 'L', from: 'base', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'DEPLOY_LEADER', p: 1, card: 'L' }),
            ev({ t: 'PASS', p: 2 }),
        ];
        expect(entryExhaustByFrame(events).every((s) => s.size === 0)).toBe(true);
    });

    it('stops at a READY, a departure, a phase or round boundary, and never crosses to another unit\'s EXHAUST', () => {
        const events = [
            ev({ t: 'MOVE', card: 'A', from: 'hand', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'READY', card: 'A' }),
            ev({ t: 'EXHAUST', card: 'A' }), // an attack later, not the entry
            ev({ t: 'MOVE', card: 'B', from: 'hand', to: 'space', p: 1, kind: 'unit' }),
            ev({ t: 'PHASE_START', phase: 'regroup' }),
            ev({ t: 'EXHAUST', card: 'B' }),
            ev({ t: 'MOVE', card: 'C', from: 'outsideTheGame', to: 'ground', p: 2, kind: 'unit' }),
            ev({ t: 'MOVE', card: 'C', from: 'ground', to: 'discard', p: 2, kind: 'unit' }),
            ev({ t: 'EXHAUST', card: 'C' }),
            ev({ t: 'MOVE', card: 'D', from: 'hand', to: 'ground', p: 2, kind: 'unit' }),
            ev({ t: 'EXHAUST', card: 'E' }),
        ];
        expect(entryExhaustByFrame(events).every((s) => s.size === 0)).toBe(true);
    });

    it('ignores upgrade moves, moves between arenas, and hostile lines', () => {
        const events = [
            null,
            ev({ t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'W' }),
            ev({ t: 'MOVE', card: 'W', from: 'ground', to: 'space', p: 1, kind: 'unit' }),
            ev({ t: 'EXHAUST', card: 'U' }),
            ev({ t: 'EXHAUST', card: 'W' }),
        ] as unknown as GameEvent[];
        expect(entryExhaustByFrame(events).every((s) => s.size === 0)).toBe(true);
    });

    it('a rescued unit and a created token unit come in exhausted too', () => {
        const events = [
            ev({ t: 'MOVE', card: 'X', from: 'capture', to: 'ground', p: 2, kind: 'unit' }),
            ev({ t: 'RESCUE', p: 2, card: 'X' }),
            ev({ t: 'EXHAUST', card: 'X' }),
            ev({ t: 'MOVE', card: 'TOKEN:battle-droid#1', from: 'outsideTheGame', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'CREATE_TOKEN', p: 1, token: 'TOKEN:battle-droid#1', zone: 'ground', kind: 'unit' }),
            ev({ t: 'EXHAUST', card: 'TOKEN:battle-droid#1' }),
        ];
        expect(entryExhaustByFrame(events).map(ids)).toEqual([['X'], ['X'], [], ['TOKEN:battle-droid#1'], ['TOKEN:battle-droid#1'], []]);
    });
});
