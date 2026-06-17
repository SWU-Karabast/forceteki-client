import { describe, it, expect } from 'vitest';
import { cardFromId, cardFromInstance, ZONE_MAP } from '../swupgnBoardAdapter';

describe('cardFromId', () => {
    it('parses SET#NUM into setId and assigns owner/zone', () => {
        const c = cardFromId('SOR#010', 'groundArena', 'p1', 'p1');
        expect(c.setId).toEqual({ set: 'SOR', number: 10 });
        expect(c.uuid).toBe('SOR#010');
        expect(c.zone).toBe('groundArena');
        expect(c.controllerId).toBe('p1');
        expect(c.ownerId).toBe('p1');
    });

    it('strips the :copy suffix for setId but keeps it in uuid (instance identity)', () => {
        const c = cardFromId('SHD#257:3', 'hand', 'p2', 'p2');
        expect(c.setId).toEqual({ set: 'SHD', number: 257 });
        expect(c.uuid).toBe('SHD#257:3');
    });
});

describe('cardFromInstance', () => {
    it('carries damage/exhausted and maps the zone', () => {
        const inst = { id: 'SOR#178', zone: 'ground', damage: 2, exhausted: true,
            upgrades: [], shields: 1, experience: 0, statusTokens: {} };
        const c = cardFromInstance(inst, 'p1');
        expect(c.zone).toBe(ZONE_MAP.ground);
        expect(c.damage).toBe(2);
        expect(c.exhausted).toBe(true);
    });
});
