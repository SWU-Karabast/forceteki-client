import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, fold, foldFrames, normalizeEvents, indexResolver, render, type GameEvent, type Seat } from '@/lib/swupgn';
import { adaptState } from '../swupgnBoardAdapter';
import { fileIssues } from '../swupgnFileIssues';
import { buildMoveList, isNumberedAction } from '../swupgnMoves';
import { buildBeats, beatAt, chapterMarks, playbackStep } from '../replayBeats';
import { groupsByAdjacency } from '../swupgnWriter';
import { storyLineTargets, storySeekIndex } from '../storySeek';
import { frameAction } from '../replayAction';
import { sidedResolver } from '../swupgnCardNames';
import { alignBeats, recordBack, recordForward, settle, settleClip, simulSpans } from '../simulGroups';
import { activeEffectRows, effectNotesByCard, effectSources, effectTexts, ongoingEffectSummaries, spentAbilityRows } from '../effectWords';

/**
 * Writer revision 6, the CR v9.0 coverage pass (forceteki 6147b3c58, spec §22), from the replay
 * viewer's side: lettered ability-made actions (§9.1), `simul` groups (§10.2), the initiative from
 * ROUND_START.active (§12.2), the new board state (§11), File Health's four new writer slips (§24),
 * and older files, whose absent fields are "not recorded" (§11).
 */
const VECTORS = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const FIXTURES = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures');
const SEATS: Record<Seat, string> = { 1: 'P1', 2: 'P2' };
interface BoardCard { uuid: string; parentCardId?: string; controllerId?: string; ownerId?: string; effectNotes?: string[]; isBlanked?: boolean; clonedCardName?: string; clonedCardId?: unknown }
interface BoardPlayer { cardPiles: { groundArena: BoardCard[]; spaceArena: BoardCard[] } }
const playersOf = (gs: { players: Record<string, BoardPlayer> }): BoardPlayer[] => Object.values(gs.players);
const load = (file: string) => {
    const doc = parse(readFileSync(file, 'utf-8'));
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const names = indexResolver(doc.cards);
    const at = (seq: string) => {
        const i = events.findIndex((e) => e.seq === seq);
        if (i < 0) throw new Error(`${seq} not in ${path.basename(file)}`);
        return i;
    };
    const nm = (i: number) => (id: string) => sidedResolver(names, frames[i]).nameOf(id);
    const board = (i: number) => adaptState(frames[i], doc, SEATS, { nameOf: nm(i), effectNotes: effectNotesByCard(frames[i], nm(i)) });
    return { doc, events, frames, names, at, nm, board };
};
const vector = (name: string) => load(path.join(VECTORS, `${name}.swupgn`));
const REAL_GAMES = ['arrest', 'capture', 'control', 'death-star', 'effects', 'homeworlds', 'organic', 'pilot', 'stolen-hauler', 'upgrades', 'visibility'];

describe('ability-made actions are lettered sub-steps (§9.1)', () => {
    const { doc, events, at, names, frames } = vector('control');

    it('the Ambush attack is R7.A.1c: not numbered, a seek row inside the PLAY\'s beat', () => {
        const ambush = events[at('R7.A.1c')];
        expect(ambush.t).toBe('ATTACK');
        expect(isNumberedAction(ambush)).toBe(false);
        const rows = buildMoveList(events, names).map((m) => m.seq).filter((s) => s.startsWith('R7.A.'));
        // The Moves tab offers an attack as a seek row (it numbers nothing), lettered or not;
        // seeking it lands on the end of the PLAY's beat, as the story files it under 1.
        expect(rows.indexOf('R7.A.1c')).toBeGreaterThan(rows.indexOf('R7.A.1'));
        expect(rows.indexOf('R7.A.2')).toBeGreaterThan(rows.indexOf('R7.A.1c'));
        expect(buildMoveList(events, names).filter((m) => isNumberedAction(events[at(m.seq)])).map((m) => m.seq)
            .filter((s) => s.startsWith('R7.A.')).slice(0, 2)).toEqual(['R7.A.1', 'R7.A.2']);
        const beats = buildBeats(events, { adjacency: groupsByAdjacency(doc.header) });
        expect(beatAt(beats, at('R7.A.1c'))).toBe(beatAt(beats, at('R7.A.1')));
    });

    it('a story line seeks to the record the story numbers it for, round 7 included', () => {
        const lines = doc.story ?? [];
        const targets = storyLineTargets(lines, storySeekIndex(events));
        let checked = 0;
        lines.forEach((line, i) => {
            const m = /^\s*(\d+)\.\s+(.*)$/.exec(line);
            if (!m) return;
            const f = targets[i]!;
            expect(f, line).toBeDefined();
            expect(isNumberedAction(events[f])).toBe(true);
            expect(frameAction(events[f], sidedResolver(names, frames[f])).label).toBe(m[2]);
            checked++;
        });
        expect(checked).toBeGreaterThan(30);
        const r7 = lines.findIndex((l) => /ROUND 7/.test(l));
        const second = lines.findIndex((l, i) => i > r7 && /^\s*2\.\s/.test(l));
        expect(events[targets[second]!].seq).toBe('R7.A.2');
    });
});

