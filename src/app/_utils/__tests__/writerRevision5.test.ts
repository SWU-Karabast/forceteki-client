import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, render, fold, foldFrames, normalizeEvents, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';
import { serialize } from '@/lib/swupgn/serialize';
import { buildBeats, chapterMarks } from '../replayBeats';
import { storySeekIndex, storyLineTargets } from '../storySeek';
import { classifyBeat } from '../replayTransitions';
import { adaptState } from '../swupgnBoardAdapter';
import { frameAction, isPlayerAction } from '../replayAction';
import { isNumberedAction } from '../swupgnMoves';
import { resourcingReport } from '../resourcingReport';
import { fileIssues } from '../swupgnFileIssues';

/**
 * What forceteki writer revision 5 (spec Appendix C) changes for a READER: an additional phase
 * continues its phase's numbering (§9.1), a card played out of the other seat's deck is the
 * owner's MOVE and a TAKE_CONTROL ([W-43], §12.1), a resource given back is a TAKE_CONTROL
 * between resource rows, and P1Id/P2Id hash the account id. No vector covers the first three.
 */
const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const load = (name: string) => parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));
const SEATS = { 1: 'P1', 2: 'P2' } as const;

/** The minimal vector's header and decks, with `events` in place of its own. */
function withEvents(events: GameEvent[]): SwuPgnDocument {
    const doc = load('minimal');
    return { ...doc, story: [], events, annotations: [] };
}

/** The minimal vector's events up to and including its first action phase's PHASE_START. */
function untilRound1Action(): GameEvent[] {
    const events = load('minimal').events;
    return events.slice(0, events.findIndex((e) => e.seq === 'R1.A.start') + 1);
}

describe('an additional phase continues its phase\'s numbering (§9.1, writer revision 5)', () => {
    // Max Rebo's extra regroup: the second regroup's PHASE_START and PHASE_END take the next
    // numbers in the phase (R1.G.5, R1.G.9) instead of repeating R1.G.start / R1.G.end. Regroup
    // has no player action of its own; the PASS at R1.G.8 is synthetic, there only so a
    // numbered story line falls inside the second phase.
    const events: GameEvent[] = [
        { seq: 'R1.start', t: 'ROUND_START', round: 1 },
        { seq: 'R1.A.start', t: 'PHASE_START', phase: 'action' },
        { seq: 'R1.A.0a', t: 'MOVE', card: 'SOR#108', from: 'hand', to: 'ground', p: 1, kind: 'unit', for: 'R1.A.1' },
        { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'SOR#108', zone: 'ground', cost: 2 },
        { seq: 'R1.A.2', t: 'PASS', p: 2 },
        { seq: 'R1.A.3', t: 'PASS', p: 1 },
        { seq: 'R1.A.end', t: 'PHASE_END', phase: 'action' },
        { seq: 'R1.G.start', t: 'PHASE_START', phase: 'regroup' },
        { seq: 'R1.G.1', t: 'MOVE', card: 'SOR#108:2', from: 'deck', to: 'hand', p: 1, kind: 'unit' },
        { seq: 'R1.G.2', t: 'DRAW', p: 1, count: 1, cards: ['SOR#108:2'] },
        { seq: 'R1.G.3', t: 'MOVE', card: 'SOR#108:2', from: 'hand', to: 'resource', p: 1, kind: 'unit', for: 'R1.G.4' },
        { seq: 'R1.G.4', t: 'RESOURCE', p: 1, card: 'SOR#108:2' },
        { seq: 'R1.G.end', t: 'PHASE_END', phase: 'regroup' },
        { seq: 'R1.G.5', t: 'PHASE_START', phase: 'regroup' },
        { seq: 'R1.G.6', t: 'MOVE', card: 'SOR#108:3', from: 'deck', to: 'hand', p: 1, kind: 'unit' },
        { seq: 'R1.G.7', t: 'DRAW', p: 1, count: 1, cards: ['SOR#108:3'] },
        { seq: 'R1.G.8', t: 'PASS', p: 1 },
        { seq: 'R1.G.9', t: 'PHASE_END', phase: 'regroup' },
        { seq: 'R1.end', t: 'ROUND_END', round: 1 },
        { seq: 'R2.start', t: 'ROUND_START', round: 2 },
        { seq: 'R2.A.start', t: 'PHASE_START', phase: 'action' },
        { seq: 'R2.A.1', t: 'ATTACK', p: 1, atk: 'SOR#108', def: 'base@2', defenderType: 'base' },
        { seq: 'R2.A.1a', t: 'DAMAGE', src: 'SOR#108', tgt: 'base@2', amt: 4, hp: 26 },
    ] as GameEvent[];
    const doc = withEvents(events);

    it('has no duplicate seq, and folds', () => {
        expect(new Set(events.map((e) => e.seq)).size).toBe(events.length);
        const norm = normalizeEvents(doc.events);
        expect(foldFrames(norm)).toHaveLength(norm.length);
        const s = fold(norm);
        expect(s.players[1]!.cards.map((c) => c.id)).toEqual(['SOR#108']);
        expect(s.players[1]!.hand).toContain('SOR#108:3');
        expect(s.players[2]!.baseHp).toBe(26);
    });

    it('the scrubber shows two regroup ticks', () => {
        const norm = normalizeEvents(doc.events);
        const marks = chapterMarks(buildBeats(norm), norm).filter((m) => m.kind === 'phase').map((m) => m.label);
        expect(marks).toEqual(['Action', 'Regroup', 'Regroup', 'Action']);
    });

    it('a story-line seek lands on the right record in the second phase, by render()\'s numbering', () => {
        const norm = normalizeEvents(doc.events);
        const lines = render(doc).split('\n');
        expect(lines.filter((l) => /── regroup ──/.test(l))).toHaveLength(2);
        const targets = storyLineTargets(lines, storySeekIndex(norm));
        const second = lines.findIndex((l, i) => /── regroup ──/.test(l) && lines.slice(0, i).some((x) => /── regroup ──/.test(x)));
        const passLine = lines.findIndex((l, i) => i > second && /^\s+1\. Player 1 passes/.test(l));
        expect(passLine).toBeGreaterThan(second);
        expect(norm[targets[passLine]!].seq).toBe('R1.G.8');
        const attackLine = lines.findIndex((l) => /^\s+1\. Player 1 attacks/.test(l));
        expect(norm[targets[attackLine]!].seq).toBe('R2.A.1');
    });

    it('a seq link to the second phase\'s edge lands there, not on the first', () => {
        const norm = normalizeEvents(doc.events);
        const i = norm.findIndex((e) => e.seq === 'R1.G.9');
        expect(norm[i].t).toBe('PHASE_END');
        expect(i).toBeGreaterThan(norm.findIndex((e) => e.seq === 'R1.G.end'));
    });
});

