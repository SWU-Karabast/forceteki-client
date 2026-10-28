import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, render, emptyState, foldFrames, normalizeEvents, displayText, SwuPgnError, type GameEvent, type SetupInitRecord } from '@/lib/swupgn';
import { formatResult, resultOf } from '../replayMoves';
import { sidedResolver } from '../swupgnCardNames';
import { groupsByAdjacency, isPreRelease } from '../swupgnWriter';
import { buildBeats } from '../replayBeats';
import { initRecord, deckByFrame } from '../deckTracker';
import { roundOfSeq, turnDigests } from '../turnDigests';
import { fileIssues, replayErrorMessage, ReplayRefusedError, writerGeneration } from '../swupgnFileIssues';
import { storeReplayContent } from '../replayHandoff';
import { decisionPoints, bookmarkLabel } from '../replayDecisions';
import { frameAction, storyName } from '../replayAction';
import { indexResolver } from '@/lib/swupgn';

const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
// A clean, current file (forceteki writer revision 4): each test adds the one thing under test.
const VECTOR = readFileSync(path.join(DIR, 'homeworlds.swupgn'), 'utf-8');
const RLO = String.fromCharCode(0x202e);

describe('INIT at R0.S.0 (writer revision 3) and at R1.S.0 (revisions 1-2, pilot files)', () => {
    const doc = parse(VECTOR);
    const init = initRecord(doc)!;
    const asOld = { ...doc, setup: doc.setup.map((r) => ((r as SetupInitRecord).t === 'INIT' ? { ...r, seq: 'R1.S.0' } : r)) };

    it('finds INIT by its type, wherever its seq says it is', () => {
        expect(init.seq).toBe('R0.S.0');
        expect(initRecord(asOld)?.p1DeckOrder).toEqual(init.p1DeckOrder);
        expect(deckByFrame(asOld, doc.events)).toEqual(deckByFrame(doc, doc.events));
    });

    it('files setup under round 0, never round 1', () => {
        expect(roundOfSeq('R0.S.0')).toBe(0);
        expect(roundOfSeq('R0.S.7')).toBe(0);
        // INIT lives in %%% SETUP, which no seq reader walks: the digest is the same either way.
        expect(turnDigests(asOld)).toEqual(turnDigests(doc));
    });
});

