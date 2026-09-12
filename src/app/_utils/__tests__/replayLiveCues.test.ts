import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, foldFrames, normalizeEvents, type GameEvent, type Seat } from '@/lib/swupgn';
import { activeSeatByFrame, attackByFrame, lastPlayedByFrame } from '../replayLiveCues';
import { adaptState } from '../swupgnBoardAdapter';

const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const load = (name: string) => {
    const doc = parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));
    const events = normalizeEvents(doc.events);
    return { doc, events, frames: foldFrames(events), at: (seq: string) => events.findIndex((e) => e.seq === seq) };
};
const SEATS: Record<Seat, string> = { 1: 'P1', 2: 'P2' };

describe('activeSeatByFrame — whose action it is (the live trays\' turn aura)', () => {
    const { events, frames, at } = load('organic');
    const active = activeSeatByFrame(events, frames);

    it('opens each action phase on the initiative holder and follows the seat each record names', () => {
        expect(active[at('R2.A.start')]).toBe(frames[at('R2.A.start')].initiative);
        expect(active[at('R2.A.1')]).toBe(1);   // P1 attacks
        expect(active[at('R2.A.1a')]).toBe(1);  // the damage of that attack names no seat: still P1
        expect(active[at('R2.A.2a')]).toBe(2);  // P2 pays for a play, filed under P1's pass
        expect(active[at('R2.A.2c')]).toBe(2);  // STATS names no seat: still P2
        expect(active[at('R2.A.3')]).toBe(2);
    });

    it('is unset outside the action phase, where the trays colour by phase', () => {
        expect(active[at('R2.start')]).toBeUndefined();
        expect(active[at('R1.G.start')]).toBeUndefined();
        expect(active[0]).toBeUndefined();
    });

    it('drives isActionPhaseActivePlayer on exactly one player', () => {
        const i = at('R2.A.3');
        const gs = adaptState(frames[i], load('organic').doc, SEATS, { activeSeat: active[i] });
        expect(gs.players.P2.isActionPhaseActivePlayer).toBe(true);
        expect(gs.players.P1.isActionPhaseActivePlayer).toBe(false);
        const none = adaptState(frames[i], load('organic').doc, SEATS, {});
        expect(none.players.P1.isActionPhaseActivePlayer).toBe(false);
        expect(none.players.P2.isActionPhaseActivePlayer).toBe(false);
    });
});

describe('attackByFrame — the attack/defend arrows while an attack resolves', () => {
    const { doc, events, frames, at } = load('organic');
    const attacks = attackByFrame(events);

    it('covers the ATTACK and the consequences filed under it, not the next action', () => {
        expect(attacks[at('R2.A.1')]).toEqual({ atk: 'SOR#128:3', def: 'base@2' });
        expect(attacks[at('R2.A.1a')]).toEqual({ atk: 'SOR#128:3', def: 'base@2' });
        expect(attacks[at('R2.A.2')]).toBeUndefined();
        expect(attacks[at('R2.A.0b')]).toBeUndefined();
    });

    it('marks the attacker and the defending base on the board', () => {
        const i = at('R2.A.1a');
        const gs = adaptState(frames[i], doc, SEATS, { attack: attacks[i] });
        const atk = gs.players.P1.cardPiles.groundArena.find((c: { uuid: string }) => c.uuid === 'SOR#128:3');
        expect(atk.isAttacker).toBe(true);
        expect(gs.players.P2.base.isDefender).toBe(true);
        expect(gs.players.P1.base.isDefender).toBeUndefined();
    });

    it('marks a defending unit, and never crosses an action with a seq that is a prefix of another', () => {
        const ev = (over: object, seq: string): GameEvent => ({ seq, ...over } as GameEvent);
        const events = [
            ev({ t: 'ATTACK', p: 1, atk: 'A', def: 'B', defenderType: 'unit' }, 'R1.A.1'),
            ev({ t: 'DAMAGE', src: 'A', tgt: 'B', amt: 2, damageType: 'combat', hp: 1 }, 'R1.A.1a'),
            ev({ t: 'PASS', p: 2 }, 'R1.A.2'),
            ev({ t: 'DAMAGE', src: 'X', tgt: 'Y', amt: 1, damageType: 'ability', hp: 1 }, 'R1.A.10a'),
        ];
        const a = attackByFrame(events);
        expect(a.map((x) => x?.def)).toEqual(['B', 'B', undefined, undefined]);
        expect(() => attackByFrame([null, { t: 'ATTACK', seq: 5, atk: 'a', def: 'b' }] as unknown as GameEvent[])).not.toThrow();
    });
});

describe('lastPlayedByFrame — the card preview in the opponent tray', () => {
    const { events, at } = load('minimal');
    const last = lastPlayedByFrame(events);

    it('is nothing until the first play, then the last card played, by set id', () => {
        expect(last[at('R1.A.0b')]).toBeUndefined();
        expect(last[at('R1.A.1')]).toEqual({ set: 'SOR', number: 108 });
        expect(last[events.length - 1]).toEqual({ set: 'SOR', number: 108 });
    });

    it('ignores tokens and reaches gameState.clientUIProperties', () => {
        const ev = (over: object): GameEvent => ({ seq: 'x', ...over } as GameEvent);
        expect(lastPlayedByFrame([ev({ t: 'PLAY', p: 1, card: 'TOKEN:x#1' })])[0]).toBeUndefined();
        const { doc, frames } = load('minimal');
        expect(adaptState(frames[0], doc, SEATS, { lastPlayedCard: { set: 'SOR', number: 108 } }).clientUIProperties)
            .toEqual({ lastPlayedCard: { set: 'SOR', number: 108 } });
        expect(adaptState(frames[0], doc, SEATS, {}).clientUIProperties).toEqual({});
    });
});
