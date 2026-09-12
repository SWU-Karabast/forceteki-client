import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '@/lib/swupgn';
import { turnDigests, roundOfSeq } from '../turnDigests';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);
const BASE = parse(SAMPLE);

describe('roundOfSeq', () => {
    it('parses the round number from a seq', () => {
        expect(roundOfSeq('R1.A.3')).toBe(1);
        expect(roundOfSeq('R0.S.9')).toBe(0);
        expect(roundOfSeq('R12.G.1')).toBe(12);
        expect(roundOfSeq('weird')).toBeNull();
    });
});

describe('turnDigests', () => {
    const digests = turnDigests(BASE);

    it('produces one digest per round, in order, with a seek seq', () => {
        expect(digests.length).toBeGreaterThan(0);
        const rounds = digests.map((d) => d.round);
        expect([...rounds].sort((a, b) => a - b)).toEqual(rounds);
        // rounds that have a ROUND_START carry a seq to seek to
        expect(digests.some((d) => d.seq !== null)).toBe(true);
    });

    it('attaches per-seat resourcing rows and groups bookmarks into their round', () => {
        const withSeats = digests.find((d) => d.perSeat[1] || d.perSeat[2]);
        expect(withSeats).toBeDefined();
        // the sample's big-damage moments (rounds 1 & 2) land in those rounds
        const allMarks = digests.flatMap((d) => d.bookmarks);
        expect(allMarks.filter((m) => m.kind === 'BIG_DAMAGE').length).toBe(2);
        for (const d of digests) {
            for (const m of d.bookmarks) {
                expect(m.seq.startsWith(`R${d.round}.`)).toBe(true);
            }
        }
    });
});