describe('[W-43]: a card played out of the other seat\'s deck (§12.1)', () => {
    // Vermillion lets Player 2 play Player 1's top card: Player 1's MOVE out of their own deck,
    // then a TAKE_CONTROL to Player 2, then Player 2's PLAY.
    const steal: GameEvent[] = [
        { seq: 'R1.A.0a', t: 'MOVE', card: 'SOR#108:4', from: 'deck', to: 'ground', p: 1, kind: 'unit', for: 'R1.A.1' },
        { seq: 'R1.A.0b', t: 'TAKE_CONTROL', p: 2, card: 'SOR#108:4', zone: 'ground', from: 1, for: 'R1.A.1' },
        { seq: 'R1.A.1', t: 'PLAY', p: 2, card: 'SOR#108:4', zone: 'ground', cost: 0 },
    ] as GameEvent[];
    const doc = withEvents([...untilRound1Action(), ...steal]);
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const before = frames[events.length - steal.length - 1];
    const after = frames[frames.length - 1];

    it('leaves the owner\'s deck and lands on the controller\'s side', () => {
        expect(after.players[1]!.deckSize).toBe(before.players[1]!.deckSize! - 1);
        expect(after.players[2]!.deckSize).toBe(before.players[2]!.deckSize);
        expect(after.players[1]!.cards.map((c) => c.id)).not.toContain('SOR#108:4');
        expect(after.players[2]!.cards.map((c) => c.id)).toContain('SOR#108:4');
    });

    it('the board shows it in Player 2\'s ground arena, owned by Player 1', () => {
        const gs = adaptState(after, doc, SEATS);
        const card = gs.players.P2.cardPiles.groundArena.find((c: { uuid: string }) => c.uuid === 'SOR#108:4');
        expect(card).toMatchObject({ controllerId: 'P2', ownerId: 'P1' });
        expect(gs.players.P1.cardPiles.groundArena.some((c: { uuid: string }) => c.uuid === 'SOR#108:4')).toBe(false);
    });

    it('the replay shows it as a steal to Player 2', () => {
        const beats = buildBeats(events);
        const beat = beats.find((b) => b.start <= events.length - 1 && b.end >= events.length - 1)!;
        const transitions = classifyBeat(beat, events, frames[beat.start - 1], frames[beat.end]);
        expect(transitions).toContainEqual({ kind: 'steal', card: 'SOR#108:4', to: 2 });
    });
});

