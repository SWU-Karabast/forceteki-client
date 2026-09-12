import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { GameEvent } from '@/lib/swupgn';
import { parse, normalizeEvents, foldFrames, emptyState } from '@/lib/swupgn';
import { buildBeats, beatAt } from '../replayBeats';
import type { Beat } from '../replayBeats';
import { classifyBeat } from '../replayTransitions';

const doc = parse(readFileSync(join(__dirname, '../../../lib/swupgn/__tests__/fixtures/game-463c3022.swupgn'), 'utf8'));
const events = normalizeEvents(doc.events, new Set());
const frames = foldFrames(events);
const beats = buildBeats(events);
const at = (seq: string) => { const b = beatAt(beats, events.findIndex((e) => e.seq === seq)); return classifyBeat(b, events, frames[b.start - 1], frames[b.end]); };

describe('classifyBeat', () => {
    it('a unit play from hand', () => {
        expect(at('R2.A.3').slice().sort(byKind)).toEqual([
            { kind: 'exhaust', card: 'LAW#159' },                                              // R2.A.2d EXHAUST (entering)
            { kind: 'play', card: 'LAW#159', seat: 2, to: 'groundArena', token: false },       // R2.A.2b MOVE hand->ground
        ].sort(byKind));
    });
    it('an attack on a shielded unit: lunge, target survives, shield badge drops', () => {
        expect(at('R2.A.1').slice().sort(byKind)).toEqual([
            { kind: 'exhaust', card: 'ASH#056' },
            { kind: 'attack', atk: 'ASH#056', def: 'JTL#032', seat: 1, defenderType: 'unit', survived: true },
            { kind: 'badge', card: 'JTL#032', token: 'shield', delta: -1 },
        ].sort(byKind));
    });
    it('an attack on a base is a lunge plus a base hit', () => {
        expect(at('R3.A.1')).toContainEqual({ kind: 'attack', atk: 'ASH#056', def: 'base@2', seat: 1, defenderType: 'base', survived: true });
        expect(at('R3.A.1')).toContainEqual({ kind: 'baseHit', seat: 2, amt: 5, hp: 25 });
        expect(at('R3.A.1').some((t) => t.kind === 'damage')).toBe(false);   // combat damage is the lunge's, not a bolt
    });
    it('an ability defeat: a bolt from the leader, then the defeat', () => {
        const ts = at('R2.A.6a');   // Krennic's action ability is its own beat (Task 2)
        expect(ts).toContainEqual({ kind: 'defeat', card: 'LAW#159', seat: 2, reason: 'ability', by: 'LAW#008' });
    });
    it('an upgrade play attaches to its host', () => {
        expect(at('R2.A.5')).toContainEqual({ kind: 'upgrade', card: 'LAW#129', seat: 1, host: 'ASH#056' });
    });
    it('a leader deploy with ability damage', () => {
        const ts = at('R5.A.5');
        expect(ts).toContainEqual({ kind: 'leaderDeploy', card: 'LAW#008', seat: 2, to: 'groundArena' });
        expect(ts).toContainEqual({ kind: 'damage', src: 'LAW#008', tgt: 'LAW#010', amt: 6, hp: 4, survived: true });
    });
    it('an event play', () => {
        expect(at('R6.A.11')).toContainEqual({ kind: 'event', card: 'ASH#090', seat: 1 });
    });
    it('the opening resource commit and a draw burst', () => {
        expect(at('R0.S.21').filter((t) => t.kind === 'resource')).toEqual([
            { kind: 'resource', card: 'ASH#031:2', seat: 1 },
            { kind: 'resource', card: 'ASH#031', seat: 1 },
        ]);
        expect(at('R0.S.3')).toContainEqual({ kind: 'draw', seat: 1, cards: ['ASH#031', 'LAW#129', 'ASH#079', 'LAW#111', 'ASH#031:2', 'ASH#056'] });
    });
    it('a bare pass moves nothing', () => {
        expect(at('R1.A.2')).toEqual([]);
        expect(at('R2.A.6')).toEqual([]);   // the PASS the ability used to be filed under
    });
    it('a lettered ATTACK (an ability-granted attack) owns its own combat damage, even though the beat anchors on the ABILITY_ACTIVATE', () => {
        // Part D-2 shape: the action ability is the beat's anchor; the ATTACK it grants and the
        // combat DAMAGE it deals both ride as lettered consequences of that same base seq.
        const events: GameEvent[] = [
            { seq: 'R9.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'LAW#008', ability: 'law008_action_1' },
            { seq: 'R9.A.1a', t: 'ATTACK', p: 1, atk: 'LAW#008', def: 'ASH#056', defenderType: 'unit' },
            { seq: 'R9.A.1b', t: 'DAMAGE', src: 'LAW#008', tgt: 'ASH#056', amt: 3, damageType: 'combat', hp: 2 },
        ];
        const beat: Beat = { index: 0, kind: 'action', start: 0, end: 2, anchor: 0, seat: 1 };
        const ts = classifyBeat(beat, events, emptyState(), emptyState());
        expect(ts.filter((t) => t.kind === 'attack')).toEqual([
            { kind: 'attack', atk: 'LAW#008', def: 'ASH#056', seat: 1, defenderType: 'unit', survived: true },
        ]);
        expect(ts.filter((t) => t.kind === 'damage')).toEqual([]);
    });
});

const byKind = (a: { kind: string }, b: { kind: string }) => a.kind.localeCompare(b.kind);