describe('a simul group is one instant (§10.2)', () => {
    it('visibility R4.A.1d..1g: a discard of two cards is stepped over whole', () => {
        const { events, at } = vector('visibility');
        const spans = simulSpans(events);
        const [first, last] = [at('R4.A.1d'), at('R4.A.1g')];
        for (let i = first; i <= last; i++) expect([spans.start[i], spans.end[i]]).toEqual([first, last]);
        expect(settle(spans, at('R4.A.1e'))).toBe(last);
        expect(recordForward(spans, first - 1)).toBe(last);
        expect(recordBack(spans, last)).toBe(first - 1);
        expect(recordForward(spans, last)).toBe(last + 1);
    });

    it('effects: the combat damage of R2.A.2 is one stop', () => {
        const { events, at } = vector('effects');
        const spans = simulSpans(events);
        expect(settle(spans, at('R2.A.2a'))).toBe(at('R2.A.2b'));
        expect(recordBack(spans, at('R2.A.2b'))).toBe(at('R2.A.2a') - 1);
    });

    it.each(REAL_GAMES)('%s: no beat ends inside a group, and render prints the group in file order', (name) => {
        const { doc, events } = vector(name);
        const spans = simulSpans(events);
        for (const b of buildBeats(events, { adjacency: groupsByAdjacency(doc.header) })) expect(settle(spans, b.end)).toBe(b.end);
        const unmarked = { ...doc, events: doc.events.map((e) => { const c: Record<string, unknown> = { ...e }; delete c.simul; return c as unknown as GameEvent; }) };
        expect(render(unmarked)).toBe(render(doc));
    });

    it('overlapping or interleaved groups are merged; a lone member is not a group', () => {
        const ev = (seq: string, simul?: string) => ({ seq, t: 'PASS', p: 1, ...(simul ? { simul } : {}) }) as GameEvent;
        const spans = simulSpans([ev('a', 'x'), ev('b', 'y'), ev('c', 'x'), ev('d', 'y'), ev('e'), ev('f', 'z')]);
        expect([...spans.end]).toEqual([3, 3, 3, 3, 4, 5]);
        expect([...spans.start]).toEqual([0, 0, 0, 0, 4, 5]);
    });

    // Value: protects=an empty replay and an out-of-range index never crash or jump the scrubber; fails_when=settle/recordForward/recordBack index past the arrays or return NaN; why_new=only in-range frames were stepped; seam=none; no_claim=UI clamping
    it('an empty stream and an out-of-range frame are left where they are', () => {
        const none = simulSpans([]);
        expect([settle(none, 0), recordForward(none, 0), recordBack(none, 0)]).toEqual([0, 0, 0]);
        const ev = (seq: string, simul?: string) => ({ seq, t: 'PASS', p: 1, ...(simul ? { simul } : {}) }) as GameEvent;
        const spans = simulSpans([ev('a'), ev('b', 'x'), ev('c', 'x')]);
        expect([settle(spans, -1), settle(spans, 3)]).toEqual([-1, 3]);
        expect(recordForward(spans, 2)).toBe(2);
        expect(recordBack(spans, 99)).toBe(0);
        expect(recordBack(spans, 0)).toBe(0);
    });

    // Value: protects=a simul group split across two beats (each seat's draw) is one beat, so Back is never stuck and every beat is reachable; fails_when=alignBeats is dropped or stops merging; why_new=the vectors never split a group across beats; seam=none; no_claim=which seat names the merged beat
    it('a group that buildBeats splits across beats becomes one beat whose end is settled', () => {
        const draw = (seq: string, p: Seat) => ({ seq, t: 'DRAW', p, card: 'SOR#1', simul: 'R1.S.1' }) as unknown as GameEvent;
        const events = [{ seq: 'R1.start', t: 'ROUND_START', round: 1 } as GameEvent, draw('R1.S.1', 1), draw('R1.S.2', 2), { seq: 'R1.A.1', t: 'PASS', p: 1 } as GameEvent];
        const spans = simulSpans(events);
        const raw = buildBeats(events);
        expect(raw.some((b) => settle(spans, b.end) !== b.end)).toBe(true);
        const beats = alignBeats(raw, spans);
        for (const b of beats) expect(settle(spans, b.end)).toBe(b.end);
        expect(beats.map((b) => [b.start, b.end])).toEqual([[0, 0], [1, 2], [3, 3]]);
        expect(beats.map((b) => b.index)).toEqual([0, 1, 2]);
        // Two seats' draws: the first beat names it, and it is neither seat's.
        expect(beats[1].anchor).toBe(1);
        expect(beats[1].seat).toBeUndefined();
    });

    // Value: protects=a careless simul span over a ROUND_START never folds the banner, so the round keeps its chapter mark; fails_when=alignBeats merges across banner beats; why_new=red team traced a lost round tick; seam=none; no_claim=scrubbing inside the span
    it('never folds a banner beat, even under a span that covers it', () => {
        const ev = (seq: string, t: string, simul?: string) => ({ seq, t, p: 1, round: 2, ...(simul ? { simul } : {}) }) as unknown as GameEvent;
        const events = [ev('R1.A.1', 'PASS', 'x'), ev('R2.start', 'ROUND_START', 'x'), ev('R2.A.1', 'PASS')];
        const beats = alignBeats(buildBeats(events), simulSpans(events));
        expect(beats.map((b) => b.kind)).toContain('banner');
        expect(chapterMarks(beats, events).map((m) => m.kind)).toContain('round');
    });

    it.each(REAL_GAMES)('%s: aligning the beats changes nothing on a real game', (name) => {
        const { doc, events } = vector(name);
        const beats = buildBeats(events, { adjacency: groupsByAdjacency(doc.header) });
        expect(alignBeats(beats, simulSpans(events))).toEqual(beats);
    });

    // Value: protects=a clip whose ends sit in one simul instant stops instead of 'playing' with no timer; fails_when=clip ends stop being settled, so the loop target settles onto the current frame; why_new=red team traced the stall, untested; seam=none; no_claim=the autoplay effect's timer
    it('a clip inside one instant settles to a single frame, which plays once and stops', () => {
        const { events, at } = vector('effects');
        const spans = simulSpans(events);
        const clip = settleClip(spans, at('R2.A.2a'), at('R2.A.2b'));
        expect(clip).toEqual({ start: at('R2.A.2b'), end: at('R2.A.2b') });
        const beats = alignBeats(buildBeats(events), spans);
        expect(playbackStep(beats, clip.start, events.length, clip).kind).toBe('stop');
        const wide = settleClip(spans, at('R2.A.2a') - 1, at('R2.A.2b'));
        expect(wide.start).toBeLessThan(wide.end);
        expect(playbackStep(beats, wide.end, events.length, wide)).toEqual({ kind: 'loop', to: wide.start });
    });
});

