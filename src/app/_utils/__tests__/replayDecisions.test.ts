import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';
import { decisionPoints, autoBookmarks, bookmarkLabel, type Bookmark } from '../replayDecisions';

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
            { seq: 'R1.A.2', t: 'DEFEAT', card: 'SOR#095', reason: 'attack' },
            { seq: 'R1.A.3', t: 'OVERWHELM', p: 1, tgt: 'base@2', amt: 3, hp: 27 },
            { seq: 'R2.A.9', t: 'GAME_END', winner: 1, reason: 'base destroyed' },
        ];
        const kinds = autoBookmarks(docWith(events)).map((m) => m.kind);
        expect(kinds).toEqual(['INITIATIVE', 'DEFEAT', 'OVERWHELM', 'GAME_END']);
    });
});

describe('bookmarkLabel', () => {
    // Value: protects=a pilot file's "Framework effect" big hit is bookmarked as the empty-deck draw end to end; fails_when=autoBookmarks reads the raw stream again; why_new=the label test built a sourceless bookmark by hand; seam=none; no_claim=turnDigests wording
    it('bookmarks a Framework-effect big hit as the empty-deck draw', () => {
        const doc = { events: [{ seq: 'R1.A.1', t: 'DAMAGE', src: 'Framework effect:2', tgt: 'base@1', amt: 6, damageType: 'ability', hp: 24 }] } as unknown as SwuPgnDocument;
        const big = autoBookmarks(doc).find((b) => b.kind === 'BIG_DAMAGE')!;
        expect(bookmarkLabel(big, (id) => id)).toMatch(/^Drawing from an empty deck hits Player 1's base for 6$/);
    });

    // Value: protects=a big hit no card dealt (an empty-deck draw) reads as that, not as a blank name; fails_when=the sourceless branch reverts to nameOf(''); why_new=BIG_DAMAGE tests only count marks; seam=none; no_claim=bookmark detection
    it('names a sourceless big hit as the empty-deck draw', () => {
        expect(bookmarkLabel({ seq: 'R1.A.1', kind: 'BIG_DAMAGE', tgt: 'base@1', amt: 5 } as Bookmark, (id) => id)).toMatch(/^Drawing from an empty deck hits .* for 5$/);
    });

    // Value: protects=a defeat bookmark words its reason for people and never shows the enum; fails_when=the label interpolates the raw DefeatReason again; why_new=the enum changed but no label test read it; seam=none; no_claim=GAME_END reasons
    it('words a defeat reason, passes an older one through and says nothing for unknown', () => {
        const label = (reason?: string) => bookmarkLabel({ seq: 'R1.A.1', kind: 'DEFEAT', card: 'Wampa', reason } as Bookmark, (id) => id);
        expect(label('attack')).toBe('Wampa defeated (in combat)');
        expect(label('nonCombatDamage')).toBe('Wampa defeated (by damage)');
        expect(label('frameworkEffect')).toBe('Wampa defeated (by the rules)');
        expect(label('ability')).toBe('Wampa defeated (by an ability)');
        expect(label('uniqueRule')).toBe('Wampa defeated (by the unique rule)');
        expect(label('damage')).toBe('Wampa defeated (damage)');
        expect(label('unknown')).toBe('Wampa defeated');
        expect(label('constructor')).toBe('Wampa defeated (constructor)');
        expect(label(undefined)).toBe('Wampa defeated');
    });
});
