import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import {
    parse, fold, serialize, render, normalizeEvents, checkKeyframes, indexResolver, tokenArtId, isStatusTokenCard,
    type GameEvent, type SwuPgnDocument, type ReducedState, type Seat,
} from '@/lib/swupgn';
import { adaptState } from '../swupgnBoardAdapter';
import { fileIssues, writerGeneration } from '../swupgnFileIssues';
import { deckByFrame } from '../deckTracker';
import { frameAction, storyName } from '../replayAction';
import { buildMoveList } from '../swupgnMoves';
import { resourcingReport } from '../resourcingReport';
import { makeNameResolver } from '../swupgnCardNames';
import { statOf } from '../swupgnCardStats';

/**
 * Spec §22 "Earlier 1.0 files" and §22.1 "Files that say SWU-PGN/1.1": one test per row of
 * each table, on a minimal synthetic file. For every row the client either handles the old
 * shape (the board is right) or degrades VISIBLY (a writerGeneration / fileIssues line says
 * what the replay cannot show). Rows the spec marks "not detectable" or "not a file change"
 * are listed at the end with the reason there is nothing to test.
 */
const VECTOR = readFileSync(path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors/minimal.swupgn'), 'utf-8');
const SEATS: Record<Seat, string> = { 1: 'P1', 2: 'P2' };
const base = (): SwuPgnDocument => parse(VECTOR);
const ev = (over: object, seq = 'R1.A.9'): GameEvent => ({ seq, ...over } as GameEvent);
const unitOn = (s: ReducedState, seat: Seat, id: string) => s.players[seat]!.cards.find((c) => c.id === id);
const withEvents = (events: GameEvent[]): SwuPgnDocument => ({ ...base(), events });
const R1 = () => base().events.slice(0, base().events.findIndex((e) => e.seq === 'R1.A.start') + 1);

describe('§22 earlier 1.0 files', () => {
    it('story wrote "(2 resources)": shown verbatim, and named as the printed cost', () => {
        const doc = { ...base(), story: ['  1. Player 1 plays Wampa (2 resources)'] };
        expect(parse(serialize(doc)).story).toEqual(doc.story);
        expect(writerGeneration(doc)).toEqual([expect.stringContaining('(N resources)')]);
    });

    it('CHOICE.offered named a base by card id, now base@N: both name cleanly', () => {
        const n = indexResolver([{ id: 'SOR#029', name: 'Chopper Base' }]);
        expect(storyName('SOR#029', n)).toBe('Chopper Base');
        expect(storyName('base@2', n)).toBe('Player 2\'s base');
    });

    it('deck construction as outsideTheGame -> deck MOVEs: ignored by every count, and noted', () => {
        const doc = base();
        const build = doc.setup.length ? ['SOR#108', 'SOR#108:2', 'SOR#108:3'].map((card, i) => ev({ t: 'MOVE', card, from: 'outsideTheGame', to: 'deck', p: 1 }, `R0.S.b${i}`)) : [];
        const events = [...build, ...doc.events];
        expect(fold(events)).toEqual(fold(doc.events));
        expect(deckByFrame(doc, events)[build.length - 1][1].remaining).toHaveLength(5);
        expect(writerGeneration(withEvents(events))).toEqual([expect.stringContaining('Deck construction recorded as 3 MOVEs')]);
    });

    it('CARDS.kind followed the live role: the fold classifies by the MOVE, never by the index', () => {
        const events = [...R1(), ev({ t: 'MOVE', card: 'TOKEN:battle-droid#1', from: 'outsideTheGame', to: 'ground', p: 1, kind: 'unit' })];
        const doc = { ...withEvents(events), cards: [...base().cards!, { id: 'TOKEN:battle-droid#1', name: 'Battle Droid', kind: 'upgrade' as const }] };
        expect(unitOn(fold(doc.events), 1, 'TOKEN:battle-droid#1')).toBeDefined();
    });

    it('CARDS covered only ids the events mention: an uncovered id falls back to itself', () => {
        const doc = base();
        const n = indexResolver(doc.cards!.filter((c) => c.id !== doc.header.p1Leader));
        expect(n.nameOf(doc.header.p1Leader)).toBe(doc.header.p1Leader);
        expect(n.nameOf('SOR#108:2')).toBe('Wampa');
    });

    it('GAME_END shared its seq with PHASE_END: a link lands on the first, the move list keeps the game end, and it is noted', () => {
        const events = [...R1(), ev({ t: 'PHASE_END', phase: 'action' }, 'R1.A.end'), ev({ t: 'GAME_END', winner: 1, reason: 'concede' }, 'R1.A.end')];
        expect(events.findIndex((e) => e.seq === 'R1.A.end')).toBe(events.length - 2);
        expect(buildMoveList(events, { nameOf: (id) => id }).some((m) => m.t === 'GAME_END')).toBe(true);
        expect(writerGeneration(withEvents(events))).toEqual([expect.stringContaining('GAME_END shares its seq')]);
    });

    it('TAKE_CONTROL with no zone: the card stays under its old seat, and the file says so', () => {
        const events = [...R1(), ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1, kind: 'unit' }), ev({ t: 'TAKE_CONTROL', p: 2, card: 'SOR#108' })];
        const s = fold(events);
        expect(unitOn(s, 1, 'SOR#108')).toBeDefined();
        expect(unitOn(s, 2, 'SOR#108')).toBeUndefined();
        expect(writerGeneration(withEvents(events))).toContainEqual(expect.stringContaining('1 control change recorded without a zone'));
        // The current shape re-seats it.
        const now = fold([...events.slice(0, -1), ev({ t: 'TAKE_CONTROL', p: 2, card: 'SOR#108', zone: 'ground' })]);
        expect(unitOn(now, 2, 'SOR#108')).toBeDefined();
        expect(unitOn(now, 1, 'SOR#108')).toBeUndefined();
    });

    it('DEPLOY_LEADER with no host for a pilot: folded as its own unit, leader status still set', () => {
        const events = [...R1(), ev({ t: 'DEPLOY_LEADER', p: 1, card: 'SOR#010', zone: 'space' })];
        const s = fold(events);
        expect(unitOn(s, 1, 'SOR#010')?.zone).toBe('space');
        expect(s.players[1]!.leader).toEqual({ id: 'SOR#010', deployed: true, exhausted: false, epicActionUsed: false });
        // Current shape: an attachment, never a body, and the Epic Action spent.
        const pilot = fold([...R1(), ev({ t: 'MOVE', card: 'SOR#050', from: 'hand', to: 'space', p: 1, kind: 'unit' }), ev({ t: 'DEPLOY_LEADER', p: 1, card: 'SOR#010', kind: 'upgrade', target: 'SOR#050', epic: true })]);
        expect(unitOn(pilot, 1, 'SOR#010')).toBeUndefined();
        expect(unitOn(pilot, 1, 'SOR#050')?.upgrades).toEqual(['SOR#010']);
        expect(pilot.players[1]!.leader?.epicActionUsed).toBe(true);
    });

    it('RecorderErrors in the header is surfaced as a warning', () => {
        const doc = base();
        expect(fileIssues({ ...doc, header: { ...doc.header, recorderErrors: 1 } })).toEqual([expect.objectContaining({ severity: 'warning', message: expect.stringContaining('1 recorder error') })]);
    });

    it('a malformed keyframe is ignored per seat and reported, never snapped or crashed on', () => {
        const events = [...R1(), ev({ t: 'ROUND_END', round: 1, keyframe: { round: 1, phase: 'regroup', initiative: 1, players: { 1: { cards: 'x' } } } }, 'R1.end')];
        const s = fold(events);
        expect(s.players[1]!.handSize).toBe(1);
        expect(s.players[2]!.handSize).toBe(1);
        expect(checkKeyframes(events).mismatches).toEqual([expect.objectContaining({ seq: 'R1.end', path: 'keyframe' })]);
        expect(fileIssues(withEvents(events))).toEqual([expect.objectContaining({ message: expect.stringContaining('1 keyframe missing a seat') })]);
    });

    it('no EXHAUST_RESOURCES: the row reads all-ready, paid is unknown, and the file says so', () => {
        const doc = base();
        const events = doc.events.filter((e) => e.t !== 'EXHAUST_RESOURCES' && e.t !== 'READY_RESOURCES');
        const afterPlay = events.findIndex((e) => e.seq === 'R1.A.1');
        const s = fold(events.slice(0, afterPlay + 1));
        expect([s.players[1]!.resourcesReady, s.players[1]!.resourcesExhausted]).toEqual([2, 0]);
        expect(resourcingReport(withEvents(events)).hasPaidData).toBe(false);
        expect(writerGeneration({ ...withEvents(events), story: [] }).some((n) => n.includes('Pre-counted-resources'))).toBe(true);
    });

    it('a per-card READY of a resourced card: nothing to apply, and noted', () => {
        const events = [...R1(), ev({ t: 'READY', card: 'SOR#108:2' })];
        expect(fold(events)).toEqual(fold(R1()));
        expect(writerGeneration(withEvents(events))).toEqual([expect.stringContaining('Per-card READY of a resource')]);
    });

    it('an exit MOVE naming a host (attachedTo on the way out) still detaches, and is noted', () => {
        const events = [
            ...R1(),
            ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'SOR#108' }),
            ev({ t: 'MOVE', card: 'LOF#215', from: 'ground', to: 'discard', p: 1, kind: 'upgrade', attachedTo: 'SOR#108' }),
        ];
        expect(unitOn(fold(events), 1, 'SOR#108')?.upgrades).toEqual([]);
        expect(writerGeneration(withEvents(events))).toContainEqual(expect.stringContaining('Exit MOVEs name a host'));
    });

    it('a Credit token changing hands: the early base -> base MOVE is inert, the TAKE_CONTROL re-seats the credit', () => {
        const held = [...R1(), ev({ t: 'MOVE', card: 'TOKEN:credit#1', from: 'outsideTheGame', to: 'base', p: 1, kind: 'unit' })];
        expect(fold(held).players[1]!.credits).toBe(1);
        const early = [...held, ev({ t: 'MOVE', card: 'TOKEN:credit#1', from: 'base', to: 'base', p: 2, kind: 'unit' })];
        expect(fold(normalizeEvents(early)).players[1]!.credits).toBe(1);
        expect(fileIssues(withEvents(early))).toEqual([expect.objectContaining({ message: expect.stringContaining('1 MOVE with an empty or identical from/to') })]);
        const now = fold([...held, ev({ t: 'TAKE_CONTROL', p: 2, card: 'TOKEN:credit#1', zone: 'base', from: 1 })]);
        expect([now.players[1]!.credits, now.players[2]!.credits]).toEqual([0, 1]);
    });

    it('CAPTURE.p as the owner with no captor: the card leaves play and is filed nowhere, and it is noted', () => {
        const events = [
            ...R1(),
            ev({ t: 'MOVE', card: 'SOR#045', from: 'hand', to: 'ground', p: 2, kind: 'unit' }),
            ev({ t: 'MOVE', card: 'SOR#045', from: 'ground', to: 'capture', p: 2, kind: 'unit' }),
            ev({ t: 'CAPTURE', p: 2, card: 'SOR#045' }),
        ];
        const s = fold(events);
        expect(unitOn(s, 2, 'SOR#045')).toBeUndefined();
        expect(s.players[1]!.cards.flatMap((c) => c.captured)).toEqual([]);
        expect(writerGeneration(withEvents(events))).toContainEqual(expect.stringContaining('1 capture naming no captor'));
    });

    it('a Weakness token recorded as a printed upgrade never lands in an arena or on upgrades[]', () => {
        const events = [
            ...R1(),
            ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1, kind: 'unit' }),
            ev({ t: 'MOVE', card: 'TOKEN:Weakness', from: 'outsideTheGame', to: 'ground', p: 1, attachedTo: 'SOR#108' }),
            ev({ t: 'PLAY_UPGRADE', p: 1, card: 'TOKEN:Weakness', target: 'SOR#108' }),
        ];
        const s = fold(events);
        expect(isStatusTokenCard('TOKEN:Weakness')).toBe(true);
        expect(unitOn(s, 1, 'TOKEN:Weakness')).toBeUndefined();
        expect(unitOn(s, 1, 'SOR#108')?.upgrades).toEqual([]);
        // The current shape counts it under its own name.
        expect(unitOn(fold([...events, ev({ t: 'STATUS_TOKEN', card: 'SOR#108', token: 'weakness', count: 1 })]), 1, 'SOR#108')?.statusTokens).toEqual({ weakness: 1 });
    });

    it('keyframe cards with no stats and no captives: stats are rebuilt and marked, captives are none', () => {
        const doc = base();
        const events = doc.events.filter((e) => e.t !== 'STATS').map((e) => {
            if ((e.t !== 'ROUND_START' && e.t !== 'ROUND_END') || !e.keyframe) return e;
            const players = Object.fromEntries(Object.entries(e.keyframe.players).map(([seat, p]) => [seat, {
                ...p, cards: p!.cards.map((c) => { const { power: _p, hp: _h, keywords: _k, captured: _c, ...rest } = c; void [_p, _h, _k, _c]; return rest; }),
            }]));
            return { ...e, keyframe: { ...e.keyframe, players } } as GameEvent;
        });
        const s = fold(events);
        const wampa = unitOn(s, 1, 'SOR#108')!;
        expect(wampa.power).toBeUndefined();
        expect(wampa.captured).toEqual([]);
        const gs = adaptState(s, doc, SEATS, {}, { 'SOR#108': { type: 'unit', power: 4, hp: 5 } });
        expect(gs.players.P1.cardPiles.groundArena[0]).toMatchObject({ power: 4, hp: 5, statsReconstructed: true });
        expect(writerGeneration(withEvents(events))).toEqual([
            expect.stringContaining('Pre-STATS writer'),
            expect.stringContaining('Keyframes carry no captives'),
        ]);
    });

    it('Engine as a package version is not a sentinel but cannot pinpoint a build', () => {
        const doc = base();
        const versioned = { ...doc, header: { ...doc.header, engine: 'forceteki@0.1.0' } };
        expect(fileIssues(versioned)).toEqual([]);
        expect(writerGeneration(versioned)).toEqual([expect.stringContaining('package version, not a commit')]);
    });

    it('no entering EXHAUST: the unit reads ready until regroup, which the pre-STATS note covers', () => {
        const doc = base();
        const events = doc.events.filter((e) => e.seq !== 'R1.A.1a' && e.t !== 'STATS');
        const s = fold(events.slice(0, events.findIndex((e) => e.seq === 'R1.A.1') + 1));
        expect(unitOn(s, 1, 'SOR#108')?.exhausted).toBe(false);
        expect(writerGeneration(withEvents(events)).some((n) => n.includes('may read ready until the next regroup'))).toBe(true);
    });

    it('keyframes without leader/deckSize/initiativeTaken: the board falls back to the caller\'s derivations', () => {
        const doc = base();
        const events = doc.events.map((e) => {
            if ((e.t !== 'ROUND_START' && e.t !== 'ROUND_END') || !e.keyframe) return e;
            const { initiativeTaken: _i, ...kf } = e.keyframe;
            void _i;
            const players = Object.fromEntries(Object.entries(kf.players).map(([seat, p]) => { const { leader: _l, deckSize: _d, ...rest } = p!; void [_l, _d]; return [seat, rest]; }));
            return { ...e, keyframe: { ...kf, players } } as GameEvent;
        });
        const s = fold(events);
        expect(s.players[1]!.leader).toBeUndefined();
        expect(s.players[1]!.deckSize).toBeUndefined();
        const gs = adaptState(s, doc, SEATS, { leaderExhausted: { 1: true }, deckRemaining: { 1: 0, 2: 0 } });
        expect(gs.players.P1.leader.exhausted).toBe(true);
        expect(gs.players.P1.numCardsInDeck).toBe(0);
        expect(gs.initiativeClaimed).toBe(true); // only "someone holds it" is known
        expect(writerGeneration(withEvents(events))).toEqual([expect.stringContaining('Keyframes carry no leader')]);
    });

    it('rows the spec marks undetectable or reader-side have nothing to test', () => {
        // `Date` meaning (not detectable); the fold ignoring attachedTo, the minimal vector's
        // prologue and its rules-legal attack (not file changes): nothing in a file changes.
        expect(true).toBe(true);
    });
});

