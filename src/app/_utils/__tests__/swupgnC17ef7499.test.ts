import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, fold, foldFrames, normalizeEvents, indexResolver, render, serialize, type GameEvent, type Seat, type SwuPgnDocument } from '@/lib/swupgn';
import { adaptState } from '../swupgnBoardAdapter';
import { fileIssues, resultMismatch } from '../swupgnFileIssues';
import { buildMoveList } from '../swupgnMoves';
import { frameAction } from '../replayAction';
import { autoBookmarks, bookmarkLabel } from '../replayDecisions';
import { sidedResolver } from '../swupgnCardNames';

/**
 * forceteki 6147b3c58..c17ef7499 (spec §22, the last eight CR v9.0 bullets) from the replay viewer's
 * side: a token changing arenas stays in play ([W-47], [V-07]), a GAME_END winner is 1, 2 or "Draw",
 * an event played out of the other seat's deck stays in its owner's discard (§12.2), and every
 * caption, like every story line, is one line whatever a file puts in its fields (§16, R-04).
 */
const FIXTURES = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures');
const MINIMAL = readFileSync(path.join(FIXTURES, 'vectors/minimal.swupgn'), 'utf-8');
const SEATS: Record<Seat, string> = { 1: 'P1', 2: 'P2' };
// A line break, other control character or bidirectional control: none may reach a shown line.
// eslint-disable-next-line no-control-regex
const NOT_ON_A_LINE = /[\u0000-\u001f\u007f-\u009f\u061C\u200E\u200F\u2028\u2029\u202A-\u202E\u2066-\u2069]/;

const withEvents = (events: unknown[], header: Partial<SwuPgnDocument['header']> = {}): SwuPgnDocument => {
    const doc = parse(MINIMAL);
    return { ...doc, header: { ...doc.header, ...header }, events: [...doc.events, ...events] as GameEvent[] };
};
const messages = (doc: SwuPgnDocument) => fileIssues(doc).map((i) => i.message);
const tokenWarning = (doc: SwuPgnDocument) => messages(doc).filter((m) => /leaving play for a zone other than outsideTheGame/.test(m));
const load = (file: string) => {
    const doc = parse(readFileSync(path.join(FIXTURES, file), 'utf-8'));
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const names = indexResolver(doc.cards);
    const nm = (i: number) => sidedResolver(names, frames[i]);
    const board = (i: number) => adaptState(frames[i], doc, SEATS, { nameOf: (id) => nm(i).nameOf(id) });
    return { doc, events, frames, names, nm, board };
};
interface Piles { cardPiles: { discard: { uuid: string }[] } }