describe('the initiative is ROUND_START.active (§12.2, CR 5.4.1.b)', () => {
    it('the board gives the initiative to the round\'s first active seat, with no keyframe', () => {
        const { doc } = vector('minimal');
        const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, active: 2 } as GameEvent]);
        expect(s.initiative).toBe(2);
        const gs = adaptState(s, doc, SEATS);
        expect([gs.players.P1.hasInitiative, gs.players.P2.hasInitiative]).toEqual([false, true]);
    });
});

describe('the new board state (§11)', () => {
    it('foldFrames keeps one frame per record and carries effects frame by frame', () => {
        const { events, frames, at } = vector('effects');
        expect(frames).toHaveLength(events.length);
        const start = events.findIndex((e) => e.t === 'EFFECT_START');
        const id = (events[start] as Extract<GameEvent, { t: 'EFFECT_START' }>).id;
        expect(frames[start].effects?.map((f) => f.id)).toContain(id);
        expect(frames[at('R1.A.4a')].effects?.map((f) => f.id)).not.toContain('fx@1');
        expect(frames[at('R1.A.4a') - 1].effects?.map((f) => f.id)).toContain('fx@1');
    });

    it('lists the active effects in the story\'s words, and marks the units they target', () => {
        const { events, frames, nm, board } = vector('effects');
        const i = events.findIndex((e, k) => e.t === 'EFFECT_START' && Array.isArray(e.targets) && e.targets.some((x) => !x.startsWith('base@')) && (frames[k].effects?.length ?? 0) > 0);
        const fx = events[i] as Extract<GameEvent, { t: 'EFFECT_START' }>;
        const rows = activeEffectRows(frames[i], nm(i))!;
        expect(rows.map((r) => r.id)).toContain(fx.id);
        expect(rows.find((r) => r.id === fx.id)!.text).toMatch(new RegExp(`^${nm(i)(fx.src).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} on `));
        const target = fx.targets!.find((t) => !t.startsWith('base@'))!;
        const units = playersOf(board(i)).flatMap((p) => [...p.cardPiles.groundArena, ...p.cardPiles.spaceArena]);
        expect(units.find((c) => c.uuid === target)?.effectNotes?.length).toBeGreaterThan(0);
    });

    it.each(REAL_GAMES)('%s: every EFFECT_START/EFFECT_END/LOOK/NAME caption is its story line', (name) => {
        const { doc, events, frames, names } = vector(name);
        const sources = effectSources(events);
        const story = render(doc).split('\n').map((l) => l.replace(/^\s*↳\s/, ''));
        for (const [i, e] of events.entries()) {
            if (!['EFFECT_START', 'EFFECT_END', 'LOOK', 'NAME'].includes(e.t)) continue;
            const label = frameAction(e, sidedResolver(names, frames[i]), { effectSourceOf: (id) => sources.get(id) }).label;
            expect(story, `${e.seq}`).toContain(label);
        }
    });

    it('feeds the live trays\' ongoing-effects panel in its own shape, the description through RichText', () => {
        const { doc, events, frames, at, names } = vector('effects');
        const i = at('R3.A.1b');
        const fx = ongoingEffectSummaries(frames[i], effectTexts(events), SEATS, (id) => sidedResolver(names, frames[i]).nameOf(id),
            (seat) => String(seat === 1 ? doc.header.p1Base : doc.header.p2Base))!;
        const rally = fx.find((f) => f.sourceCardUuid === 'SOR#154:2')!;
        expect(rally.source.controllerId).toBe('P1');
        expect(rally.source.effectDescription).toBe('Each friendly unit gains Raid 2 this phase');
        expect(rally.targets).toEqual(['IC27#097:2', 'IC27#097:3']);
        expect(rally.source.setId).toEqual({ set: 'SOR', number: 154 });
        // A base-wide effect is drawn as the seat's base and lists no unit target.
        const j = at('R1.A.1b');
        const bases = ongoingEffectSummaries(frames[j], effectTexts(events), SEATS, (id) => id, (seat) => String(seat === 1 ? doc.header.p1Base : doc.header.p2Base))!;
        expect(bases.find((f) => f.sourceCardUuid === 'SOR#160')?.targets).toEqual([]);
    });

    it('a limited ability used up is listed as spent (control R3.A.3a, max 1 per round)', () => {
        const { frames, at, nm } = vector('control');
        const i = at('R3.A.3a');
        const rows = spentAbilityRows(frames[i], nm(i))!;
        expect(rows.some((r) => r.seat === 1 && /used 1 of 1 for this round$/.test(r.text))).toBe(true);
        expect(spentAbilityRows(frames[i - 1], nm(i - 1))!.some((r) => r.key.startsWith('1:ASH#047:'))).toBe(false);
    });

    it('a copy goes by its copied name and art (control R6.A.0f)', () => {
        const { events, frames, at, names, board } = vector('control');
        const i = at('R6.A.0f');
        const stats = events[i] as Extract<GameEvent, { t: 'STATS' }>;
        const card = (board(i).players.P1 as BoardPlayer).cardPiles.groundArena.find((c) => c.uuid === stats.card)!;
        expect(card.clonedCardName).toBe(stats.name);
        expect(card.clonedCardId).toEqual({ set: 'SOR', number: 95 });
        expect(sidedResolver(names, frames[i]).nameOf(stats.card)).toBe(stats.name);
    });

    it('a blank unit is marked (effects R4.A.1c)', () => {
        const { at, board } = vector('effects');
        const units = playersOf(board(at('R4.A.1c'))).flatMap((p) => p.cardPiles.groundArena);
        expect(units.find((c) => c.uuid === 'SOR#095:3')?.isBlanked).toBe(true);
    });

    it('a stolen unit is on its controller\'s side, owned by the other seat; a foreign upgrade names its controller', () => {
        const { at, board, frames } = vector('control');
        const i = at('R5.A.3b');
        expect(frames[i].players[1]!.cards.find((c) => c.id === 'SOR#095')?.owner).toBe(2);
        const stolen = (board(i).players.P1 as BoardPlayer).cardPiles.groundArena.find((c) => c.uuid === 'SOR#095')!;
        expect([stolen.controllerId, stolen.ownerId]).toEqual(['P1', 'P2']);
        const k = frames.findIndex((f) => ([1, 2] as Seat[]).some((s) => f.players[s]?.cards.some((c) => c.upgradeControllers)));
        const seat = ([1, 2] as Seat[]).find((s) => frames[k].players[s]!.cards.some((c) => c.upgradeControllers))!;
        const host = frames[k].players[seat]!.cards.find((c) => c.upgradeControllers)!;
        const [upgradeId, controller] = Object.entries(host.upgradeControllers!)[0];
        const piles = (board(k).players[SEATS[seat]] as BoardPlayer).cardPiles;
        const drawn = [...piles.groundArena, ...piles.spaceArena].find((c) => c.uuid === upgradeId && c.parentCardId === host.id)!;
        expect(drawn.controllerId).toBe(SEATS[controller as Seat]);
    });
});

