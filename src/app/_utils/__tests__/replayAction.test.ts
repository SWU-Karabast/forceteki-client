import { describe, it, expect } from 'vitest';
import { frameAction, storyName } from '../replayAction';
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
        expect(a.label).toBe('JTL#018 uses an ability');
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
        expect(base.label).toBe('Player 1 attacks Player 2\'s base with U1');
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

    it('names drawn and discarded cards the way the story does (spec §16)', () => {
        expect(frameAction({ seq: '1', t: 'DRAW', p: 1, count: 1, cards: ['a'] } as GameEvent, n).label).toBe('Player 1 draws 1: a');
        expect(frameAction({ seq: '1', t: 'DRAW', p: 1, count: 2, cards: [] } as GameEvent, n).label).toBe('Player 1 draws 2');
        expect(frameAction({ seq: '1', t: 'DISCARD', p: 2, cards: ['a', 'b'] } as GameEvent, n).label).toBe('Player 2 discards a, b');
    });

    it('returns an empty action for a non-noteworthy event and for undefined', () => {
        expect(frameAction({ seq: '1', t: 'READY', card: 'X' } as GameEvent, n).label).toBe('');
        expect(frameAction(undefined, n)).toEqual({ label: '', highlight: [], kind: 'none' });
    });

    it('words every narrated event per the §16 table, and prints nothing for mechanism', () => {
        const ev = (e: object) => frameAction({ seq: '1', ...e } as GameEvent, n);
        expect(ev({ t: 'PLAY', p: 1, card: 'W', zone: 'ground', cost: 2 }).label).toBe('Player 1 plays W to ground (cost 2)');
        expect(ev({ t: 'PLAY_UPGRADE', p: 1, card: 'C', target: 'W', cost: 2 }).label).toBe('Player 1 plays C on W (cost 2)');
        expect(ev({ t: 'PLAY_EVENT', p: 2, card: 'E', zone: 'discard', cost: 1 }).label).toBe('Player 2 plays E (cost 1)');
        const pilot = ev({ t: 'DEPLOY_LEADER', p: 1, card: 'L', kind: 'upgrade', target: 'V', epic: true });
        expect(pilot.label).toBe('Player 1 deploys L as a pilot on V');
        expect(pilot.highlight).toEqual(['L', 'V']);
        expect(ev({ t: 'DAMAGE', src: 'W', tgt: 'base@2', amt: 4, damageType: 'combat', hp: 26 }).label).toBe('4 damage to Player 2\'s base — 26 HP left');
        expect(ev({ t: 'DAMAGE', src: 'W', tgt: 'U', amt: 1, damageType: 'combat', hp: 2 }).highlight).toEqual(['U']);
        expect(ev({ t: 'OVERWHELM', p: 1, tgt: 'base@2', amt: 2, hp: 20 }).label).toBe('2 Overwhelm damage to Player 2\'s base — 20 HP left');
        expect(ev({ t: 'HEAL', tgt: 'U', amt: 2, hp: 5 }).label).toBe('2 healed on U — 5 HP left');
        expect(ev({ t: 'DEFEAT', card: 'U', reason: 'damage', defeatedBy: 'W' }).label).toBe('U is defeated by W');
        expect(ev({ t: 'TRIGGER', card: 'U' }).label).toBe('U triggers');
        expect(ev({ t: 'STATUS_TOKEN', card: 'U', token: 'advantage', count: -1 }).label).toBe('U loses 1 advantage');
        expect(ev({ t: 'SHIELD_GAIN', card: 'U' }).label).toBe('U gains 1 shield');
        expect(ev({ t: 'SHIELD_USE', card: 'U', count: 2 }).label).toBe('U loses 2 shield');
        expect(ev({ t: 'EXPERIENCE_GAIN', card: 'U', count: 1 }).label).toBe('U gains 1 experience');
        expect(ev({ t: 'RESOURCE', p: 1, card: 'X' }).label).toBe('Player 1 resources X');
        expect(ev({ t: 'REVEAL', p: 1, zone: 'deck', cards: ['a'] }).label).toBe('Player 1 reveals a');
        expect(ev({ t: 'SEARCH', p: 1 }).label).toBe('Player 1 searches their deck');
        expect(ev({ t: 'SEARCH', p: 1, found: ['a', 'b'] }).label).toBe('Player 1 searches, finds a, b');
        expect(ev({ t: 'CREATE_TOKEN', p: 2, token: 'TOKEN:battle-droid#1', zone: 'ground' }).label).toBe('Player 2 creates TOKEN:battle-droid#1 in ground');
        const cap = ev({ t: 'CAPTURE', p: 1, card: 'U', by: 'W' });
        expect(cap.label).toBe('Player 1 captures U with W');
        expect(cap.highlight).toEqual(['W']);
        expect(ev({ t: 'CAPTURE', p: 1, card: 'U', by: 'base@1' }).highlight).toEqual([]);
        expect(ev({ t: 'RESCUE', p: 2, card: 'U' }).label).toBe('Player 2 rescues U');
        expect(ev({ t: 'TAKE_CONTROL', p: 2, card: 'U', zone: 'ground' }).label).toBe('Player 2 takes control of U');
        expect(ev({ t: 'MULLIGAN', p: 1 }).label).toBe('Player 1 mulligans');
        expect(ev({ t: 'KEEP_HAND', p: 2 }).label).toBe('Player 2 keeps their hand');
        expect(ev({ t: 'CLAIM_INITIATIVE', p: 2 }).label).toBe('Player 2 claims initiative');
        expect(ev({ t: 'GAME_END', winner: 'Draw', reason: 'timeout' }).label).toBe('Game ends in a draw — timeout');
        expect(ev({ t: 'GAME_END', winner: 2, reason: 'concede' }).label).toBe('Player 2 wins — concede');
        for (const t of ['EXHAUST', 'READY', 'STATS', 'CHOICE', 'MODAL_CHOICE', 'SHUFFLE', 'PHASE_START', 'PHASE_END', 'ROUND_START', 'ROUND_END', 'EXHAUST_RESOURCES', 'READY_RESOURCES']) {
            expect(ev({ t, p: 1, card: 'U', amount: 1, phase: 'action', round: 1, power: 1, hp: 1, offered: [], chose: 0 }).label, t).toBe('');
        }
        expect(ev({ t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1 }).label).toBe('');
        expect(ev({ t: 'FUTURE' }).label).toBe('');
        expect(frameAction(null as unknown as GameEvent, n).kind).toBe('none');
    });

    it('storyName keeps the copy number and names a base (spec §16 nm())', () => {
        const names: NameResolver = { nameOf: (id) => (id.startsWith('SOR#108') ? 'Wampa' : id) };
        expect(storyName('SOR#108', names)).toBe('Wampa');
        expect(storyName('SOR#108:2', names)).toBe('Wampa #2');
        expect(storyName('base@2', names)).toBe('Player 2\'s base');
        expect(storyName('Opponent', names)).toBe('Opponent');
    });
});
