import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse, normalizeEvents, checkKeyframes, indexResolver, type GameEvent } from '../index';
import { buildBeats } from '@/app/_utils/replayBeats';
import { buildMoveList, isNumberedAction } from '@/app/_utils/swupgnMoves';
import { frameAction } from '@/app/_utils/replayAction';

/**
 * A game recorded AFTER forceteki fixed the four writer defects and shipped the five additions
 * this client asked for (Part D of the replay-viewer upgrade plan). Each `it` below pins one
 * ask, so a writer regression fails here by name instead of turning into a mystery on the
 * board. `game-463c3022.swupgn` stays as the pre-fix file and freshWriter.test.ts keeps
 * pinning ITS behaviour: both generations have to keep working.
 */
const text = readFileSync(join(__dirname, 'fixtures/game-20260912-writer-d1-d9.swupgn'), 'utf8');
const doc = parse(text);
const events = normalizeEvents(doc.events, new Set());
const names = indexResolver(doc.cards ?? []);
const byType = (t: GameEvent['t']) => events.filter((e) => e.t === t);
const isLettered = (seq: string) => /^R\d+\.[A-Z]\.\d+[a-z]/.test(seq);

describe('forceteki writer, post D-1..D-9 (fixture game-20260912)', () => {
    it('parses whole and drops nothing', () => {
        expect(doc.events).toHaveLength(440);
        expect(events).toHaveLength(440);
        expect(doc.header.result).toBe('P2');
        expect(doc.header.rounds).toBe(6);
    });

    it('D-1: the ROUND_END keyframe is taken before the rollover, so nothing mismatches', () => {
        expect(checkKeyframes(events).mismatches).toEqual([]);
        const ends = events.flatMap((e) => (e.t === 'ROUND_END' ? [e] : []));
        expect(ends).toHaveLength(5);                   // the game ended mid-round 6
        for (const e of ends) {
            expect(e.keyframe?.phase).toBe('regroup');
            expect(e.keyframe?.initiativeTaken).toBe(true);
        }
    });

    it('D-2: an action or Epic Action ability is its own numbered action, never a lettered consequence', () => {
        const acts = events.flatMap((e) => (e.t === 'ABILITY_ACTIVATE' && (e.kind === 'action' || e.kind === 'epic') ? [e] : []));
        expect(acts).toHaveLength(8);
        for (const e of acts) expect(isLettered(e.seq)).toBe(false);
        // and every OTHER ability kind stays a consequence
        const rest = events.flatMap((e) => (e.t === 'ABILITY_ACTIVATE' && e.kind !== 'action' && e.kind !== 'epic' ? [e] : []));
        for (const e of rest) expect(isLettered(e.seq)).toBe(true);
    });

    it('D-3: the hand->resource MOVE is stamped `for` its RESOURCE', () => {
        const resources = events.flatMap((e) => (e.t === 'RESOURCE' ? [e] : []));
        expect(resources).toHaveLength(15);
        for (const r of resources) {
            const i = events.indexOf(r);
            const mv = events.slice(Math.max(0, i - 4), i).find((m) => m.t === 'MOVE' && m.to === 'resource' && m.card === r.card);
            expect(mv, `no MOVE before ${r.seq}`).toBeDefined();
            expect(mv!.for, `${mv!.seq} unstamped`).toBeTruthy();
        }
    });

    it('D-4: one READY_RESOURCES per seat per regroup, carrying the count', () => {
        const rr = events.flatMap((e) => (e.t === 'READY_RESOURCES' ? [e] : []));
        expect(rr).toHaveLength(10);                            // 5 regroups x 2 seats (was 54 at amount 1)
        expect(rr.every((e) => e.amount > 1)).toBe(true);
    });

    it('D-5: every ABILITY_ACTIVATE carries a kind and a title', () => {
        const aa = events.flatMap((e) => (e.t === 'ABILITY_ACTIVATE' ? [e] : []));
        expect(aa).toHaveLength(26);
        const kinds = new Set(aa.map((e) => e.kind));
        expect([...kinds].sort()).toEqual(['action', 'epic', 'keyword', 'replacement', 'triggered', undefined]);
        expect(aa.every((e) => typeof e.title === 'string')).toBe(true);
        // KNOWN GAP: an event card's ability is written `<card>_anonymous` with no kind. One
        // record here (R6.A.6a, Nothing Left to Fear). It is lettered, so the client reads it as
        // a consequence, which is right -- but the kind should be there. Flip when it lands.
        const noKind = aa.filter((e) => e.kind === undefined);
        expect(noKind.map((e) => e.seq)).toEqual(['R6.A.6a']);
    });

    it('D-6: ms is on the numbered actions and the banners only, monotonic, ending at the header duration', () => {
        const withMs = events.filter((e) => e.ms !== undefined);
        expect(withMs).toHaveLength(82);
        for (const e of withMs) expect(isLettered(e.seq), `${e.seq} is a consequence`).toBe(false);
        expect(withMs.map((e) => e.ms!)).toEqual([...withMs.map((e) => e.ms!)].sort((a, b) => a - b));
        const span = new Date(doc.header.endDate!).getTime() - new Date(doc.header.date).getTime();
        expect(Math.max(...withMs.map((e) => e.ms!))).toBe(span);
    });

    it('D-8: the undo is recorded, in the header and as a note record at the truncation point', () => {
        expect(doc.header.undos).toBe(1);
        expect(byType('UNDO')).toEqual([{ seq: 'R5.A.7b-undo', t: 'UNDO', at: 'R5.A.7b', by: 2 }]);
        // a note changes no state: the keyframes still agree (asserted in D-1 above), and it
        // surfaces as its own row so a reviewer can see WHERE the retraction happened
        const row = buildMoveList(events, names).find((m) => m.t === 'UNDO');
        expect(row).toEqual({ seq: 'R5.A.7b-undo', t: 'UNDO', player: '', label: 'Player 2 takes back a move' });
    });

    it('D-9: DEFEAT.reason stays inside the documented vocabulary', () => {
        const REASONS = new Set(['combat', 'attack', 'damage', 'nonCombatDamage', 'ability', 'sacrifice', 'frameworkEffect']);
        const seen = events.flatMap((e) => (e.t === 'DEFEAT' ? [e.reason] : []));
        expect(seen).toHaveLength(12);
        for (const r of seen) expect(REASONS.has(r), `unknown DEFEAT.reason "${r}"`).toBe(true);
    });

    it('the client numbers exactly the actions the file\'s own STORY numbers, in order', () => {
        const story = (doc.story ?? []).flatMap((l) => { const m = /^\s*\d+\.\s+(.*)$/.exec(l); return m ? [m[1].trim()] : []; });
        const mine = events.filter(isNumberedAction).map((e) => frameAction(e, names).label);
        expect(story).toHaveLength(64);
        expect(mine).toEqual(story);
    });

    it('an action ability owns its consequences: one beat, not three', () => {
        const beats = buildBeats(events);
        expect(beats).toHaveLength(113);
        const frameOf = (seq: string) => events.findIndex((e) => e.seq === seq);
        const b = beats.find((x) => events[x.anchor].seq === 'R1.A.7')!;
        // Krennic's action: the choice, the defeat, the Ant Droid trigger AND the draw it causes
        expect([events[b.start].seq, events[b.end].seq]).toEqual(['R1.A.7', 'R1.A.7h']);
        expect(frameOf('R1.A.7g')).toBeGreaterThan(b.start);
        expect(b.kind).toBe('action');
    });

    it('the move list offers the ability actions as rows (it used to show only their DEFEAT)', () => {
        const mv = buildMoveList(events, names);
        const abil = mv.filter((m) => m.t === 'ABILITY_ACTIVATE');
        expect(abil.map((m) => m.seq)).toEqual(['R1.A.7', 'R2.A.5', 'R2.A.7', 'R3.A.7', 'R4.A.3', 'R5.A.7', 'R5.A.9', 'R6.A.1']);
        expect(abil[6].label).toBe('Player 2 uses Ahsoka Tano, Trust in the Force\'s Epic Action');
    });
});