describe('File Health names the four new writer slips (§24)', () => {
    const issues = (name: string) => fileIssues(parse(readFileSync(path.join(VECTORS, `negative/${name}.swupgn`), 'utf-8'))).map((i) => i.message);

    it.each([
        ['round-start-no-active', /ROUND_START without an active seat/],
        ['token-to-hand', /token leaving play for a zone other than outsideTheGame/],
        ['fortify-enemy-base', /attached to the other player's base/],
        ['effect-end-unknown', /EFFECT_END for an effect not in force/],
    ])('%s', (name, message) => {
        expect(issues(name)).toEqual(expect.arrayContaining([expect.stringMatching(message)]));
        expect(() => foldFrames(normalizeEvents(parse(readFileSync(path.join(VECTORS, `negative/${name}.swupgn`), 'utf-8')).events))).not.toThrow();
    });

    it('says none of them about a current vector', () => {
        for (const name of readdirSync(VECTORS).filter((f) => f.endsWith('.swupgn'))) {
            const messages = fileIssues(parse(readFileSync(path.join(VECTORS, name), 'utf-8'))).map((i) => i.message);
            expect(messages.filter((m) => /active seat|outsideTheGame|other player's base|not in force/.test(m)), name).toEqual([]);
        }
    });
});

describe('an older file records none of it: absent is "not recorded" (§11)', () => {
    const { doc, frames, nm } = load(path.join(FIXTURES, 'minimal-rev4.swupgn'));

    it('shows no effects list and no spent abilities at any frame', () => {
        expect(doc.header.writerRevision).toBe(4);
        frames.forEach((f, i) => {
            expect(activeEffectRows(f, nm(i))).toBeNull();
            expect(spentAbilityRows(f, nm(i))).toBeNull();
            expect(effectNotesByCard(f, nm(i)).size).toBe(0);
            expect(ongoingEffectSummaries(f, new Map(), SEATS, nm(i), () => 'SOR#028')).toBeNull();
        });
        // Upstream's own revision-4 fixture has no `active` on its ROUND_STARTs, which Appendix C
        // says every forceteki revision wrote: File Health reports it, as the validator would.
        expect(fileIssues(doc).map((i) => i.message).filter((m) => /active seat/.test(m))).toHaveLength(1);
    });

    it('a revision-6 file with nothing in force says so as an empty list, not as absent', () => {
        const { frames: current, nm: nm6 } = vector('minimal');
        expect(activeEffectRows(current[current.length - 1], nm6(current.length - 1))).toEqual([]);
    });
});
