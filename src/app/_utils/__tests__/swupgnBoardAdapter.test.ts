import { describe, it, expect } from 'vitest';
import { cardFromId, cardFromInstance, ZONE_MAP, adaptState, ownerSeatMap } from '../swupgnBoardAdapter';
import { statOf } from '../swupgnCardStats';
import { parse, stateAt, foldFrames, normalizeEvents, type ReducedState, type Seat, type CardInstanceState } from '@/lib/swupgn';
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
            upgrades: [], shields: 1, experience: 0, statusTokens: {}, captured: [] };
        const c = cardFromInstance(inst, 'p1');
        expect(c.zone).toBe(ZONE_MAP.ground);
        expect(c.damage).toBe(2);
        expect(c.exhausted).toBe(true);
    });
});

describe('adaptState (full assembly)', () => {
    const doc = parse(SAMPLE);
    // R1.G.3 is after P1's regroup draw. ps.hand[] and ps.handSize are both MOVE-driven,
    // so they agree; the assertion uses ps.hand.length to stay independent of the count.
    const reduced = stateAt(doc.events, 'R1.G.3');
    const gs = adaptState(reduced, doc, { 1: 'p1', 2: 'p2' });

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

    it('shows no deck count at all when neither the file nor the tracker knows one (§14: absent is not zero)', () => {
        expect(gs.players.p1.numCardsInDeck).toBeUndefined();
    });

    it('prefers the tracked deck per seat when supplied, clamped at zero', () => {
        const g = adaptState(reduced, doc, { 1: 'p1', 2: 'p2' }, { deckRemaining: { 1: 7, 2: -1 } });
        expect(g.players.p1.numCardsInDeck).toBe(7);
        expect(g.players.p2.numCardsInDeck).toBe(0);
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
    const ids = { 1: 'p1', 2: 'p2' } as Record<Seat, string>;
    const mkPlayer = (seat: Seat, cards: CardInstanceState[] = []) => ({
        seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
        resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards,
    });
    const state = (cards1: CardInstanceState[] = []): ReducedState => ({
        round: 1, phase: 'action', initiative: 1, players: { 1: mkPlayer(1, cards1), 2: mkPlayer(2) },
    });

    it('undeployed leader shows its art (zone base) and dims when exhausted', () => {
        const gs = adaptState(state(), doc, ids, { leaderExhausted: { 1: true } });
        expect(gs.players.p1.leader.zone).toBe('base'); // isDeployed=false -> art renders
        expect(gs.players.p1.leader.exhausted).toBe(true); // -> Karabast dimming
        expect(gs.players.p2.leader.exhausted).toBeFalsy();
    });

    it('glows the leader on its action frame', () => {
        const gs = adaptState(state(), doc, ids, { highlightIds: ['JTL#018'] });
        expect(gs.players.p1.leader.selected).toBe(true);
        expect(gs.players.p2.leader.selected).toBe(false);
    });

    it('a deployed leader flips the slot to the placeholder and renders as an in-play unit', () => {
        const leaderUnit: CardInstanceState = {
            id: 'JTL#018', zone: 'space', damage: 0, exhausted: false, upgrades: [],
            shields: 0, experience: 0, statusTokens: {}, captured: [],
        };
        const gs = adaptState(state([leaderUnit]), doc, ids, { leaderExhausted: { 1: true } });
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
        upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...over,
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
            doc, seats,
        );
        const space = gs.players['p1'].cardPiles['spaceArena'];
        const tokens = space.filter((c: { parentCardId?: string }) => c.parentCardId === 'ASH#220');
        expect(tokens.map((t: { name: string }) => t.name).sort())
            .toEqual(['Advantage', 'Experience', 'Shield', 'Shield']);
        // The host itself is still a single unparented card in the arena.
        expect(space.filter((c: { parentCardId?: string }) => !c.parentCardId)).toHaveLength(1);
    });

    it('emits nothing for a unit with no tokens', () => {
        const gs = adaptState(stateWith(inst()), doc, seats);
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
        const gs = adaptState(state, doc, seats);
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
        const gs = adaptState(state, doc, seats, {}, statMap);
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
        const gs = adaptState(withResources(2), doc, seats,
            { resourcedIds: { 1: ['ASH#110:2', 'ASH#208'] } });
        const pile = gs.players['p1'].cardPiles['resources'];
        expect(pile.map((c: { uuid: string }) => c.uuid)).toEqual(['ASH#110:2', 'ASH#208']);
        expect(pile[0].setId).toEqual({ set: 'ASH', number: 110 });
    });

    it('pads with face-down placeholders when the count outruns the known ids', () => {
        const gs = adaptState(withResources(3), doc, seats,
            { resourcedIds: { 1: ['ASH#208'] } });
        const pile = gs.players['p1'].cardPiles['resources'];
        expect(pile).toHaveLength(3);
        expect(pile.filter((c: { setId: { set: string } }) => !c.setId.set)).toHaveLength(2);
    });

    it('never shows more resources than the fold counted', () => {
        const gs = adaptState(withResources(1), doc, seats,
            { resourcedIds: { 1: ['ASH#208', 'ASH#110:2', 'SEC#215'] } });
        expect(gs.players['p1'].cardPiles['resources']).toHaveLength(1);
    });

    it('falls back to face-down when no ids are supplied', () => {
        const gs = adaptState(withResources(2), doc, seats);
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
    const wampa: CardInstanceState = { id: 'LOF#164', zone: 'ground', damage: 0, exhausted: false, upgrades: ['LOF#215'], shields: 0, experience: 0, statusTokens: {}, captured: [] };
    const state: ReducedState = {
        round: 1, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [wampa] },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    };

    it('gives the parented upgrade card its aspects, name and printed type', () => {
        const gs = adaptState(state, doc, { 1: 'p1', 2: 'p2' }, { nameOf }, statMap);
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

describe('effectiveStats — a unit shows what is attached to it, the way the engine sums it', () => {
    // Values from forceteki card data: N-1 Starfighter 3/2; Han Solo, Has His Moments is a
    // 4/5 unit but a +2/+3 pilot; Craving Power +2/+2; Experience +1/+1; Advantage +1/+0;
    // Shield +0/+0. 501st Veteran has Grit.
    const statMap = {
        'JTL#095': { type: 'unit', power: 3, hp: 2, arena: 'space' },
        'JTL#203': { type: 'unit', power: 4, hp: 5, arena: 'ground', upgradePower: 2, upgradeHp: 3 },
        'LOF#091': { type: 'upgrade', power: 2, hp: 2, upgradePower: 2, upgradeHp: 2 },
        'TWI#050': { type: 'unit', power: 4, hp: 5, arena: 'ground', grit: true },
        'TOKEN:Experience': { type: 'token', power: 1, hp: 1, upgradePower: 1, upgradeHp: 1, id: '2007868442' },
        'TOKEN:Advantage': { type: 'token', power: 1, hp: 0, upgradePower: 1, upgradeHp: 0, id: '5844562972' },
        'TOKEN:Shield': { type: 'token', power: 0, hp: 0, upgradePower: 0, upgradeHp: 0, id: '8752877738' },
    };
    const unit = (over: Partial<CardInstanceState>): CardInstanceState => ({
        id: 'JTL#095', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...over,
    });
    const stats = (inst: CardInstanceState) => {
        const c = cardFromInstance(inst, 'p1', statMap[inst.id as keyof typeof statMap], undefined, statMap);
        return [c.power, c.hp];
    };

    it('adds a pilot by its piloting line, not its unit line', () => {
        expect(stats(unit({ upgrades: ['JTL#203'] }))).toEqual([5, 5]);
    });

    it('adds a printed upgrade and every token, each by its own printed bonus', () => {
        expect(stats(unit({ upgrades: ['LOF#091'] }))).toEqual([5, 4]);
        expect(stats(unit({ experience: 2 }))).toEqual([5, 4]);
        expect(stats(unit({ statusTokens: { advantage: 1 } }))).toEqual([4, 2]);
        expect(stats(unit({ shields: 3 }))).toEqual([3, 2]);
        expect(stats(unit({ upgrades: ['JTL#203', 'LOF#091'], experience: 1, statusTokens: { advantage: 1 } }))).toEqual([9, 8]);
    });

    it('Grit raises power by damage taken; nothing goes below zero', () => {
        expect(stats(unit({ id: 'TWI#050', zone: 'ground', damage: 3 }))).toEqual([7, 5]);
        expect(stats(unit({ id: 'TWI#050', zone: 'ground', damage: 0 }))).toEqual([4, 5]);
    });

    it('does not invent stats for a card the data does not know, or for an unknown attachment', () => {
        const c = cardFromInstance(unit({ id: 'XXX#001', upgrades: ['LOF#091'] }), 'p1', undefined, undefined, statMap);
        expect('power' in c).toBe(false);
        expect('hp' in c).toBe(false);
        // An attachment the map lacks contributes nothing rather than NaN.
        expect(stats(unit({ upgrades: ['NOPE#999'] }))).toEqual([3, 2]);
    });

    it('is what adaptState puts on the board card', () => {
        const doc = parse(SAMPLE);
        const s: ReducedState = {
            round: 1, phase: 'action', initiative: 1,
            players: {
                1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [unit({ upgrades: ['JTL#203'], statusTokens: { advantage: 1 } })] },
                2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
            },
        };
        const gs = adaptState(s, doc, { 1: 'p1', 2: 'p2' }, {}, statMap);
        const n1 = gs.players.p1.cardPiles.spaceArena.find((c: { uuid: string }) => c.uuid === 'JTL#095');
        expect([n1.power, n1.hp]).toEqual([6, 5]);
    });
});

describe('token units resolve their stats and art by numeric id', () => {
    // A current file names a token unit `TOKEN:mandalorian#8192010342`; the stat map keys it
    // `TOKEN:Mandalorian` with `id: "8192010342"`. Without the bridge the Mandalorian rendered
    // as "TOKEN:mandalorian_8192... IMAGE NOT FOUND" with empty badges.
    const statMap = {
        'TOKEN:Mandalorian': { type: 'token', power: 2, hp: 2, arena: 'ground', id: '8192010342' },
        'TOKEN:Shield': { type: 'token', power: 0, hp: 0, upgradePower: 0, upgradeHp: 0, id: '8752877738' },
    };

    it('finds the entry for every id shape the format has used', () => {
        for (const id of ['TOKEN:mandalorian#8192010342', 'TOKEN:mandalorian#8192010342:2', 'TOKEN:Mandalorian', 'TOKEN:Mandalorian:3']) {
            expect(statOf(id, statMap)?.id, id).toBe('8192010342');
        }
        expect(statOf('TOKEN:nothing#0000000000', statMap)).toBeUndefined();
        expect(statOf('TOKEN:weakness', statMap)).toBeUndefined();
    });

    it('builds a board card that takes the token art path and carries its printed stats', () => {
        const inst: CardInstanceState = { id: 'TOKEN:mandalorian#8192010342', zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 1, experience: 0, statusTokens: {}, captured: [] };
        const c = cardFromInstance(inst, 'p2', statOf(inst.id, statMap), 'Mandalorian', statMap);
        expect(c.type).toBe('token');       // s3CardImageURL: type includes 'token' -> cards/_tokens/<id>
        expect(c.id).toBe('8192010342');
        expect([c.power, c.hp]).toEqual([2, 2]);
        expect(c.name).toBe('Mandalorian');
    });
});

describe('captives, live stats and leader status (SWU-PGN 3c4ed35d)', () => {
    const doc = parse(SAMPLE);
    const card = (over: Partial<CardInstanceState>): CardInstanceState => ({
        id: 'SOR#095', zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...over,
    });
    const state = (p1Cards: CardInstanceState[]): ReducedState => ({
        round: 2, phase: 'action', initiative: 1,
        players: {
            1: { seat: 1, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: p1Cards },
            2: { seat: 2, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [] },
        },
    });
    const ids = { 1: 'p1', 2: 'p2' } as Record<Seat, string>;

    it('files a captured unit under its captor in capturedZone', () => {
        const gs = adaptState(state([card({ captured: ['SOR#128'] })]), doc, ids);
        expect(gs.players.p1.cardPiles.capturedZone.map((c: { uuid: string; parentCardId: string }) => [c.uuid, c.parentCardId])).toEqual([['SOR#128', 'SOR#095']]);
        expect(gs.players.p1.cardPiles.groundArena.map((c: { uuid: string }) => c.uuid)).toEqual(['SOR#095']);
    });

    it('shows a status token the board has never heard of, by its own name', () => {
        const gs = adaptState(state([card({ statusTokens: { 'plot-armor': 2 } })]), doc, ids);
        const badges = gs.players.p1.cardPiles.groundArena.filter((c: { parentCardId?: string }) => c.parentCardId);
        expect(badges.map((c: { name: string }) => c.name)).toEqual(['Plot-Armor', 'Plot-Armor']);
    });

    it('shows the live power/hp the file states (STATS / keyframes), else the static math', () => {
        const statMap = { 'SOR#095': { type: 'unit', power: 4, hp: 5 }, 'TOKEN:Experience': { type: 'token', upgradePower: 1, upgradeHp: 1, id: '2007868442' } };
        const told = adaptState(state([card({ power: 6, hp: 5, experience: 1 })]), doc, ids, {}, statMap);
        expect([told.players.p1.cardPiles.groundArena[0].power, told.players.p1.cardPiles.groundArena[0].hp]).toEqual([6, 5]);
        const older = adaptState(state([card({ experience: 1 })]), doc, ids, {}, statMap);
        expect([older.players.p1.cardPiles.groundArena[0].power, older.players.p1.cardPiles.groundArena[0].hp]).toEqual([5, 6]);
    });

    it('takes the leader status and deck count from the file when it carries them', () => {
        const s = state([]);
        s.players[1]!.leader = { id: doc.header.p1Leader, deployed: false, exhausted: true, epicActionUsed: true };
        s.players[1]!.deckSize = 17;
        const gs = adaptState(s, doc, ids);
        expect(gs.players.p1.leader.exhausted).toBe(true);
        expect(gs.players.p1.leader.zone).toBe('base');
        expect(gs.players.p1.numCardsInDeck).toBe(17);
    });
});

describe('every §11 field reaches the board (spec conformance, forceteki 3c4ed35d)', () => {
    const doc = {
        header: { p1Leader: 'SOR#010', p1Base: 'SOR#028', p2Leader: 'SOR#005', p2Base: 'SOR#020' },
        decks: [
            { p: 1, leader: 'SOR#010', base: 'SOR#028', deck: [['SOR#108', 3]] },
            { p: 2, leader: 'SOR#005', base: 'SOR#020', deck: [['SOR#045', 3]] },
        ],
    } as unknown as import('@/lib/swupgn').SwuPgnDocument;
    const ids = { 1: 'p1', 2: 'p2' } as Record<Seat, string>;
    const unit = (over: Partial<CardInstanceState> = {}): CardInstanceState => ({
        id: 'SOR#108', zone: 'ground', damage: 0, exhausted: false, upgrades: [],
        shields: 0, experience: 0, statusTokens: {}, captured: [], ...over,
    });
    const seat = (n: Seat, over: Partial<import('@/lib/swupgn').PlayerState> = {}) => ({
        seat: n, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
        resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], ...over,
    });
    const state = (over: Partial<ReducedState> = {}, p1: Partial<import('@/lib/swupgn').PlayerState> = {}, p2: Partial<import('@/lib/swupgn').PlayerState> = {}): ReducedState => ({
        round: 1, phase: 'action', initiative: 1, players: { 1: seat(1, p1), 2: seat(2, p2) }, ...over,
    });
    const ground = (gs: ReturnType<typeof adaptState>, p: string) => gs.players[p].cardPiles.groundArena as Array<Record<string, unknown>>;

    it('shows STATS power/hp and keywords outright, never reconstructed, and flags Sentinel', () => {
        const statMap = { 'SOR#108': { type: 'unit', power: 1, hp: 1, upgradePower: 9 } };
        const gs = adaptState(state({}, { cards: [unit({ power: 6, hp: 7, keywords: ['raid 2', 'sentinel'], experience: 3 })] }), doc, ids, {}, statMap);
        const w = ground(gs, 'p1').find((c) => c.uuid === 'SOR#108')!;
        expect([w.power, w.hp]).toEqual([6, 7]);
        expect(w.keywords).toEqual(['raid 2', 'sentinel']);
        expect(w.sentinel).toBe(true);
        expect(w.statsReconstructed).toBeUndefined();
    });

    it('marks stats it had to rebuild from card data (a pre-STATS file), and shows none when it cannot', () => {
        const statMap = { 'SOR#108': { type: 'unit', power: 4, hp: 5 } };
        const rebuilt = ground(adaptState(state({}, { cards: [unit({ experience: 1 })] }), doc, ids, {}, statMap), 'p1')[0];
        expect(rebuilt.statsReconstructed).toBe(true);
        expect(rebuilt.keywords).toBeUndefined();
        expect(rebuilt.sentinel).toBeUndefined();
        const unknown = ground(adaptState(state({}, { cards: [unit()] }), doc, ids), 'p1')[0];
        expect(unknown.statsReconstructed).toBeUndefined();
        expect('power' in unknown).toBe(false);
    });

    it('renders the leader from the file: base zone while undeployed, exhausted flag, spent Epic Action', () => {
        const gs = adaptState(state({}, { leader: { id: 'SOR#010', deployed: false, exhausted: true, epicActionUsed: true } }), doc, ids);
        const l = gs.players.p1.leader;
        expect(l.zone).toBe('base');
        expect(l.exhausted).toBe(true);
        expect(l.epicActionSpent).toBe(true);
        expect(gs.players.p2.leader.epicActionSpent).toBeUndefined();
        // The file's flag wins over the caller's EXHAUST/READY scan.
        const ready = adaptState(state({}, { leader: { id: 'SOR#010', deployed: false, exhausted: false, epicActionUsed: false } }), doc, ids, { leaderExhausted: { 1: true } });
        expect(ready.players.p1.leader.exhausted).toBeFalsy();
    });

    it('a leader deployed as a pilot flips the slot, rides on its host, and carries its exhausted flag there', () => {
        const gs = adaptState(state({}, {
            cards: [unit({ id: 'SOR#050', zone: 'space', upgrades: ['SOR#010'] })],
            leader: { id: 'SOR#010', deployed: true, exhausted: true, epicActionUsed: true },
        }), doc, ids);
        expect(gs.players.p1.leader.zone).not.toBe('base');
        const pilot = (gs.players.p1.cardPiles.spaceArena as Array<Record<string, unknown>>).find((c) => c.uuid === 'SOR#010')!;
        expect(pilot.parentCardId).toBe('SOR#050');
        expect(pilot.exhausted).toBe(true);
    });

    it('deck count is the file\'s deckSize when stated, the tracker otherwise, nothing when neither', () => {
        expect(adaptState(state({}, { deckSize: 12 }), doc, ids, { deckRemaining: { 1: 7, 2: 7 } }).players.p1.numCardsInDeck).toBe(12);
        expect(adaptState(state(), doc, ids, { deckRemaining: { 1: 7, 2: 7 } }).players.p1.numCardsInDeck).toBe(7);
        expect(adaptState(state(), doc, ids).players.p1.numCardsInDeck).toBeUndefined();
    });

    it('initiative: who holds it, and whether it was taken this round (initiativeTaken)', () => {
        const taken = adaptState(state({ initiative: 2, initiativeTaken: true }), doc, ids);
        expect(taken.players.p2.hasInitiative).toBe(true);
        expect(taken.initiativeClaimed).toBe(true);
        const available = adaptState(state({ initiative: 2, initiativeTaken: false }), doc, ids);
        expect(available.players.p2.hasInitiative).toBe(true);
        expect(available.initiativeClaimed).toBe(false);
        // An older file never says: fall back to "someone holds it".
        expect(adaptState(state({ initiative: 1 }), doc, ids).initiativeClaimed).toBe(true);
        expect(adaptState(state({ initiative: null }), doc, ids).initiativeClaimed).toBe(false);
    });

    it('pads the hand to handSize with face-down cards when the file names fewer (a Perspective file)', () => {
        const gs = adaptState(state({}, { handSize: 4, hand: ['SOR#108', 'SOR#108:2'] }), doc, ids);
        const hand = gs.players.p1.cardPiles.hand as Array<{ uuid: string; setId: { set: string } }>;
        expect(hand).toHaveLength(4);
        expect(hand.slice(0, 2).map((c) => c.uuid)).toEqual(['SOR#108', 'SOR#108:2']);
        expect(hand.slice(2).every((c) => !c.setId.set)).toBe(true);
        // Fog-of-war keeps the count and hides every identity.
        const fog = adaptState(state({}, { handSize: 4, hand: ['SOR#108', 'SOR#108:2'] }), doc, ids, { hideHandFor: 1 });
        expect((fog.players.p1.cardPiles.hand as Array<{ setId: { set: string } }>).every((c) => !c.setId.set)).toBe(true);
        expect(fog.players.p1.cardPiles.hand).toHaveLength(4);
    });

    it('a unit under TAKE_CONTROL keeps its owner (from DECKS) while its controller changes, so the board marks it stolen', () => {
        const gs = adaptState(state({}, { cards: [unit({ id: 'SOR#045' })] }), doc, ids);
        const stolen = ground(gs, 'p1').find((c) => c.uuid === 'SOR#045')!;
        expect(stolen.controllerId).toBe('p1');
        expect(stolen.ownerId).toBe('p2');
        const own = ground(adaptState(state({}, { cards: [unit()] }), doc, ids), 'p1')[0];
        expect(own.ownerId).toBe('p1');
        // A token has no owner but its controller.
        const tok = ground(adaptState(state({}, { cards: [unit({ id: 'TOKEN:battle-droid#123' })] }), doc, ids), 'p1')[0];
        expect(tok.ownerId).toBe('p1');
    });

    it('a captive files under its captor as the other player\'s card; a base captor holds nothing anywhere', () => {
        const gs = adaptState(state({}, { cards: [unit({ captured: ['SOR#045'] })] }), doc, ids);
        const held = gs.players.p1.cardPiles.capturedZone as Array<Record<string, unknown>>;
        expect(held).toHaveLength(1);
        expect(held[0]).toMatchObject({ uuid: 'SOR#045', parentCardId: 'SOR#108', controllerId: 'p1', ownerId: 'p2' });
        // The fold never files a card under `base@N` (spec §21): nothing to render.
        const none = adaptState(state({}, { cards: [unit()] }), doc, ids);
        expect(none.players.p1.cardPiles.capturedZone).toHaveLength(0);
        expect(none.players.p2.cardPiles.capturedZone).toHaveLength(0);
    });

    it('resources, credits and the Force come straight from the counters', () => {
        const gs = adaptState(state({}, { resourcesReady: 3, resourcesExhausted: 2, credits: 2, hasForce: true }), doc, ids);
        expect(gs.players.p1.availableResources).toBe(3);
        expect(gs.players.p1.cardPiles.resources).toHaveLength(5);
        expect(gs.players.p1.cardPiles.credits).toHaveLength(2);
        expect(gs.players.p1.forceToken.active).toBe(true);
        expect(gs.players.p2.forceToken.active).toBe(false);
    });
});

describe('ownerSeatMap — a card both players run has no owner', () => {
    // The board draws a stolen mask whenever controllerId !== ownerId. DECKS lists BASE ids,
    // and the `:N` copy suffix that makes an instance unique (§6.1) is assigned during the
    // game, so for a card both decks contain nothing in the file says whose copy this is.
    // A single id -> seat map kept whichever deck parsed last, and every copy in the other
    // seat's hand wore the mask.
    const docWith = (p1: string[], p2: string[]) => ({
        header: { p1Leader: 'SOR#010', p1Base: 'SOR#027', p2Leader: 'SOR#005', p2Base: 'SOR#029' },
        decks: [
            { p: 1, deck: p1.map((id) => [id, 1]) },
            { p: 2, deck: p2.map((id) => [id, 1]) },
        ],
    }) as unknown as Parameters<typeof ownerSeatMap>[0];

    it('drops a shared card and keeps a card only one player runs', () => {
        const m = ownerSeatMap(docWith(['A#1', 'SHARED#9'], ['B#2', 'SHARED#9']));
        expect(m.get('A#1')).toBe(1);
        expect(m.get('B#2')).toBe(2);
        expect(m.has('SHARED#9'), 'both decks run it — ownership is unknowable').toBe(false);
    });

    it('a card listed twice in the SAME deck still resolves', () => {
        // Two copies of one card is the normal case, not an ambiguity.
        expect(ownerSeatMap(docWith(['A#1', 'A#1'], ['B#2'])).get('A#1')).toBe(1);
    });

    it('the leaders and bases in the header still resolve', () => {
        const m = ownerSeatMap(docWith(['A#1'], ['B#2']));
        expect(m.get('SOR#010')).toBe(1);
        expect(m.get('SOR#029')).toBe(2);
    });

    it('no card in either hand reads as stolen on a vector where both decks are identical', () => {
        // `organic` has 5/5 deck overlap. Before the fix, four of Player 1's hand cards were
        // marked stolen and none of Player 2's were.
        const doc = parse(readFileSync(
            path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors/organic.swupgn'), 'utf-8',
        ));
        const frames = foldFrames(normalizeEvents(doc.events));
        const gs = adaptState(frames[frames.length - 1], doc, { 1: 'P1', 2: 'P2' }, { nameOf: (id) => id });
        for (const seat of ['P1', 'P2'] as const) {
            const stolen = (gs.players[seat].cardPiles.hand as Array<{ uuid: string; ownerId: string; controllerId: string }>)
                .filter((c) => c.ownerId !== c.controllerId);
            expect(stolen.map((c) => c.uuid), `${seat} hand`).toEqual([]);
        }
    });

    it('a genuine TAKE_CONTROL still reads as stolen', () => {
        // The fix must not blind the board to a real steal: SOR#128 is only in P1's deck, so
        // it still resolves to seat 1, and P2 holding it is a mismatch the board should draw.
        const doc = docWith(['SOR#128'], ['B#2']);
        expect(ownerSeatMap(doc).get('SOR#128')).toBe(1);
        const card = cardFromId('SOR#128', 'groundArena', 'P2', 'P1');
        expect(card.controllerId).not.toBe(card.ownerId);
    });
});
