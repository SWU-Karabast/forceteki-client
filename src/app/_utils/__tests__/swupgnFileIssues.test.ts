import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, type SwuPgnDocument, type GameEvent } from '@/lib/swupgn';
import { fileIssues, writerGeneration } from '../swupgnFileIssues';

const VECTOR = readFileSync(path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors/minimal.swupgn'), 'utf-8');

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
});
