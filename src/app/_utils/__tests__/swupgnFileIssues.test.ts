import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, serialize, type SwuPgnDocument, type GameEvent } from '@/lib/swupgn';
import { fileIssues as allFileIssues, writerGeneration, skippedSectionList } from '../swupgnFileIssues';
import type { FileIssue } from '../swupgnFileIssues';

// The fixture here is a pilot file on purpose (its WriterRevision is stripped), so every list
// would open with the §3 [C-01] pre-release notice. That notice has its own test
// (swupgnConformance.test.ts); here it is set aside so each case sees only what it is about.
const fileIssues = (...args: Parameters<typeof allFileIssues>): FileIssue[] =>
    allFileIssues(...args).filter((i) => !i.message.startsWith('Pre-release file'));
import { noEventsMessage } from '../replayHandoff';

// The pilot-file rows below need a file with no WriterRevision (§22). The vector gained one at
// writer revision 3, so it is stripped here: everything else about the file is unchanged.
const VECTOR = readFileSync(path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors/minimal.swupgn'), 'utf-8')
    .replace(/^\[WriterRevision "\d+"\]\n/m, '');

const withHeader = (over: Partial<SwuPgnDocument['header']>, events?: GameEvent[]): SwuPgnDocument => {
    const doc = parse(VECTOR);
    return { ...doc, header: { ...doc.header, ...over }, events: events ?? doc.events };
};
const msgs = (doc: SwuPgnDocument) => fileIssues(doc).map((i) => i.message);

describe('fileIssues', () => {
    it('says nothing about a clean omniscient file', () => {
        expect(fileIssues(withHeader({ perspective: null }))).toEqual([]);
    });

    it('surfaces the §5.3 provenance sentinels rather than presenting the file as traceable', () => {
        const m = msgs(withHeader({ engine: 'forceteki@unknown', seed: 'unseeded', perspective: null }));
        expect(m.some((s) => s.includes('Untraceable build'))).toBe(true);
        expect(m.some((s) => s.includes('No seed recorded'))).toBe(true);
        // A real Engine/Seed pair is not a sentinel, whatever it looks like.
        expect(msgs(withHeader({ engine: 'forceteki@a1b2c3d', seed: '0', perspective: null }))).toEqual([]);
    });

    it('notes a Perspective file as informational, not a defect', () => {
        const issues = fileIssues(withHeader({ perspective: 'P2' }));
        expect(issues).toHaveLength(1);
        expect(issues[0].severity).toBe('info');
        expect(issues[0].message).toContain('Player 2\'s eyes');
    });

    it('counts the records the reader repairs or ignores, citing the rule each breaks', () => {
        const doc = withHeader({ perspective: null }, [
            { seq: 'R1.A.1', t: 'FUTURE_THING' as never } as unknown as GameEvent,
            { seq: 'R1.A.2', t: 'FUTURE_THING' as never } as unknown as GameEvent,
            { seq: 'R1.A.3', t: 'MOVE', card: 'A', from: 'deck', to: 'deck', p: 1 },
            { seq: 'R1.A.4', t: 'MOVE', card: 'A', from: '', to: 'hand', p: 1 },
            { seq: 'R1.A.5', t: 'MOVE', card: 'A', from: 'hand', to: 'groundArena', p: 1 },
            { seq: 'R1.A.6', t: 'PLAY', card: 'A', zone: 'Ground', p: 1 },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: { round: 2, phase: 'action', initiative: 1, players: {} } },
        ]);
        const m = msgs(doc);
        expect(m).toEqual([
            expect.stringContaining('1 unknown event type folded as "do nothing" (§18): FUTURE_THING ×2'),
            expect.stringContaining('2 MOVEs with an empty or identical from/to'),
            expect.stringContaining('2 records naming a zone outside the vocabulary'),
            expect.stringContaining('1 keyframe missing a seat'),
        ]);
    });

    it('does not throw on a hostile events line', () => {
        const doc = withHeader({ perspective: null }, [null, 5, 'x'] as unknown as GameEvent[]);
        expect(() => fileIssues(doc)).not.toThrow();
    });
});

describe('fileIssues — RecorderErrors (§5.2)', () => {
    it('warns that events were dropped when the writer says handlers failed', () => {
        const m = msgs(withHeader({ perspective: null, recorderErrors: 2 }));
        expect(m).toEqual([expect.stringContaining('2 recorder errors')]);
        expect(msgs(withHeader({ perspective: null, recorderErrors: 0 }))).toEqual([]);
    });
});

