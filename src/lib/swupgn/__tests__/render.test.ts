import { describe, it, expect } from 'vitest';
import { render, type SwuPgnDocument } from '../index';

// Ported from forceteki test/server/swupgn/render.spec.ts "render card sides" at 950a65a82.
describe('render card sides in a mirror match (§16)', () => {
    const cards = [{ id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious' }];
    const doc = (events: unknown[]) => ({ header: {}, decks: [], setup: [], events, annotations: [], cards }) as unknown as SwuPgnDocument;
    const p = (seat: 1 | 2, leader: Record<string, unknown>) => ({ seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], leader });
    const linesOf = (out: string) => out.split('\n').map((l) => l.trim());

    // Value: protects=in a mirror match each copy of a leader is named by its own side (§16); fails_when=sides are tracked by printed id again, so one flip renames both; why_new=every side test used two different leaders; seam=none; no_claim=none beyond protects
    it('tracks each copy of a leader separately', () => {
        const out = linesOf(render(doc([
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R1.A.1a', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: { round: 2, phase: 'action', initiative: 1, players: {
                1: p(1, { id: 'TWI#017', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: true }),
                2: p(2, { id: 'TWI#017:2', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: false }),
            } } },
            { seq: 'R2.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R2.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
        ])));
        expect(out).toContain('2. Player 2 uses Chancellor Palpatine, Playing Both Sides #2');
        expect(out).toContain('3. Player 1 uses Darth Sidious');
        expect(out).toContain('1. Player 1 uses Chancellor Palpatine, Playing Both Sides');
        expect(out).toContain('2. Player 2 uses Darth Sidious #2');
    });

    // Value: protects=render() asks a resolver by base id, so one that does not strip `:N` still names a copy; fails_when=a NameResolver call passes the copy id again; why_new=every resolver in the client strips `:N` itself; seam=none; no_claim=none beyond protects
    it('asks a caller\'s resolver by base id, so one keyed by printed id still names a copy', () => {
        const byId: Record<string, string> = { 'TWI#017': 'Chancellor Palpatine' };
        const plain = linesOf(render(doc([
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.1a', t: 'LEADER_FLIP', p: 2, card: 'TWI#017:2', onStartingSide: false },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
        ]), { nameOf: (id) => byId[id] ?? id, backNameOf: (id) => (id === 'TWI#017' ? 'Darth Sidious' : undefined) }));
        expect(plain).toContain('2. Player 2 uses Darth Sidious #2');
        expect(plain).toContain('3. Player 1 uses Chancellor Palpatine');
    });
});
