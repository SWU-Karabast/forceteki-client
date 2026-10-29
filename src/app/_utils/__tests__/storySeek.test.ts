import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, render, normalizeEvents, type GameEvent } from '@/lib/swupgn';
import { storySeekIndex, storyLineTargets, storyNumbersAbilities } from '../storySeek';

const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const load = (name: string) => parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));

describe('story lines seek to the event that produced them (spec §16 numbering)', () => {
    it.each(['minimal', 'organic', 'upgrades', 'pilot', 'capture', 'arrest', 'homeworlds', 'death-star'])('%s: every numbered line lands on a numbered event whose wording it carries', (name) => {
        const doc = load(name);
        const events = normalizeEvents(doc.events);
        const lines = render(doc).split('\n');
        const targets = storyLineTargets(lines, storySeekIndex(events));
        let numbered = 0;
        lines.forEach((line, i) => {
            const m = /^\s{1,4}(\d+)\.\s(Player [12]) (plays|deploys|attacks|passes|claims|uses)/.exec(line);
            if (!m) return;
            numbered++;
            const e = events[targets[i]!] as GameEvent & { p?: number };
            expect(e, line).toBeDefined();
            expect(['PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER', 'ATTACK', 'PASS', 'CLAIM_INITIATIVE', 'ABILITY_ACTIVATE'], line).toContain(e.t);
            expect(`Player ${e.p}`, line).toBe(m[2]);
        });
        expect(numbered).toBeGreaterThan(0);
        // Round banners seek to their ROUND_START.
        lines.forEach((line, i) => {
            const r = /^ ROUND (\d+)/.exec(line);
            if (r) expect((events[targets[i]!] as { round?: number }).round).toBe(Number(r[1]));
        });
    });

    it('restarts at each phase and skips consequences, so an ability activation or a claim does not shift later clicks', () => {
        const events: GameEvent[] = [
            { seq: 'R1.start', t: 'ROUND_START', round: 1 },
            { seq: 'R1.A.start', t: 'PHASE_START', phase: 'action' },
            { seq: 'R1.A.1', t: 'CLAIM_INITIATIVE', p: 1 },
            { seq: 'R1.A.1a', t: 'ABILITY_ACTIVATE', p: 1, card: 'L' },
            { seq: 'R1.A.2', t: 'PASS', p: 2 },
            { seq: 'R1.G.start', t: 'PHASE_START', phase: 'regroup' },
            { seq: 'R1.G.1', t: 'PLAY', p: 1, card: 'X' },
        ];
        const idx = storySeekIndex(events);
        expect(idx.get('R1')).toBe(0);
        expect(idx.get('R1.1.1')).toBe(2);
        expect(idx.get('R1.1.2')).toBe(4);
        expect(idx.get('R1.2.1')).toBe(6);
        const lines = ['', ' ROUND 1', ' ── action ──', '  1. Player 1 claims initiative', '       ↳ L uses an ability', '  2. Player 2 passes', ' ── regroup ──', '  1. Player 1 plays X'];
        expect(storyLineTargets(lines, idx)).toEqual([undefined, 0, undefined, 2, undefined, 4, undefined, 6]);
    });

    it('death-star: the Epic Action is the numbered action and the deploy it performs is not (§10.4)', () => {
        const doc = load('death-star');
        const events = normalizeEvents(doc.events);
        const lines = render(doc).split('\n');
        const targets = storyLineTargets(lines, storySeekIndex(events, storyNumbersAbilities(lines, events)));
        const i = lines.findIndex((l) => /^\s+\d+\. Player 1 uses Grand Moff Tarkin.*Epic Action/.test(l));
        expect(events[targets[i]!].seq).toBe('R8.A.1');
        expect(lines[i + 1]).toMatch(/↳ Player 1 deploys .* as The Death Star/);
        expect(targets[i + 1]).toBeUndefined();
    });

    it('a story that indents action abilities (an early writer) is counted without them', () => {
        const events: GameEvent[] = [
            { seq: 'R1.start', t: 'ROUND_START', round: 1 },
            { seq: 'R1.A.start', t: 'PHASE_START', phase: 'action' },
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'L', kind: 'action' },
            { seq: 'R1.A.2', t: 'PASS', p: 2 },
        ];
        const old = ['', ' ROUND 1', ' ── action ──', '       ↳ L uses an ability', '  1. Player 2 passes'];
        expect(storyNumbersAbilities(old, events)).toBe(false);
        expect(storyLineTargets(old, storySeekIndex(events, false))[4]).toBe(3);
        const current = ['', ' ROUND 1', ' ── action ──', '  1. Player 1 uses L', '  2. Player 2 passes'];
        expect(storyNumbersAbilities(current, events)).toBe(true);
        expect(storyLineTargets(current, storySeekIndex(events, true)).slice(3)).toEqual([2, 3]);
    });

    it('ignores a hostile events line', () => {
        expect(() => storySeekIndex([null, 5] as unknown as GameEvent[])).not.toThrow();
    });
});

describe('each writer generation\'s own STORY seeks to the right records', () => {
    // Value: protects=click-to-seek on a file's own STORY for both live writer generations; fails_when=storyNumbersAbilities misjudges a generation or the numbering rule drifts; why_new=only rendered stories and a hand-made one were tested; seam=none; no_claim=story wording
    it.each(['game-463c3022.swupgn', 'game-20260912-writer-d1-d9.swupgn'])('%s', (f) => {
        const doc = parse(readFileSync(path.join(DIR, '..', f), 'utf-8'));
        const events = normalizeEvents(doc.events);
        const lines = doc.story ?? [];
        const t = storyLineTargets(lines, storySeekIndex(events, storyNumbersAbilities(lines, events)));
        let n = 0;
        lines.forEach((l, i) => {
            const m = /^\s*\d+\.\s+Player ([12])/.exec(l);
            if (!m) return;
            n++;
            expect(String((events[t[i]!] as { p?: number })?.p), l).toBe(m[1]);
        });
        expect(n).toBeGreaterThan(50);
    });
});