describe('replayErrorMessage branches on the §24 code, never on the message', () => {
    const codes = ['not-swupgn', 'unsupported-major', 'too-large', 'line-too-long', 'too-many-records', 'too-deep',
        'bad-header-line', 'bad-escape', 'duplicate-tag', 'missing-tag', 'bad-count', 'duplicate-section',
        'record-outside-section', 'bad-json', 'duplicate-key', 'reserved-key', 'not-object'];

    it('gives every code a human message that does not quote the file', () => {
        for (const code of codes) {
            const msg = replayErrorMessage(new SwuPgnError(code, `SECRET ${RLO} file text`, 4));
            expect(msg, code).not.toMatch(/SECRET|SWU-PGN:/);
            expect(msg.length, code).toBeGreaterThan(20);
            // Every code has its own words, not the catch-all.
            expect(msg, code).not.toMatch(/could not be read \(/);
        }
        expect(new Set(codes.map((c) => replayErrorMessage(new SwuPgnError(c, 'x')))).size).toBeGreaterThan(10);
        expect(replayErrorMessage(new SwuPgnError('unsupported-major', 'x'))).toMatch(/newer, incompatible version/);
        expect(replayErrorMessage(new SwuPgnError('bad-json', 'x', 12))).toContain('line 12');
        expect(replayErrorMessage(new SwuPgnError('bad-escape', 'x', 2))).toContain('other than \\\\ or \\"');
    });

    it('maps the real errors parse() throws', () => {
        const msg = (text: string) => {
            try {
                parse(text);
            } catch (e) {
                return replayErrorMessage(e);
            }
            return 'ok';
        };
        expect(msg('hello')).toMatch(/not a SWU-PGN replay/);
        expect(msg(VECTOR.replace('[Rounds "', '[Rounds "x'))).toMatch(/not a whole number/);
        expect(msg(VECTOR.replace('[Rounds', '[RecorderErrors "x"] [Rounds'))).toMatch(/not a whole number/);
        expect(msg(VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/2.0'))).toMatch(/newer, incompatible version/);
        expect(msg(VECTOR.replace('%%% EVENTS\n', '%%% EVENTS\n{"seq":"R0.x","t":"PASS","p":1,"p":2}\n'))).toMatch(/same field twice/);
        expect(msg(VECTOR.replace('%%% EVENTS\n', '%%% EVENTS\n{"seq":"R0.x","t":"PASS","constructor":1}\n'))).toMatch(/reserved for safety/);
        expect(msg(VECTOR.replace('[Rounds', '[toString "x"] [Rounds'))).toMatch(/reserved for safety/);
        expect(msg(VECTOR.replace('%%% CARDS', '%%% DECKS'))).toMatch(/same %%% section twice/);
        expect(msg(VECTOR.replace('[Seed "', '[Seed "a\\tb'))).toMatch(/backslash escape/);
        expect(msg(VECTOR.replace(/\n/, '\n[GameId "again"]\n'))).toMatch(/same tag twice/);
    });

    it('a refusal keeps its own message; anything else falls back to its message', async () => {
        const empty = VECTOR.replace(/%%% EVENTS[\s\S]*?(?=\n%%%|$)/, '%%% EVENTS\n');
        const err = await storeReplayContent(empty).catch((e) => e);
        expect(err).toBeInstanceOf(ReplayRefusedError);
        expect((err as ReplayRefusedError).code).toBe('no-events');
        expect(replayErrorMessage(err)).toMatch(/No events/);
        expect(replayErrorMessage(new Error('IndexedDB is closed'))).toBe('IndexedDB is closed');
        expect(replayErrorMessage('?', 'fallback')).toBe('fallback');
    });
});

describe('§3 [C-01]: what a consumer tells its user, without blocking', () => {
    const issues = (text: string) => fileIssues(parse(text)).map((i) => i.message).join('\n');

    it('says nothing extra about a current, clean file', () => {
        expect(issues(VECTOR)).toBe('');
    });

    it('names a pre-release file, a -dirty build, and a DEFEAT whose reason is unknown', () => {
        expect(issues(VECTOR.replace(/^\[WriterRevision "\d+"\]\n/m, ''))).toMatch(/Pre-release file/);
        expect(issues(VECTOR.replace(/\[Engine "([^"]*)"\]/, '[Engine "forceteki@abc1234-dirty"]'))).toMatch(/Uncommitted build/);
        expect(issues(VECTOR.replace(/\[Engine "([^"]*)"\]/, '[Engine "forceteki@unknown"]'))).toMatch(/Untraceable build/);
        expect(issues(VECTOR.replace('[Rounds', '[RecorderErrors "2"] [Rounds'))).toMatch(/2 recorder errors/);
        const defeat = VECTOR.replace(/("t":"DEFEAT"[^\n]*?"reason":")[a-z]+"/, '$1unknown"');
        expect(defeat).not.toBe(VECTOR);
        expect(issues(defeat)).toMatch(/reason "unknown"/);
    });

    it('warns on a newer minor version, but not on a pre-release 1.1, which is OLDER (§22.1)', () => {
        expect(issues(VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/1.3'))).toMatch(/newer than this viewer/);
        const pre11 = VECTOR.replace('SWU-PGN/1.0', 'SWU-PGN/1.1').replace(/^\[WriterRevision "\d+"\]\n/m, '');
        expect(issues(pre11)).not.toMatch(/newer than this viewer/);
    });

    it('ignores an X_ event type and an X_ section without a word, and names unknown ones (§18)', () => {
        const ext = VECTOR.replace('%%% EVENTS\n', '%%% EVENTS\n{"seq":"R0.S.0x","t":"X_SWUFORGE_HINT"}\n').replace('%%% ANNOTATIONS', '%%% X_SWUFORGE\nhint\n\n%%% ANNOTATIONS');
        expect(issues(ext)).toBe('');
        const later = ext.replace('X_SWUFORGE_HINT', 'FUTURE_THING').replace('%%% X_SWUFORGE', '%%% COMMENTARY');
        expect(issues(later)).toMatch(/FUTURE_THING ×1/);
        expect(issues(later)).toMatch(/%%% COMMENTARY/);
    });

    it('does not call a same-arena re-attach inert (§2.1 rule 4), but does a same-zone pile move', () => {
        const doc = parse(VECTOR);
        const move = (zone: string) => ({ seq: 'R9.A.1', t: 'MOVE', p: 1, card: 'SOR#001', from: zone, to: zone, kind: 'upgrade', attachedTo: 'SOR#002' }) as unknown as GameEvent;
        const said = (zone: string) => fileIssues({ ...doc, events: [...doc.events, move(zone)] }).map((i) => i.message).join('\n');
        expect(said('ground')).not.toMatch(/identical from\/to/);
        expect(said('discard')).toMatch(/identical from\/to/);
    });
});

describe('§23: file text is neutralised for display', () => {
    it('drops bidi formatting and turns controls into spaces, keeping tab and line feed', () => {
        expect(displayText(`a${RLO}b${String.fromCharCode(0x2066)}c`)).toBe('abc');
        expect(displayText(`a${String.fromCharCode(7)}b\tc\nd${String.fromCharCode(0x85)}e`)).toBe('a b\tc\nd e');
        expect(displayText(5)).toBe('');
        expect(displayText('<b>Wampa</b>')).toBe('<b>Wampa</b>'); // HTML is React's job: shown as text
    });

    it('reaches card names, choices, captions and bookmark labels', () => {
        const n = indexResolver([{ id: 'SOR#001', name: `Wam${RLO}pa` }]);
        expect(n.nameOf('SOR#001')).toBe('Wampa');
        const doc = { ...parse(VECTOR), events: [
            { seq: 'R1.A.1', t: 'CHOICE', p: 1, prompt: `Pick${RLO}`, offered: [`A${RLO}`, 7], chose: 0 },
            { seq: 'R1.A.2', t: 'GAME_END', winner: 1, reason: `Base${RLO} destroyed` },
        ] as unknown as GameEvent[] };
        expect(decisionPoints(doc)[0]).toMatchObject({ prompt: 'Pick', offered: ['A', '7'] });
        expect(frameAction(doc.events[1], n).label).toBe('Player 1 wins — Base destroyed');
        expect(bookmarkLabel({ seq: 'x', kind: 'GAME_END', reason: `x${RLO}y` }, (id) => id)).toBe('Game end — xy');
    });
});

describe('Result: an outcome 1.0 does not know reads as Incomplete (§18)', () => {
    it('shows Abandoned, P3 and a lowercase p1 as Incomplete, and never crowns a seat for them', () => {
        for (const r of ['Abandoned', 'P3', 'p1', 'P01']) {
            const doc = parse(VECTOR.replace(/\[Result "[^"]*"\]/, `[Result "${r}"]`));
            expect(doc.header.result, r).toBe(r);   // the parser keeps the raw value
            expect(resultOf(doc.header.result), r).toBe('Incomplete');
            expect(formatResult(doc.header.result), r).toBe('Incomplete');
            expect(() => fileIssues(doc)).not.toThrow();
        }
        expect(formatResult(parse(VECTOR).header.result)).toBe(formatResult(resultOf(parse(VECTOR).header.result)));
    });
});

describe('leader names in a mirror match (§11, §16)', () => {
    // Both seats play Chancellor Palpatine; seat 1's is flipped (deployed side up), seat 2's is not.
    // The resolver is keyed by printed id and does NOT strip `:N`, so a copy id reaching it unstripped shows as a miss.
    const byId: Record<string, string> = { 'TWI#017': 'Chancellor Palpatine, Playing Both Sides' };
    const strict = { nameOf: (id: string) => byId[id] ?? `?${id}`, backNameOf: (id: string) => (id === 'TWI#017' ? 'Darth Sidious, Sith Lord' : undefined) };

    it('names each copy by its own side on the board, in captions and in the story', () => {
        const state = emptyState();
        state.players[1] = { ...state.players[1]!, leader: { id: 'TWI#017', deployed: true, exhausted: false, epicActionUsed: true } };
        state.players[2] = { ...state.players[2]!, leader: { id: 'TWI#017:2', deployed: false, exhausted: false, epicActionUsed: false } };
        const n = sidedResolver(strict, state);
        expect(n.nameOf('TWI#017')).toBe('Darth Sidious, Sith Lord');
        expect(n.nameOf('TWI#017:2')).toBe('Chancellor Palpatine, Playing Both Sides');
        expect(n.frontNameOf('TWI#017:2')).toBe('Chancellor Palpatine, Playing Both Sides');
        expect(storyName('TWI#017:2', n)).toBe('Chancellor Palpatine, Playing Both Sides #2');
        expect(frameAction({ seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' } as GameEvent, n).label).not.toMatch(/\?TWI|Sidious/);

        const story = render({ ...parse(VECTOR), cards: [], events: [
            { seq: 'R1.A.1', t: 'DEPLOY_LEADER', p: 1, card: 'TWI#017', zone: 'ground', epic: true },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
        ] as GameEvent[] }, strict);
        expect(story).toContain('Player 2 uses Chancellor Palpatine, Playing Both Sides #2');
        expect(story).toContain('Player 1 uses Darth Sidious, Sith Lord');
        expect(story).not.toMatch(/\?TWI/);
    });
});

describe('every well-formed negative vector reaches the viewer helpers without a crash or a polluted prototype', () => {
    const NEG = path.join(DIR, 'negative');
    const MANIFEST = JSON.parse(readFileSync(path.join(DIR, 'manifest.json'), 'utf-8')) as { vectors: { file: string; level: string }[] };
    const wellFormed = MANIFEST.vectors.filter((v) => v.file.startsWith('negative/') && v.level !== 'malformed');

    it.each(wellFormed.map((v) => v.file))('%s', (file) => {
        const before = Object.getOwnPropertyNames(Object.prototype).sort().join(',');
        const doc = parse(readFileSync(path.join(NEG, '..', file), 'utf-8'));
        const frames = foldFrames(normalizeEvents(doc.events));
        expect(() => fileIssues(doc)).not.toThrow();
        expect(() => turnDigests(doc)).not.toThrow();
        expect(() => decisionPoints(doc)).not.toThrow();
        expect(() => doc.events.map((e) => frameAction(e, indexResolver(doc.cards ?? [])))).not.toThrow();
        expect(() => frames.forEach((s) => sidedResolver(indexResolver(doc.cards ?? []), s).nameOf(doc.header.p1Leader))).not.toThrow();
        expect(['Player 1', 'Player 2', 'Draw', 'Incomplete']).toContain(formatResult(doc.header.result));
        expect(Object.getOwnPropertyNames(Object.prototype).sort().join(',')).toBe(before);
    });
});

describe('pre-release is a pilot writer\'s file with no WriterRevision ([V-04], §25)', () => {
    const noRev = VECTOR.replace(/^\[WriterRevision "\d+"\]\n/m, '');
    const withEngine = (text: string, engine: string) => text.replace(/\[Engine "[^"]*"\]/, `[Engine "${engine}"]`);
    const notices = (text: string) => fileIssues(parse(text)).map((i) => i.message).join('\n');

    it('another writer without the tag is an ordinary file; forceteki is pre-release; Forceteki is not', () => {
        expect(notices(withEngine(noRev, 'examplewriter@1.0.0'))).not.toMatch(/Pre-release/);
        expect(notices(withEngine(noRev, 'forceteki@abc'))).toMatch(/Pre-release file from a pilot writer/);
        expect(notices(withEngine(noRev, 'Forceteki@abc'))).not.toMatch(/Pre-release/);
        expect(notices(withEngine(noRev, 'forceteki'))).toMatch(/Pre-release/);
        // With the tag, no writer's file is pre-release.
        expect(notices(withEngine(VECTOR, 'forceteki@abc'))).not.toMatch(/Pre-release/);
    });

    it('the other-writer vector reads with no notice at all', () => {
        const doc = parse(readFileSync(path.join(DIR, 'other-writer.swupgn'), 'utf-8'));
        expect(doc.header.writerRevision).toBeUndefined();
        expect(isPreRelease(doc.header)).toBe(false);
        expect(fileIssues(doc)).toEqual([]);
    });

    it('a 1.1 file is older than 1.0 only when it is pre-release; another writer\'s 1.1 is a newer minor', () => {
        const v11 = noRev.replace('SWU-PGN/1.0', 'SWU-PGN/1.1');
        expect(notices(withEngine(v11, 'forceteki@abc'))).not.toMatch(/newer than this viewer/);
        expect(notices(withEngine(v11, 'examplewriter@1.0.0'))).toMatch(/newer than this viewer/);
    });

    // Value: protects=writerGeneration does not call another writer's 1.1 file pre-release, so File Health never says both "pre-release" and "newer"; fails_when=the 1.1 line loses its isPreRelease gate; why_new=plan audit found the 1.1 line ungated after newerMinor moved to isPreRelease; seam=none; no_claim=wording of the line
    it('names a 1.1 file a pre-release file only when a pilot writer wrote it', () => {
        const v11 = noRev.replace('SWU-PGN/1.0', 'SWU-PGN/1.1');
        const said = (engine: string) => writerGeneration(parse(withEngine(v11, engine))).join('\n');
        expect(said('forceteki@abc')).toMatch(/Pre-release SWU-PGN\/1\.1/);
        expect(said('examplewriter@1.0.0')).not.toMatch(/Pre-release/);
    });
});

describe('grouping a beat: by `for` and seq, by position only in a file written before `for` was a MUST (§9.1, Appendix C)', () => {
    it('groups by adjacency only for pre-release files and forceteki revisions 1-3', () => {
        const h = (engine: string, writerRevision?: number) => ({ engine, writerRevision });
        expect(groupsByAdjacency(h('forceteki@abc'))).toBe(true);
        expect(groupsByAdjacency(h('forceteki@abc', 1))).toBe(true);
        expect(groupsByAdjacency(h('forceteki@abc', 3))).toBe(true);
        expect(groupsByAdjacency(h('forceteki@abc', 4))).toBe(false);
        expect(groupsByAdjacency(h('examplewriter@1.0.0'))).toBe(false);
        expect(groupsByAdjacency(h('examplewriter@1.0.0', 2))).toBe(false);
        expect(groupsByAdjacency(h('Forceteki@abc'))).toBe(false);
        expect(groupsByAdjacency(parse(VECTOR).header)).toBe(false);
    });

    // A resourcing MOVE with no `for`, right before its RESOURCE and carrying the other seat's
    // number (Appendix C): a current file never files it under the record after it by position.
    const events = [
        { seq: 'R0.S.19', t: 'RESOURCE', p: 2, card: 'SOR#009' },
        { seq: 'R0.S.20', t: 'MOVE', p: 1, card: 'SOR#002', from: 'hand', to: 'resource' },
        { seq: 'R0.S.21', t: 'RESOURCE', p: 1, card: 'SOR#002' },
    ] as unknown as GameEvent[];
    it('a current file owns an unstamped record by its seq; an old file by the record after it', () => {
        const owner = (adjacency: boolean) => buildBeats(events, { adjacency }).find((b) => b.start <= 1 && 1 <= b.end)!.anchor;
        expect(owner(false)).toBe(0);
        expect(owner(true)).toBe(2);
        // A `for` stamp decides in either kind of file.
        const stamped = events.map((e, i) => (i === 1 ? { ...e, for: 'R0.S.21' } : e)) as GameEvent[];
        expect(buildBeats(stamped, { adjacency: false }).find((b) => b.start <= 1 && 1 <= b.end)!.anchor).toBe(2);
    });
});