describe('a resource given back to its owner\'s row is a TAKE_CONTROL (writer revision 5)', () => {
    // DJ steals one of Player 2's ready resources; when DJ leaves play it goes back. Revision 5
    // writes the return as a TAKE_CONTROL between resource rows; before it, nothing was written.
    const djEvents: GameEvent[] = [
        { seq: 'R1.A.1', t: 'TAKE_CONTROL', p: 1, card: 'SOR#045:4', zone: 'resource', from: 2 },
        { seq: 'R1.A.2', t: 'PASS', p: 2 },
        { seq: 'R1.A.3', t: 'TAKE_CONTROL', p: 2, card: 'SOR#045:4', zone: 'resource', from: 1 },
    ] as GameEvent[];
    const doc = withEvents([...untilRound1Action(), ...djEvents]);
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const total = (i: number, seat: 1 | 2) => frames[i].players[seat]!.resourcesReady + frames[i].players[seat]!.resourcesExhausted;
    const start = events.length - djEvents.length - 1;

    it('moves one resource each way, once', () => {
        expect(total(start + 1, 1)).toBe(total(start, 1) + 1);
        expect(total(start + 1, 2)).toBe(total(start, 2) - 1);
        expect(total(events.length - 1, 1)).toBe(total(start, 1));
        expect(total(events.length - 1, 2)).toBe(total(start, 2));
        expect(frames[events.length - 1].players[2]!.resources ?? []).toContain('SOR#045:4');
        expect(frames[events.length - 1].players[1]!.resources ?? []).not.toContain('SOR#045:4');
    });

    it('is not a play: not numbered, not a play transition, not counted as resourcing', () => {
        const back = events[events.length - 1];
        expect(isNumberedAction(back)).toBe(false);
        expect(isPlayerAction(back)).toBe(false);
        expect(frameAction(back, { nameOf: (id) => id }).kind).toBe('other');
        const beats = buildBeats(events);
        const kinds = beats.filter((b) => b.end > start).flatMap((b) => classifyBeat(b, events, frames[b.start - 1], frames[b.end]).map((t) => t.kind));
        expect(kinds).not.toContain('play');
        expect(kinds).not.toContain('resource');
        // The resourcing report counts the same with and without the two control changes.
        const totals = (d: SwuPgnDocument) => {
            const r = resourcingReport(d);
            return ([1, 2] as const).map((seat) => [r.summary[seat].totalResourced, r.summary[seat].totalPlayed]);
        };
        expect(totals(doc)).toEqual(totals(withEvents(untilRound1Action())));
        expect(resourcingReport(doc).byRound.some((r) => r.resourced > 0)).toBe(true);
        expect(fileIssues(doc)).toEqual([]);
    });
});

describe('P1Id / P2Id are opaque (§17): revision 5 changed their values, and nothing reads them', () => {
    // Every real-game vector, now WriterRevision 6 (6147b3c58), which still hashes the ids.
    it.each(['arrest', 'capture', 'control', 'death-star', 'effects', 'homeworlds', 'organic', 'pilot', 'stolen-hauler', 'upgrades', 'visibility'])('%s: hashed ids, and an export writes the header back byte for byte', (name) => {
        const text = readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8');
        const doc = parse(text);
        expect(doc.header.writerRevision).toBe(6);
        expect(doc.header.p1Id).toMatch(/^sha256:[0-9a-f]{64}$/);
        expect(doc.header.p2Id).toMatch(/^sha256:[0-9a-f]{64}$/);
        const header = (t: string) => t.slice(0, t.indexOf('\n%%%'));
        // serialize() follows the file's own tag order (ParseNotes.tagOrder), so forceteki's
        // EndDate-last header comes back exactly, P1Id/P2Id and WriterRevision included.
        const out = serialize(doc);
        expect(header(out)).toBe(header(text));
        expect(parse(out).header).toEqual(doc.header);
    });
});
