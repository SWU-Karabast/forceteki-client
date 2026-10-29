import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, normalizeEvents, indexResolver, type GameEvent } from '@/lib/swupgn';
import { groupsByAdjacency } from '../swupgnWriter';
import { buildBeats, beatAt, beatAnchorSeqs, captionForBeat, chapterMarks, playbackStep, type Beat } from '../replayBeats';
import { frameAction, storyName } from '../replayAction';

const doc = parse(readFileSync(join(__dirname, '../../../lib/swupgn/__tests__/fixtures/game-463c3022.swupgn'), 'utf8'));
const events = normalizeEvents(doc.events, new Set());
const beats = buildBeats(events, { adjacency: groupsByAdjacency(doc.header) });
const frameOf = (seq: string) => events.findIndex((e) => e.seq === seq);
const span = (seq: string) => { const b = beatAt(beats, frameOf(seq)); return [events[b.start].seq, events[b.end].seq, events[b.anchor].seq, b.kind]; };

describe('buildBeats', () => {
    it('tiles the whole stream contiguously and ascending', () => {
        expect(beats[0].start).toBe(0);
        expect(beats[beats.length - 1].end).toBe(events.length - 1);
        for (let i = 1; i < beats.length; i++) expect(beats[i].start).toBe(beats[i - 1].end + 1);
        for (const b of beats) { expect(b.anchor).toBeGreaterThanOrEqual(b.start); expect(b.anchor).toBeLessThanOrEqual(b.end); expect(b.index).toBe(beats.indexOf(b)); }
    });

    // Value: protects=a hostile file's long seq cannot hang buildBeats on load; fails_when=a backtracking /^(.*?)[a-z]+$/ returns to the seq split; why_new=no test fed an oversized seq; seam=none; no_claim=other per-record work on huge files
    it('splits a lettered seq in linear time, so a hostile seq cannot hang the page', () => {
        const hostile = 'R1.A.1' + 'a'.repeat(300_000) + '!';
        const lettered = 'R1.A.1' + 'a'.repeat(300_000);
        const stream = [
            { seq: 'R1.A.1', t: 'PASS', p: 1 },
            { seq: hostile, t: 'PASS', p: 2 },
            { seq: lettered, t: 'DAMAGE', card: 'SOR#1', amount: 1 },
        ] as unknown as GameEvent[];
        const t0 = performance.now();
        const out = buildBeats(stream);
        // gstack-timing-ok: the quadratic regex took ~30s at this size, the scan takes ~1ms; 2s only separates the two
        expect(performance.now() - t0).toBeLessThan(2000);
        // The lettered record still rides with the action its base names.
        expect(out[out.length - 1].end).toBe(2);
        expect(beatAt(out, 2).anchor).toBe(0);
    });

    it('turns 540 records into 134 beats', () => {
        expect(beats).toHaveLength(134);
        const kinds = beats.reduce<Record<string, number>>((m, b) => ({ ...m, [b.kind]: (m[b.kind] ?? 0) + 1 }), {});
        expect(kinds).toEqual({ banner: 22, draw: 14, resource: 12, action: 80, ready: 6 });
    });

    it('a leader\'s action ability is its own beat, not part of the PASS it was filed under (Part D-2)', () => {
        expect(span('R2.A.6')).toEqual(['R2.A.6', 'R2.A.6', 'R2.A.6', 'action']);
        expect(span('R2.A.6a')).toEqual(['R2.A.6a', 'R2.A.6j', 'R2.A.6a', 'action']);   // Krennic defeats Mercenary, then resources it
        expect(span('R2.A.6i')[2]).toBe('R2.A.6a');                                        // the RESOURCE inside it rides along
        expect(span('R4.A.5b')).toEqual(['R4.A.5b', 'R4.A.5b', 'R4.A.5b', 'action']);   // Leia's action
    });

    it('an action owns its for-stamped precursors and its lettered consequences', () => {
        // R2.A.2a EXHAUST_RESOURCES for R2.A.3, R2.A.2b MOVE hand->ground, R2.A.2c STATS, R2.A.2d EXHAUST, R2.A.3 PLAY
        expect(span('R2.A.3')).toEqual(['R2.A.2a', 'R2.A.3', 'R2.A.3', 'action']);
        // R2.A.0a CHOICE for R2.A.1, R2.A.0b EXHAUST for R2.A.1, R2.A.1 ATTACK, R2.A.1a..R2.A.1f
        expect(span('R2.A.1')).toEqual(['R2.A.0a', 'R2.A.1f', 'R2.A.1', 'action']);
        expect(span('R4.A.6')).toEqual(['R4.A.5c', 'R4.A.6k', 'R4.A.6', 'action']);
    });

    it('a bare PASS is its own beat and a trailing PHASE_END rides with the last action', () => {
        expect(span('R1.A.2')).toEqual(['R1.A.2', 'R1.A.2', 'R1.A.2', 'action']);
        expect(span('R1.A.end')).toEqual(['R1.A.6', 'R1.A.end', 'R1.A.6', 'action']);
    });

    it('merges a seat\'s opening resource picks, a draw burst and the regroup ready step', () => {
        // The unstamped MOVE before each RESOURCE is its precursor (Part D-3); P2's first MOVE (R0.S.24) is not P1's.
        expect(span('R0.S.21')).toEqual(['R0.S.20', 'R0.S.23', 'R0.S.23', 'resource']);
        expect(span('R0.S.25')).toEqual(['R0.S.24', 'R0.S.end', 'R0.S.27', 'resource']);
        expect(span('R0.S.3')[3]).toBe('draw');
        expect(span('R0.S.3')[0]).toBe('R0.S.3');
        // The run's anchor is its last DRAW/MOVE, not the SHUFFLE appended after it.
        expect(events[beatAt(beats, frameOf('R0.S.3')).anchor].t).not.toBe('SHUFFLE');
        expect(span('R1.G.12')).toEqual(['R1.G.11', 'R1.end', 'R1.G.16', 'ready']);
    });

    it('banners are single-frame beats', () => {
        expect(span('R1.start')).toEqual(['R1.start', 'R1.start', 'R1.start', 'banner']);
        expect(span('R7.A.game-end')).toEqual(['R7.A.game-end', 'R7.A.game-end', 'R7.A.game-end', 'banner']);
    });

    it('beatAt clamps outside the range', () => {
        expect(beatAt(beats, -5)).toBe(beats[0]);
        expect(beatAt(beats, 9999)).toBe(beats[beats.length - 1]);
        expect(buildBeats([] as GameEvent[])).toEqual([]);
    });
});