describe('§22.1 files that say SWU-PGN/1.1', () => {
    const asOneOne = (events: GameEvent[]): SwuPgnDocument => {
        const doc = base();
        return { ...doc, header: { ...doc.header, game: 'SWU-PGN/1.1' }, cards: [], story: [], events };
    };

    it('is accepted and parsed as 1.0, with the pre-release note; another major is refused', () => {
        const text = VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/1.1');
        expect(parse(text).header.game).toBe('SWU-PGN/1.1');
        expect(writerGeneration(parse(text))).toEqual([expect.stringContaining('Pre-release SWU-PGN/1.1')]);
        expect(() => parse(VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/2.0'))).toThrow(/unsupported format version/);
        expect(parse(VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/1.7')).header.game).toBe('SWU-PGN/1.7');
    });

    it('a TOKEN id with no # is opaque: no art id, no stat lookup', () => {
        expect(tokenArtId('TOKEN:Advantage:2')).toBeUndefined();
        expect(statOf('TOKEN:Advantage:2', { 'TOKEN:X': { id: '1' } })).toBeUndefined();
    });

    it('no CARDS: the client\'s own name map names the cards; no STORY: the export renders one', () => {
        const doc = asOneOne(base().events);
        expect(makeNameResolver({ 'SOR#108': 'Wampa' }).nameOf('SOR#108:2')).toBe('Wampa');
        expect(parse(serialize(doc)).story!.join('\n')).toBe(render(doc).replace(/^\n+|\n+$/g, ''));
    });

    it('no kind on a token MOVE: the name list classifies it; a host named by attachedTo makes it an upgrade move', () => {
        expect(isStatusTokenCard('TOKEN:Shield')).toBe(true);
        expect(isStatusTokenCard('TOKEN:Battle Droid')).toBe(false);
        const events = [...R1(), ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1 }), ev({ t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 1, attachedTo: 'SOR#108' })];
        const s = fold(events);
        expect(unitOn(s, 1, 'LOF#215')).toBeUndefined();
        expect(unitOn(s, 1, 'SOR#108')?.upgrades).toEqual(['LOF#215']);
    });

    it('no RESOURCE record: the MOVE into the row is the caption', () => {
        expect(frameAction(ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'resource', p: 1 }), { nameOf: (id) => id }).label).toBe('Player 1 resources SOR#108');
    });

    it('token gains with no removal: the token\'s exit MOVE becomes the host decrement', () => {
        const events = [
            ...R1(),
            ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1 }),
            ev({ t: 'MOVE', card: 'TOKEN:Advantage', from: 'outsideTheGame', to: 'ground', p: 1 }),
            ev({ t: 'STATUS_TOKEN', card: 'SOR#108', token: 'advantage', count: 1 }),
            ev({ t: 'MOVE', card: 'TOKEN:Advantage', from: 'ground', to: 'outsideTheGame', p: 1 }),
        ];
        expect(unitOn(fold(events), 1, 'SOR#108')?.statusTokens).toEqual({ advantage: 1 });
        expect(unitOn(fold(normalizeEvents(events)), 1, 'SOR#108')?.statusTokens).toEqual({});
    });

    it('MOVE with from "" or from === to is dropped and counted', () => {
        const events = [...R1(), ev({ t: 'MOVE', card: 'SOR#108', from: '', to: 'hand', p: 1 }), ev({ t: 'MOVE', card: 'SOR#108', from: 'deck', to: 'deck', p: 1 })];
        expect(normalizeEvents(events)).toHaveLength(R1().length);
        // The viewer folds the repaired stream, so the inert record never reaches a count.
        expect(fold(normalizeEvents(events)).players[1]!.handSize).toBe(1);
        expect(fileIssues(asOneOne(events)).map((i) => i.message)).toEqual([expect.stringContaining('2 MOVEs with an empty or identical from/to')]);
    });

    it('a keyframe missing a seat or with "players": {} is ignored and the running state kept', () => {
        const events = [...R1(), ev({ t: 'ROUND_END', round: 1, keyframe: { round: 1, phase: 'regroup', initiative: 1, players: {} } }, 'R1.end')];
        expect(fold(events).players[1]!.handSize).toBe(1);
        expect(fold(events).players[2]!.handSize).toBe(1);
    });

    it('a card pushed for both the MOVE and the PLAY appears once', () => {
        const events = [...R1(), ev({ t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1 }), ev({ t: 'PLAY', p: 1, card: 'SOR#108', zone: 'ground' })];
        expect(fold(events).players[1]!.cards.filter((c) => c.id === 'SOR#108')).toHaveLength(1);
    });

    it('Engine "forceteki@unknown" / Seed "unseeded" are surfaced, not trusted', () => {
        const doc = base();
        expect(fileIssues({ ...doc, header: { ...doc.header, engine: 'forceteki@unknown', seed: 'unseeded' } }).map((i) => i.message)).toEqual([
            expect.stringContaining('Untraceable build'),
            expect.stringContaining('No seed recorded'),
        ]);
    });
});
