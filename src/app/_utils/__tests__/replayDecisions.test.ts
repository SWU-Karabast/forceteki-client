import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';
import { decisionPoints, autoBookmarks } from '../replayDecisions';

const SAMPLE = readFileSync(
    path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/sample-game.swupgn'),
    'utf-8',
);
const BASE = parse(SAMPLE);
const docWith = (events: GameEvent[]): SwuPgnDocument => ({ ...BASE, events });

describe('decisionPoints', () => {
    it('extracts CHOICE and MODAL_CHOICE from the sample with offered/chose intact', () => {
        const dps = decisionPoints(BASE);
        // sample has 1 MODAL_CHOICE + 3 CHOICE
        expect(dps).toHaveLength(4);
        expect(dps.filter((d) => d.type === 'MODAL_CHOICE')).toHaveLength(1);
        const choice = dps.find((d) => d.type === 'CHOICE')!;
        expect(choice.offered.length).toBeGreaterThan(0);
        expect(choice.chose).toBeGreaterThanOrEqual(0);
        expect(choice.chose).toBeLessThan(choice.offered.length);
    });
});

describe('autoBookmarks', () => {
    it('flags big damage at/above the threshold from the sample', () => {
        // sample DAMAGE amounts: 4, 3, 6 → threshold 4 keeps 4 and 6
        const marks = autoBookmarks(BASE, 4);
        const big = marks.filter((m) => m.kind === 'BIG_DAMAGE');
        expect(big).toHaveLength(2);
        expect(big.map((m) => m.amt).sort()).toEqual([4, 6]);
    });

    it('respects a custom threshold', () => {
        expect(autoBookmarks(BASE, 6).filter((m) => m.kind === 'BIG_DAMAGE')).toHaveLength(1);
        expect(autoBookmarks(BASE, 99).filter((m) => m.kind === 'BIG_DAMAGE')).toHaveLength(0);
    });

    it('captures defeats, overwhelm, initiative, and game end', () => {
        const events: GameEvent[] = [
            { seq: 'R1.A.1', t: 'CLAIM_INITIATIVE', p: 1 },
            { seq: 'R1.A.2', t: 'DEFEAT', card: 'SOR#095', reason: 'damage' },
            { seq: 'R1.A.3', t: 'OVERWHELM', p: 1, tgt: 'base@2', amt: 3, hp: 27 },
            { seq: 'R2.A.9', t: 'GAME_END', winner: 1, reason: 'base destroyed' },
        ];
        const kinds = autoBookmarks(docWith(events)).map((m) => m.kind);
        expect(kinds).toEqual(['INITIATIVE', 'DEFEAT', 'OVERWHELM', 'GAME_END']);
    });
});