describe('[W-47]/[V-07]: a token changing arenas with its unit stays in play (item 10)', () => {
    const move = (card: string, from: string, to: string, extra: Record<string, unknown> = {}) =>
        withEvents([{ seq: 'R2.A.9', t: 'MOVE', card, from, to, p: 1, ...extra }]);

    // Value: protects=File Health's token rule is validate.ts's `changesArena` exactly; fails_when=the rule flags a ground<->space token move again, or exempts a Credit/Force; why_new=c17ef7499 narrowed [V-07]; seam=none; no_claim=which tokens the rules let change arenas
    it('does not flag a token moving to the other arena', () => {
        expect(tokenWarning(move('TOKEN:shield#1', 'ground', 'space'))).toEqual([]);
        expect(tokenWarning(move('TOKEN:battle-droid#1', 'space', 'ground', { kind: 'unit' }))).toEqual([]);
    });

    // Value: protects=the still-illegal neighbours of the exempt move; fails_when=the exemption covers every destination or every token; why_new=c17ef7499 validate.spec cases; seam=none; no_claim=none
    it.each([
        ['a token from an arena to hand', 'TOKEN:shield#1', 'ground', 'hand'],
        ['a token from an arena to its base', 'TOKEN:shield#1', 'ground', 'base'],
        ['a Credit from ground to space', 'TOKEN:credit#1234567890', 'ground', 'space'],
        ['the Force from ground to space', 'TOKEN:the-force', 'ground', 'space'],
        ['a Credit from base to ground', 'TOKEN:credit#1234567890', 'base', 'ground'],
        ['the Force from base to space', 'TOKEN:the-force', 'base', 'space'],
    ])('still flags %s', (_, card, from, to) => {
        expect(tokenWarning(move(card, from, to))).toHaveLength(1);
    });

    // Value: protects=a token leaving play for outsideTheGame, or the same arena (a host change), is not flagged; fails_when=the rewrite drops the old guards; why_new=regression guard; seam=none; no_claim=none
    it('does not flag a token leaving play properly, or one changing hosts in place', () => {
        expect(tokenWarning(move('TOKEN:shield#1', 'ground', 'outsideTheGame'))).toEqual([]);
        expect(tokenWarning(move('TOKEN:shield#1', 'ground', 'ground', { attachedTo: 'SOR#108' }))).toEqual([]);
    });

    // Value: protects=tokens.ts's lifecycle repair and the fold keep a token that only changed arenas; fails_when=normalizeEvents rewrites or drops an arena-to-arena token MOVE, or the fold loses the token; why_new=[W-47] now writes such moves; seam=normalizeEvents → fold; no_claim=pre-1.0 files' own token shapes
    it('keeps a token unit and a shield that change arenas with their unit on the board', () => {
        const events = withEvents([
            { seq: 'R2.A.2', t: 'MOVE', card: 'TOKEN:battle-droid#1', from: 'outsideTheGame', to: 'ground', p: 1, kind: 'unit' },
            { seq: 'R2.A.2a', t: 'CREATE_TOKEN', p: 1, card: 'TOKEN:battle-droid#1', zone: 'ground' },
            { seq: 'R2.A.3', t: 'MOVE', card: 'TOKEN:shield#2', from: 'outsideTheGame', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'SOR#108' },
            { seq: 'R2.A.3a', t: 'SHIELD_GAIN', card: 'SOR#108', count: 1 },
            { seq: 'R2.A.4', t: 'MOVE', card: 'TOKEN:battle-droid#1', from: 'ground', to: 'space', p: 1, kind: 'unit' },
            { seq: 'R2.A.5', t: 'MOVE', card: 'SOR#108', from: 'ground', to: 'space', p: 1, kind: 'unit' },
            { seq: 'R2.A.5a', t: 'MOVE', card: 'TOKEN:shield#2', from: 'ground', to: 'space', p: 1, kind: 'upgrade', attachedTo: 'SOR#108' },
        ]).events;
        const normalized = normalizeEvents(events);
        for (const seq of ['R2.A.4', 'R2.A.5a']) {
            expect(normalized.find((e) => e.seq === seq), seq).toEqual(events.find((e) => e.seq === seq));
        }
        const s = fold(normalized);
        const p1 = s.players[1]!;
        expect(p1.cards.find((c) => c.id === 'TOKEN:battle-droid#1')?.zone).toBe('space');
        const wampa = p1.cards.find((c) => c.id === 'SOR#108')!;
        expect(wampa.zone).toBe('space');
        expect(wampa.shields).toBe(1);
        expect(tokenWarning(withEvents(events.slice(-7)))).toEqual([]);
    });
});

describe('GAME_END.winner is 1, 2 or "Draw" (item 9)', () => {
    const ended = (winner: unknown) => withEvents([{ seq: 'R2.A.game-end', t: 'GAME_END', winner, reason: 'Base Destroyed' }]);
    const winnerWarning = (doc: SwuPgnDocument) => messages(doc).filter((m) => /GAME_END naming a winner/.test(m));

    // Value: protects=File Health reports a winner the schema refuses, as validate.ts's `schema` error would; fails_when=the rule is dropped or fires on a real outcome; why_new=c17ef7499 closed GAME_END.winner; seam=none; no_claim=an outcome a newer minor adds, which this warning also covers
    it('reports a winner that is not a seat or "Draw", and not a real one', () => {
        for (const bad of [3, 7, 0, 'P1', null, '1']) expect(winnerWarning(ended(bad)), String(bad)).toHaveLength(1);
        for (const good of [1, 2, 'Draw']) expect(winnerWarning(ended(good)), String(good)).toEqual([]);
        expect(winnerWarning(ended(7))[0]).toBe('1 GAME_END naming a winner that is not Player 1, Player 2 or a draw: the replay names no winner for it (§10.2).');
    });

    // Value: protects=no caption, move list or bookmark names a winner the file does not; fails_when=the caption reads " wins" or "Player 7 wins"; why_new=render() prints `${who(winner)} wins` for any value and is verbatim; seam=frameAction; no_claim=render()'s own story line, which upstream owns
    it('names no winner in the caption for a crafted one, and does not crash', () => {
        const nm = indexResolver(parse(MINIMAL).cards);
        for (const winner of [7, 'x', null, { seat: 1 }]) {
            const doc = ended(winner);
            const gameEnd = doc.events[doc.events.length - 1];
            expect(frameAction(gameEnd, nm).label, JSON.stringify(winner)).toBe('Game ends — Base Destroyed');
            expect(() => buildMoveList(doc.events, nm)).not.toThrow();
            expect(() => autoBookmarks(doc).map((b) => bookmarkLabel(b, nm.nameOf))).not.toThrow();
            expect(() => adaptState(fold(doc.events), doc, SEATS)).not.toThrow();
            expect(resultMismatch(doc), 'an unknown outcome is not compared with Result').toBe(false);
        }
        expect(frameAction(ended(2).events.at(-1), nm).label).toBe('Player 2 wins — Base Destroyed');
        expect(frameAction(ended('Draw').events.at(-1), nm).label).toBe('Game ends in a draw — Base Destroyed');
    });
});

