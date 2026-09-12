import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, normalizeEvents, checkKeyframes } from '../index';

// A game recorded on the current forceteki writer (Engine forceteki@463c3022), started at
// setup so no action-phase harness artifact (spec §21) is in it. Pins what the reader gets
// from the writer as it ships today, including its one known defect.
const text = readFileSync(join(__dirname, 'fixtures/game-463c3022.swupgn'), 'utf8');
// (The post-fix writer is pinned separately in writerD1toD9.test.ts.)

describe('fresh writer fixture (forceteki@463c3022)', () => {
    const doc = parse(text);

    it('parses the whole game and the reader drops nothing', () => {
        expect(doc.header.p1Leader).toBe('LAW#010');
        expect(doc.header.p2Leader).toBe('LAW#008');
        expect(doc.events).toHaveLength(540);
        expect(normalizeEvents(doc.events, new Set())).toHaveLength(540);
    });

    it('agrees with every keyframe except the writer defect in Part D-1 (initiativeTaken at ROUND_END)', () => {
        const r = checkKeyframes(doc.events);
        // This file is the PRE-FIX generation and keeps this expectation for good: forceteki
        // fixed D-1 on 2026-09-12 and `writerD1toD9.test.ts` pins the fixed writer at []. Both
        // have to keep working -- a saved replay from before the fix is still a valid file.
        expect(r.mismatches.map((m) => `${m.seq}:${m.path}:${m.expected}->${m.got}`)).toEqual([
            'R1.end:initiativeTaken:false->true',
            'R2.end:initiativeTaken:false->true',
            'R3.end:initiativeTaken:false->true',
            'R4.end:initiativeTaken:false->true',
            'R5.end:initiativeTaken:false->true',
            'R6.end:initiativeTaken:false->true',
        ]);
    });
});
