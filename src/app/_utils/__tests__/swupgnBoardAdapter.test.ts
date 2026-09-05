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

describe('token badges', () => {
    // The board draws neutral tokens (Shield/Experience/Weakness/Advantage) as count
    // badges built from a unit's subcards, which UnitsBoard groups by parentCardId.
    // The folded counters have to be materialized that way or they render as nothing.
    // (Advantage is an Ashes of the Empire token; the host set below carries no meaning.)
    const inst = (over: Partial<CardInstanceState> = {}): CardInstanceState => ({
        id: 'ASH#220', zone: 'space', damage: 0, exhausted: false,
        upgrades: [], shields: 0, experience: 0, statusTokens: {}, ...over,
    });

    const stateWith = (c: CardInstanceState): ReducedState => ({
        round: 1, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [c] },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    });

    const doc = parse(SAMPLE);
    const seats: Record<Seat, string> = { 1: 'p1', 2: 'p2' };

    it('emits one parented token card per token, in the host arena', () => {
        const gs = adaptState(
            stateWith(inst({ shields: 2, experience: 1, statusTokens: { advantage: 1 } })),
            doc, { 1: 30, 2: 30 }, seats,
        );
        const space = gs.players['p1'].cardPiles['spaceArena'];
        const tokens = space.filter((c: { parentCardId?: string }) => c.parentCardId === 'ASH#220');
        expect(tokens.map((t: { name: string }) => t.name).sort())
            .toEqual(['Advantage', 'Experience', 'Shield', 'Shield']);
        // The host itself is still a single unparented card in the arena.
        expect(space.filter((c: { parentCardId?: string }) => !c.parentCardId)).toHaveLength(1);
    });

    it('emits nothing for a unit with no tokens', () => {
        const gs = adaptState(stateWith(inst()), doc, { 1: 30, 2: 30 }, seats);
        expect(gs.players['p1'].cardPiles['spaceArena']).toHaveLength(1);
    });
});

describe('player identity for the board', () => {
    // LeaderBaseCard reads player.aspects and player.id UNGUARDED to pick the
    // Heroism/Villainy Force-token art, so both must always be present — the crash only
    // surfaces once a player actually holds the Force token.
    const doc = parse(SAMPLE);
    const seats: Record<Seat, string> = { 1: 'p1', 2: 'p2' };
    const state = stateAt(doc.events, doc.events[doc.events.length - 1].seq);

    it('always sets id and an aspects array, even with no card data loaded', () => {
        const gs = adaptState(state, doc, { 1: 30, 2: 30 }, seats);
        for (const id of ['p1', 'p2']) {
            expect(gs.players[id].id).toBe(id);
            expect(Array.isArray(gs.players[id].aspects)).toBe(true);
        }
    });

    it('unions the leader and base aspects when card data is available', () => {
        const statMap = {
            [doc.header.p1Leader]: { aspects: ['cunning', 'heroism'] },
            [doc.header.p1Base]: { aspects: ['command'] },
        };
        const gs = adaptState(state, doc, { 1: 30, 2: 30 }, seats, {}, statMap);
        expect(gs.players['p1'].aspects).toEqual(['cunning', 'heroism', 'command']);
    });
});