describe('an event played out of the other seat\'s deck stays in its owner\'s discard (item 11)', () => {
    const { frames, board, doc } = load('c17ef7499-cross-seat-event.swupgn');
    const last = frames.length - 1;

    // Value: protects=seat 1 playing seat 2's event leaves it in seat 2's pile only, in the fold and on the board; fails_when=PLAY_EVENT also files it under the player; why_new=c17ef7499 PLAY_EVENT owner rule; seam=fold → adaptState; no_claim=deck tracker's counts
    it('shows the event in seat 2\'s discard pile only', () => {
        expect(frames[last].players[1]!.discard).toEqual([]);
        expect(frames[last].players[2]!.discard).toEqual(['SOR#142']);
        const players = board(last).players as unknown as Record<string, Piles>;
        expect(players.P1.cardPiles.discard).toEqual([]);
        expect(players.P2.cardPiles.discard.map((c) => c.uuid)).toEqual(['SOR#142']);
        expect(render(doc, indexResolver(doc.cards))).toContain('2. Player 1 plays Bold Resistance (cost 0)');
    });
});

describe('hostile text: every shown line is one line (item 13)', () => {
    const { doc, events, frames, names, nm, board } = load('c17ef7499-hostile-text.swupgn');

    // Value: protects=a file's names, ids, effect text, untilText, reasons and zones cannot split a story line (§16, R-04); fails_when=render prints a field raw; why_new=c17ef7499 flatten; seam=none; no_claim=none
    it('renders one story line per record, none broken or past the name cut', () => {
        const story = render(doc, names).split('\n');
        expect(story.filter((l) => NOT_ON_A_LINE.test(l))).toEqual([]);
        expect(story.filter((l) => l.trimStart().startsWith('FAKE'))).toEqual([]);
        expect(story.filter((l) => /^ {2}\d\. |^ {7}↳ /.test(l)).slice(-10)).toHaveLength(10);
        expect(story).toContain(`  4. Player 1 plays ${'L'.repeat(119)}… to ground (cost 0)`);
        expect(story.at(-1)).toBe('       ↳ ***  wins — Base    FAKE destroyed ***');
    });

    // Value: protects=every caption, move-list label and bookmark is one line too (item 7: paths other than render()); fails_when=displayText's kept line feed, or a raw unlisted id, reaches a label; why_new=frameAction now flattens and storyName cuts; seam=frameAction, buildMoveList, bookmarkLabel; no_claim=StoryTab, which maps every line through displayText
    it('keeps every caption, move-list label and bookmark on one line', () => {
        const labels = [
            ...events.map((e, i) => frameAction(e, nm(i)).label),
            ...buildMoveList(events, (i) => nm(i)).map((m) => m.label),
            ...autoBookmarks(doc).map((b) => bookmarkLabel(b, names.nameOf)),
        ];
        expect(labels.filter((l) => NOT_ON_A_LINE.test(l))).toEqual([]);
        expect(labels.every((l) => l.length < 400)).toBe(true);
        expect(labels).toContain('Player 1 attacks Player 2\'s base with SOR#999    FAKE id');
        // displayText drops the U+202E that render()'s flatten turns into a space, so a caption has one
        // space fewer than the story line beside a bidi control (VERSION.md, displayText divergence).
        expect(labels).toContain('Game ends — Base   FAKE destroyed');
        expect(() => board(frames.length - 1)).not.toThrow();
    });

    // Value: protects=the export's STORY has one line per record and round-trips through serialize (§3 [A-01]); fails_when=a field's line break splits a STORY line or a record line; why_new=c17ef7499 flatten; seam=serialize; no_claim=none
    it('exports a STORY of one line per record that round-trips', () => {
        const out = serialize(doc);
        const lines = out.split('\n');
        const story = lines.slice(lines.indexOf('%%% STORY') + 1, lines.indexOf('%%% DECKS') - 1);
        expect(story).toEqual(render(doc).split('\n'));
        expect(story.filter((l) => NOT_ON_A_LINE.test(l))).toEqual([]);
        const again = parse(out);
        expect(again.events).toEqual(doc.events);
        expect(again.cards).toEqual(doc.cards);
        expect(serialize(again)).toBe(out);
    });

    // Value: protects=File Health says what is wrong with the file without crashing on it; fails_when=a hostile field throws in a rule; why_new=the new winner rule reads `winner`; seam=none; no_claim=none
    it('reports the crafted winner and the bad zone in File Health', () => {
        const m = messages(doc);
        expect(m.some((s) => /GAME_END naming a winner/.test(s))).toBe(true);
        expect(m.some((s) => /zone outside the vocabulary/.test(s))).toBe(true);
        expect(m.filter((s) => NOT_ON_A_LINE.test(s.replace(/\n/g, '')))).toEqual([]);
    });
});
