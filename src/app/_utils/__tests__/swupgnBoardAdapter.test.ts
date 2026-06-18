import { describe, it, expect } from 'vitest';
import { cardFromId, cardFromInstance, ZONE_MAP, adaptState, deckOrderLengths } from '../swupgnBoardAdapter';
import { parse, stateAt } from '@/lib/swupgn';
import { readFileSync } from 'fs';
import path from 'path';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);

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

describe('adaptState (full assembly)', () => {
    const doc = parse(SAMPLE);
    const decks = deckOrderLengths(doc);
    // R1.G.3 is after P1's regroup draw. ps.hand[] and ps.handSize are both MOVE-driven,
    // so they agree; the assertion uses ps.hand.length to stay independent of the count.
    const reduced = stateAt(doc.events, 'R1.G.3');
    const gs = adaptState(reduced, doc, decks, { 1: 'p1', 2: 'p2' });

    it('keys players by playerId', () => {
        expect(Object.keys(gs.players)).toEqual(['p1', 'p2']);
    });

    it('puts hand cards in cardPiles.hand with parsed setIds', () => {
        const p1 = reduced.players[1]!;
        expect(gs.players.p1.cardPiles.hand.length).toBe(p1.hand.length);
        expect(gs.players.p1.cardPiles.hand[0].setId.set).toBeDefined();
    });

    it('renders resources as a face-down stack sized by ready+exhausted', () => {
        const p1 = reduced.players[1]!;
        expect(gs.players.p1.cardPiles.resources.length)
            .toBe(p1.resourcesReady + p1.resourcesExhausted);
        expect(gs.players.p1.availableResources).toBe(p1.resourcesReady);
    });

    it('derives a non-negative deck count', () => {
        expect(gs.players.p1.numCardsInDeck).toBeGreaterThanOrEqual(0);
    });

    it('maps phase and initiative', () => {
        expect(typeof gs.phase).toBe('string');
        expect(typeof gs.initiativeClaimed).toBe('boolean');
    });

    it('fills leader and base from the header', () => {
        expect(gs.players.p1.leader.setId).toEqual({ set: 'SOR', number: 10 }); // P1Leader SOR#010
        expect(gs.players.p1.base.setId).toEqual({ set: 'SOR', number: 27 });   // P1Base SOR#027
    });

    it('provides a promptState object (board reads promptState.* unguarded)', () => {
        // LeaderBaseCard/GameCard read players[x].promptState.distributeAmongTargets
        // without null-checking promptState — it must exist or the board throws.
        expect(gs.players.p1.promptState).toBeDefined();
        expect(gs.players.p2.promptState).toBeDefined();
    });
});