describe('captionForBeat', () => {
    const resolver = indexResolver(doc.cards ?? []);
    const names = { nameOf: (id: string) => storyName(id, resolver) };
    it('names the anchor action and counts the records that resolved it', () => {
        const b = beatAt(beats, frameOf('R2.A.1'));
        expect(captionForBeat(b, events, names)).toEqual({
            label: frameAction(events[b.anchor], names).label,
            extra: 8,
        });
    });
    it('a bare PASS has no extras', () => {
        expect(captionForBeat(beatAt(beats, frameOf('R1.A.2')), events, names).extra).toBe(0);
    });
});

describe('chapterMarks', () => {
    it('one round mark per ROUND_START and one phase tick per PHASE_START, as beat indices', () => {
        const marks = chapterMarks(beats, events);
        expect(marks.filter((m) => m.kind === 'round').map((m) => m.label)).toEqual(['R1', 'R2', 'R3', 'R4', 'R5', 'R6', 'R7']);
        expect(marks.filter((m) => m.kind === 'phase')).toHaveLength(14);   // setup + 7 action + 6 regroup (the game ends in R7's action phase)
        expect(marks[0]).toEqual({ value: 0, label: 'Setup', kind: 'phase' });
        for (const m of marks) expect(beats[m.value].kind).toBe('banner');
    });
});

// Value: protects=Play and autoplay advance by beat, stop at the last frame, and a clip caps at its end and loops to its start; fails_when=the next-frame rule skips a beat, runs past the end or the clip, or stops a clip instead of looping; why_new=the rule lived inside the provider with no test; seam=none; no_claim=dwell timing and the React effect wiring
describe('playbackStep', () => {
    const beats = [
        { index: 0, kind: 'action', start: 0, end: 2, anchor: 0 },
        { index: 1, kind: 'action', start: 3, end: 5, anchor: 3 },
        { index: 2, kind: 'action', start: 6, end: 9, anchor: 6 },
    ] as Beat[];
    it('advances to the end of this beat, or of the next one from an end', () => {
        expect(playbackStep(beats, 0, 10, null)).toEqual({ kind: 'advance', to: 2 });
        expect(playbackStep(beats, 2, 10, null)).toEqual({ kind: 'advance', to: 5 });
    });
    it('stops at the last frame of the game', () => {
        expect(playbackStep(beats, 9, 10, null)).toEqual({ kind: 'stop' });
    });
    it('caps at a clip end and loops back to its start', () => {
        expect(playbackStep(beats, 3, 10, { start: 3, end: 4 })).toEqual({ kind: 'advance', to: 4 });
        expect(playbackStep(beats, 4, 10, { start: 3, end: 4 })).toEqual({ kind: 'loop', to: 3 });
        // Scrubbed past the clip's end: back to its start.
        expect(playbackStep(beats, 8, 10, { start: 3, end: 4 })).toEqual({ kind: 'loop', to: 3 });
    });
    it('stops on a one-frame clip instead of looping onto itself', () => {
        expect(playbackStep(beats, 4, 10, { start: 4, end: 4 })).toEqual({ kind: 'stop' });
    });
});

describe('beatAnchorSeqs', () => {
    // Value: protects=a note on any record of a beat is shown and badged on that beat's move; fails_when=the Discussion tab or the Moves badge keys by the raw record seq again (an attack note on R2.A.6a never badges move R2.A.6); why_new=Codex structured review (P2) found the tabs disagreeing; seam=none; no_claim=the tabs' markup
    it('maps every record of a beat to the beat\'s anchor seq', () => {
        const events = [
            { seq: 'R2.A.6', t: 'ATTACK', p: 1, atk: 'SOR#1', def: 'SOR#2' },
            { seq: 'R2.A.6a', t: 'DAMAGE', card: 'SOR#2', amt: 3 },
            { seq: 'R2.A.7', t: 'PASS', p: 2 },
        ] as unknown as GameEvent[];
        const beats: Beat[] = [
            { index: 0, kind: 'action', start: 0, end: 1, anchor: 0, seat: 1 },
            { index: 1, kind: 'action', start: 2, end: 2, anchor: 2, seat: 2 },
        ];
        const m = beatAnchorSeqs(events, beats);
        expect(m.get('R2.A.6a')).toBe('R2.A.6');
        expect(m.get('R2.A.6')).toBe('R2.A.6');
        expect(m.get('R2.A.7')).toBe('R2.A.7');
    });

    it('on a real game, every record maps to a seq that anchors a beat', () => {
        const events = normalizeEvents(doc.events);
        const beats = buildBeats(events, { adjacency: groupsByAdjacency(doc.header) });
        const m = beatAnchorSeqs(events, beats);
        const anchors = new Set(beats.map((b) => events[b.anchor].seq));
        expect(events.every((e) => anchors.has(m.get(e.seq)!))).toBe(true);
    });
});

