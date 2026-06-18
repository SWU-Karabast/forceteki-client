import { describe, it, expect } from 'vitest';
import { frameAction } from '../replayAction';
import type { GameEvent, NameResolver } from '@/lib/swupgn';

// Resolver that just echoes the id, so labels are deterministic without card data.
const n: NameResolver = { nameOf: (id: string) => id };

describe('frameAction', () => {
    it('describes a play and highlights the played card', () => {
        const a = frameAction({ seq: '1', t: 'PLAY', p: 1, card: 'AAA#001' } as GameEvent, n);
        expect(a.label).toBe('Player 1 plays AAA#001');
        expect(a.highlight).toEqual(['AAA#001']);
        expect(a.kind).toBe('play');
    });

    it('surfaces a leader ability activation (the "leader uses action" signal)', () => {
        const a = frameAction({ seq: '1', t: 'ABILITY_ACTIVATE', p: 2, card: 'JTL#018' } as GameEvent, n);
        expect(a.label).toBe('Player 2 uses JTL#018\'s ability');
        expect(a.highlight).toEqual(['JTL#018']);
        expect(a.kind).toBe('ability');
    });

    it('describes a deploy', () => {
        const a = frameAction({ seq: '1', t: 'DEPLOY_LEADER', p: 1, card: 'JTL#018', zone: 'space' } as GameEvent, n);
        expect(a.label).toBe('Player 1 deploys JTL#018');
        expect(a.kind).toBe('deploy');
    });

    it('attack vs base highlights only the attacker; vs a unit highlights both', () => {
        const base = frameAction({ seq: '1', t: 'ATTACK', p: 1, atk: 'U1', def: 'base@2', defenderType: 'base' } as GameEvent, n);
        expect(base.label).toBe('Player 1 attacks base with U1');
        expect(base.highlight).toEqual(['U1']);
        const unit = frameAction({ seq: '1', t: 'ATTACK', p: 1, atk: 'U1', def: 'U2', defenderType: 'unit' } as GameEvent, n);
        expect(unit.highlight).toEqual(['U1', 'U2']);
    });

    it('describes resourcing via a hand->resource MOVE, with no highlight (face-down pile)', () => {
        const a = frameAction({ seq: '1', t: 'MOVE', p: 1, card: 'X#1', from: 'hand', to: 'resource' } as GameEvent, n);
        expect(a.label).toBe('Player 1 resources X#1');
        expect(a.highlight).toEqual([]);
        expect(a.kind).toBe('resource');
    });

    it('pluralizes draw and discard counts', () => {
        expect(frameAction({ seq: '1', t: 'DRAW', p: 1, count: 1, cards: ['a'] } as GameEvent, n).label).toBe('Player 1 draws 1 card');
        expect(frameAction({ seq: '1', t: 'DRAW', p: 1, count: 2, cards: ['a', 'b'] } as GameEvent, n).label).toBe('Player 1 draws 2 cards');
        expect(frameAction({ seq: '1', t: 'DISCARD', p: 2, cards: ['a', 'b'] } as GameEvent, n).label).toBe('Player 2 discards 2 cards');
    });

    it('returns an empty action for a non-noteworthy event and for undefined', () => {
        expect(frameAction({ seq: '1', t: 'READY', card: 'X' } as GameEvent, n).label).toBe('');
        expect(frameAction(undefined, n)).toEqual({ label: '', highlight: [], kind: 'none' });
    });
});
