import { describe, it, expect } from 'vitest';
import { cardFromId, cardFromInstance, ZONE_MAP, adaptState, deckOrderLengths } from '../swupgnBoardAdapter';
import { parse, stateAt, type ReducedState, type Seat, type CardInstanceState } from '@/lib/swupgn';
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

describe('adaptState — leader state (deploy / exhaust / action highlight)', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = { header: { p1Leader: 'JTL#018', p1Base: 'JTL#026', p2Leader: 'SEC#010', p2Base: 'JTL#021' } } as any;
    const decks = { 1: 50, 2: 50 } as Record<Seat, number>;
    const ids = { 1: 'p1', 2: 'p2' } as Record<Seat, string>;
    const mkPlayer = (seat: Seat, cards: CardInstanceState[] = []) => ({
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
        resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards,
    });
    const state = (cards1: CardInstanceState[] = []): ReducedState => ({
        round: 1, phase: 'action', initiative: 1, players: { 1: mkPlayer(1, cards1), 2: mkPlayer(2) },
    });

    it('undeployed leader shows its art (zone base) and dims when exhausted', () => {
        const gs = adaptState(state(), doc, decks, ids, { leaderExhausted: { 1: true } });
        expect(gs.players.p1.leader.zone).toBe('base'); // isDeployed=false -> art renders
        expect(gs.players.p1.leader.exhausted).toBe(true); // -> Karabast dimming
        expect(gs.players.p2.leader.exhausted).toBeFalsy();
    });

    it('flags a unit as entering when its id is in enteringIds', () => {
        const unit: CardInstanceState = {
            id: 'AAA#001', zone: 'ground', damage: 0, exhausted: false, upgrades: [],
            shields: 0, experience: 0, statusTokens: {},
        };
        const gs = adaptState(state([unit]), doc, decks, ids, { enteringIds: ['AAA#001'] });
        const card = gs.players.p1.cardPiles.groundArena.find((c: { uuid: string }) => c.uuid === 'AAA#001');
        expect(card.entering).toBe(true);
        const gs2 = adaptState(state([unit]), doc, decks, ids, {});
        expect(gs2.players.p1.cardPiles.groundArena[0].entering).toBeFalsy();
    });

    it('glows the leader on its action frame', () => {
        const gs = adaptState(state(), doc, decks, ids, { highlightIds: ['JTL#018'] });
        expect(gs.players.p1.leader.selected).toBe(true);
        expect(gs.players.p2.leader.selected).toBe(false);
    });

    it('a deployed leader flips the slot to the placeholder and renders as an in-play unit', () => {
        const leaderUnit: CardInstanceState = {
            id: 'JTL#018', zone: 'space', damage: 0, exhausted: false, upgrades: [],
            shields: 0, experience: 0, statusTokens: {},
        };
        const gs = adaptState(state([leaderUnit]), doc, decks, ids, { leaderExhausted: { 1: true } });
        expect(gs.players.p1.leader.zone).not.toBe('base'); // deployed -> placeholder
        expect(gs.players.p1.leader.exhausted).toBeFalsy(); // slot not dimmed while deployed
        expect(gs.players.p1.cardPiles.spaceArena.some((c: { uuid: string }) => c.uuid === 'JTL#018')).toBe(true);
    });
});