describe('resource pile identities', () => {
    // The fold tracks only a resource COUNT, but which card a player commits is the most
    // reviewable decision in the game, so the caller derives the ids from the
    // `hand -> resource` MOVEs and passes them in.
    const doc = parse(SAMPLE);
    const seats: Record<Seat, string> = { 1: 'p1', 2: 'p2' };
    const withResources = (n: number): ReducedState => ({
        round: 1, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: n,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
                resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    });

    it('names the resourced cards instead of face-down placeholders', () => {
        const gs = adaptState(withResources(2), doc, { 1: 30, 2: 30 }, seats,
            { resourcedIds: { 1: ['ASH#110:2', 'ASH#208'] } });
        const pile = gs.players['p1'].cardPiles['resources'];
        expect(pile.map((c: { uuid: string }) => c.uuid)).toEqual(['ASH#110:2', 'ASH#208']);
        expect(pile[0].setId).toEqual({ set: 'ASH', number: 110 });
    });

    it('pads with face-down placeholders when the count outruns the known ids', () => {
        const gs = adaptState(withResources(3), doc, { 1: 30, 2: 30 }, seats,
            { resourcedIds: { 1: ['ASH#208'] } });
        const pile = gs.players['p1'].cardPiles['resources'];
        expect(pile).toHaveLength(3);
        expect(pile.filter((c: { setId: { set: string } }) => !c.setId.set)).toHaveLength(2);
    });

    it('never shows more resources than the fold counted', () => {
        const gs = adaptState(withResources(1), doc, { 1: 30, 2: 30 }, seats,
            { resourcedIds: { 1: ['ASH#208', 'ASH#110:2', 'SEC#215'] } });
        expect(gs.players['p1'].cardPiles['resources']).toHaveLength(1);
    });

    it('falls back to face-down when no ids are supplied', () => {
        const gs = adaptState(withResources(2), doc, { 1: 30, 2: 30 }, seats);
        const pile = gs.players['p1'].cardPiles['resources'];
        expect(pile).toHaveLength(2);
        expect(pile.every((c: { setId: { set: string } }) => !c.setId.set)).toBe(true);
    });
});

describe('attached upgrades render as banners: aspects + name reach the subcard', () => {
    // GameCard paints an upgrade banner from `cardUpgradebackground(subcard)`, which returns
    // null without `aspects` -- the banner's background was literally `url(/null)` -- and prints
    // `subcard.name`, which the adapter never set. Both come from the file: aspects via the
    // stat map, names via the CARDS index the replay passes as `nameOf`.
    const statMap = {
        'LOF#164': { type: 'unit', power: 4, hp: 5, arena: 'ground', aspects: ['aggression'] },
        'LOF#215': { type: 'upgrade', power: 1, hp: 3, aspects: ['cunning'] },
    };
    const names: Record<string, string> = { 'LOF#164': 'Wampa', 'LOF#215': 'Ascension Cable' };
    const nameOf = (id: string) => names[id] ?? id;
    const doc = parse(SAMPLE);
    const decks = deckOrderLengths(doc);
    const wampa: CardInstanceState = { id: 'LOF#164', zone: 'ground', damage: 0, exhausted: false, upgrades: ['LOF#215'], shields: 0, experience: 0, statusTokens: {} };
    const state: ReducedState = {
        round: 1, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [wampa] },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    };

    it('gives the parented upgrade card its aspects, name and printed type', () => {
        const gs = adaptState(state, doc, decks, { 1: 'p1', 2: 'p2' }, { nameOf }, statMap);
        const ground = gs.players.p1.cardPiles.groundArena;
        const cable = ground.find((c: { uuid: string }) => c.uuid === 'LOF#215');
        expect(cable).toBeDefined();
        expect(cable.parentCardId).toBe('LOF#164');
        expect(cable.aspects).toEqual(['cunning']);
        expect(cable.name).toBe('Ascension Cable');
        expect(cable.type).toBe('upgrade');
        // The host is named too; hover previews and the not-found overlay read it.
        expect(ground.find((c: { uuid: string }) => c.uuid === 'LOF#164').name).toBe('Wampa');
    });

    it('omits both fields rather than emitting empty ones when nothing is known', () => {
        const c = cardFromId('XXX#999', 'hand', 'p1', 'p1');
        expect('aspects' in c).toBe(false);
        expect('name' in c).toBe(false);
        const d = cardFromId('XXX#999', 'hand', 'p1', 'p1', { aspects: [] }, '');
        expect('aspects' in d).toBe(false);
        expect('name' in d).toBe(false);
    });
});
