import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, type SwuPgnDocument, type GameEvent } from '@/lib/swupgn';
import { fileIssues } from '../swupgnFileIssues';

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