describe('writerGeneration — which 1.0 writer wrote the file (§22, §22.1)', () => {
    const current = () => parse(VECTOR);
    const ev = (over: object): GameEvent => ({ seq: 'R1.A.9', ...over } as GameEvent);

    it('says nothing about a current-writer file (every vector)', async () => {
        const { readdirSync } = await import('fs');
        const dir = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
        for (const f of readdirSync(dir).filter((n) => n.endsWith('.swupgn'))) {
            expect(writerGeneration(parse(readFileSync(path.join(dir, f), 'utf-8'))), f).toEqual([]);
        }
    });

    it('detects a pre-release 1.1 file, a missing CARDS index and a missing STORY', () => {
        const doc = current();
        const notes = writerGeneration({ ...doc, header: { ...doc.header, game: 'SWU-PGN/1.1' }, cards: [], story: [] });
        expect(notes).toEqual([
            expect.stringContaining('Pre-release SWU-PGN/1.1'),
            expect.stringContaining('No CARDS index'),
            expect.stringContaining('No STORY section'),
        ]);
    });

    it('detects the early story wording, pre-STATS and pre-counted-resources writers from the records', () => {
        const doc = current();
        const stripped = doc.events.filter((e) => e.t !== 'STATS' && e.t !== 'EXHAUST_RESOURCES');
        const notes = writerGeneration({ ...doc, story: ['  1. Player 1 plays Wampa (2 resources)'], events: stripped });
        expect(notes).toEqual([
            expect.stringContaining('(N resources)'),
            expect.stringContaining('Pre-STATS writer'),
            expect.stringContaining('Pre-counted-resources writer'),
        ]);
    });

    it('detects keyframes that carry no leader/deck/initiative status, or no captives', () => {
        const doc = current();
        const events = doc.events.map((e) => {
            if ((e.t !== 'ROUND_START' && e.t !== 'ROUND_END') || !e.keyframe) return e;
            const players = Object.fromEntries(Object.entries(e.keyframe.players).map(([seat, p]) => {
                const { leader: _l, deckSize: _d, ...rest } = p!;
                void _l; void _d;
                return [seat, { ...rest, cards: rest.cards.map((c) => { const { captured: _c, ...cc } = c; void _c; return cc; }) }];
            }));
            return { ...e, keyframe: { ...e.keyframe, players } } as GameEvent;
        });
        const notes = writerGeneration({ ...doc, events });
        expect(notes).toEqual([
            expect.stringContaining('Keyframes carry no leader'),
            expect.stringContaining('Keyframes carry no captives'),
        ]);
    });

    it('detects each early record shape by its own row of the §22 table', () => {
        const doc = current();
        const events: GameEvent[] = [
            ...doc.events,
            ev({ t: 'TAKE_CONTROL', p: 2, card: 'SOR#108' }),
            ev({ t: 'CAPTURE', p: 2, card: 'SOR#108' }),
            ev({ t: 'MOVE', card: 'X#1', from: 'ground', to: 'discard', p: 1, attachedTo: 'SOR#108' }),
            ev({ t: 'MOVE', card: 'X#2', from: 'outsideTheGame', to: 'deck', p: 1 }),
            ev({ t: 'READY', card: 'SOR#108:2' }),
            ev({ seq: 'R2.A.end', t: 'GAME_END', winner: 1, reason: 'concede' }),
        ];
        const notes = writerGeneration({ ...doc, header: { ...doc.header, engine: 'forceteki@0.1.0' }, events });
        expect(notes).toEqual([
            expect.stringContaining('1 control change recorded without a zone'),
            expect.stringContaining('1 capture naming no captor'),
            expect.stringContaining('Exit MOVEs name a host'),
            expect.stringContaining('Deck construction recorded as 1 MOVE'),
            expect.stringContaining('Per-card READY of a resource'),
            expect.stringContaining('GAME_END shares its seq'),
            expect.stringContaining('package version, not a commit'),
        ]);
    });

    it('does not throw on a hostile events line', () => {
        const doc = current();
        expect(() => writerGeneration({ ...doc, events: [null, 5, { t: 'ROUND_START', keyframe: { players: { 1: null, 2: 'x' } } }] as unknown as GameEvent[] })).not.toThrow();
    });

    it('detects a base Epic Action activated by card id instead of base@N (§22)', () => {
        const doc = current();
        // Neither a `base@N` ref nor either seat's leader id: the early-writer shape.
        const events: GameEvent[] = [...doc.events, ev({ t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#028', epic: true })];
        const notes = writerGeneration({ ...doc, events });
        expect(notes).toEqual([expect.stringContaining('1 Epic Action activated by a card the file names by id')]);
    });

    it('does not flag a base@N ref or a leader id activating its Epic Action', () => {
        const doc = current();
        const events: GameEvent[] = [
            ...doc.events,
            ev({ t: 'ABILITY_ACTIVATE', p: 1, card: 'base@1', epic: true }),
            ev({ t: 'ABILITY_ACTIVATE', p: 1, card: doc.header.p1Leader, epic: true }),
            // Value: protects=a mirror match's seat-2 leader copy (`SET#NUM:2`, §11) using its Epic Action is a leader, not the early-writer base shape; fails_when=leaderIds compares raw ids again; why_new=no test used a copy id; seam=none; no_claim=none beyond protects
            ev({ t: 'ABILITY_ACTIVATE', p: 2, card: `${doc.header.p2Leader}:2`, epic: true }),
            // A non-epic activation by card id is unremarkable either way.
            ev({ t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#028', epic: false }),
        ];
        expect(writerGeneration({ ...doc, events })).toEqual([]);
    });
});

// Regression proof — fails at HEAD: yes (the pilot PASS row fired) · passes at base: manual (314202d, before the row existed) · passes after fix: yes (claimedThisPhase)
// Value: protects=File Health quiet on a current file whose opponent plays out the phase after a claim; fails_when=pilot PASS row counts a PASS after own action following CLAIM_INITIATIVE; why_new=no vector claims the initiative; seam=none; no_claim=the five other pilot rows
describe('writerGeneration — a current file that claims the initiative is not a pilot file (§22, CR 6)', () => {
    it('a PASS after the same player\'s own actions, once the opponent has claimed, is the Pass action', () => {
        // The claimer has passed for the phase (spec §10.2: CLAIM_INITIATIVE is its own action
        // and no PASS follows it), so the opponent acts alone and its PASS ends the phase.
        const doc = parse(VECTOR);
        const after: GameEvent[] = [
            { seq: 'R3.start', t: 'ROUND_START', round: 3 },
            { seq: 'R3.A.start', t: 'PHASE_START', phase: 'action' },
            { seq: 'R3.A.1', t: 'CLAIM_INITIATIVE', p: 1 },
            { seq: 'R3.A.2', t: 'PLAY', p: 2, card: 'SOR#095:9', zone: 'ground' },
            { seq: 'R3.A.3', t: 'PASS', p: 2 },
        ] as GameEvent[];
        expect(writerGeneration({ ...doc, events: [...doc.events, ...after] })).toEqual([]);
    });
});

describe('every event type the fold handles is a known type (§10, §18)', () => {
    it('does not report a record this reader folds as unknown', () => {
        // The list is what tells a reader "this file uses something I do not understand".
        // A type the fold has a case for must never appear in it: LEADER_FLIP did, so a
        // conformant file with a flipped leader reported a format issue it did not have.
        const doc = withHeader({}, [
            { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
        ] as GameEvent[]);

        expect(fileIssues(doc).filter((i) => /unknown event type/.test(i.message))).toEqual([]);
    });
});

describe('fileIssues — what parse() read but could not use (§5.2, §18)', () => {
    // Value: protects=a garbled RecorderErrors is reported, survives export, and a garbled WriterRevision is still not a pilot file; fails_when=parse stops recording unreadable count tags or File Health/serialize ignore them; why_new=strict counts made malformed tags indistinguishable from absent; seam=none; no_claim=the writer's actual error count
    it('reports an unreadable count tag, keeps it on export, and does not call the file a pilot', () => {
        const text = VECTOR.replace('\n%%%', '\n[RecorderErrors "3.0"]\n[WriterRevision "one"]\n%%%');
        const doc = parse(text);
        expect(doc.header.recorderErrors).toBeUndefined();
        expect(fileIssues(doc).map((i) => i.message)).toEqual(expect.arrayContaining([
            expect.stringContaining('[RecorderErrors "3.0"] is present but not a count'),
            expect.stringContaining('[WriterRevision "one"] is present but not a count'),
        ]));
        expect(parse(serialize(doc)).unreadableTags).toEqual({ RecorderErrors: '3.0', WriterRevision: 'one' });
        const pilotPass = [...doc.events, { seq: 'R9.A.1', t: 'PLAY', p: 1, card: 'X', zone: 'ground' }, { seq: 'R9.A.2', t: 'PASS', p: 1 }] as GameEvent[];
        expect(writerGeneration({ ...doc, events: pilotPass })).toEqual([]);
    });

    // Value: protects=a skipped section is named in File Health so a misspelled banner is visible; fails_when=parse stops recording skipped section names; why_new=skipping unknown sections made them silent; seam=none; no_claim=what the skipped section contained
    it('names a section it skipped', () => {
        const doc = parse(VECTOR.replace('%%% EVENTS', '%%% EVENT\n{"seq":"x","t":"PASS","p":1}\n\n%%% EVENTS'));
        expect(fileIssues(doc).map((i) => i.message)).toEqual(expect.arrayContaining([expect.stringContaining('%%% EVENT)')]));
    });
});

describe('writerGeneration — the per-phase tracker resets at each phase (§22)', () => {
    const pilot = (events: GameEvent[]) => writerGeneration({ ...parse(VECTOR), events: [...parse(VECTOR).events, ...events] });
    const start = (r: number) => [{ seq: `R${r}.start`, t: 'ROUND_START', round: r }, { seq: `R${r}.A.start`, t: 'PHASE_START', phase: 'action' }] as GameEvent[];
    // Value: protects=a seat's PASS opening a new phase is not counted against its last action of the previous one; fails_when=lastAction survives the phase boundary; why_new=only same-phase cases were tested; seam=none; no_claim=current-writer files (gated by WriterRevision)
    it('a PASS that opens a phase is not a pilot PASS', () => {
        expect(pilot([...start(8), { seq: 'R8.A.1', t: 'PLAY', p: 1, card: 'X', zone: 'ground' }, ...start(9), { seq: 'R9.A.1', t: 'PASS', p: 1 }] as GameEvent[])
            .some((l) => l.includes('PASS written after every action'))).toBe(false);
    });
    // Value: protects=a claim only excuses the opponent's PASS in its own phase; fails_when=claimedThisPhase survives the phase boundary; why_new=the claim regression test covers one phase only; seam=none; no_claim=current-writer files
    it('a claim does not outlive its phase', () => {
        expect(pilot([...start(8), { seq: 'R8.A.1', t: 'CLAIM_INITIATIVE', p: 1 }, ...start(9),
            { seq: 'R9.A.1', t: 'PLAY', p: 2, card: 'Y', zone: 'ground' }, { seq: 'R9.A.2', t: 'PASS', p: 2 }] as GameEvent[]))
            .toEqual(expect.arrayContaining([expect.stringContaining('PASS written after every action')]));
    });
});

describe('a long unreadable count tag and an empty file', () => {
    // Value: protects=an unreadable count tag of any length goes back out on export intact; fails_when=parse keeps a shortened value for serialize; why_new=the round-trip test used short values; seam=none; no_claim=File Health's display (shortened on purpose)
    it('round-trips a 60-character garbled RecorderErrors intact and shows it shortened', () => {
        const garbled = 'x'.repeat(60);
        const doc = parse(VECTOR.replace('\n%%%', `\n[RecorderErrors "${garbled}"]\n%%%`));
        expect(parse(serialize(doc)).unreadableTags?.RecorderErrors).toBe(garbled);
        expect(fileIssues(doc).some((i) => i.message.includes(`${'x'.repeat(40)}…`))).toBe(true);
    });
    // Value: protects=a file whose events sit under a misspelled banner says which section was skipped; fails_when=the empty-file error drops skippedSections; why_new=parse no longer throws on an unknown section; seam=none; no_claim=the upload UI wiring
    it('names a skipped section when a file has no events', () => {
        const doc = parse(VECTOR.replace('%%% EVENTS', '%%% EVENT'));
        expect(doc.events).toHaveLength(0);
        expect(noEventsMessage(doc)).toBe('No events found in replay file (skipped unknown section: %%% EVENT).');
    });
});

// Value: protects=a file with thousands of junk %%% banners (or one huge name) cannot turn File Health, the no-events message or the export warning into a page-sized alert; fails_when=skippedSectionList prints the whole list or whole names again; why_new=the lists were printed in full; seam=none; no_claim=parse()'s own cap on sections
describe('skippedSectionList', () => {
    it('names at most three sections, each cut short, and counts the rest', () => {
        expect(skippedSectionList(['EVENT'])).toBe('%%% EVENT');
        expect(skippedSectionList(['A', 'B'], false)).toBe('A, B');
        const many = skippedSectionList(['A', 'B', 'X'.repeat(100), ...Array.from({ length: 5000 }, (_, i) => `S${i}`)]);
        expect(many).toBe(`%%% A, %%% B, %%% ${'X'.repeat(39)}… and 5000 more`);
    });
});
