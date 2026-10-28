import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse, displayText, SwuPgnError, type GameEvent, type SetupInitRecord } from '@/lib/swupgn';
import { initRecord, deckByFrame } from '../deckTracker';
import { roundOfSeq, turnDigests } from '../turnDigests';
import { fileIssues, replayErrorMessage, ReplayRefusedError } from '../swupgnFileIssues';
import { storeReplayContent } from '../replayHandoff';
import { decisionPoints, bookmarkLabel } from '../replayDecisions';
import { frameAction } from '../replayAction';
import { indexResolver } from '@/lib/swupgn';

const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
// The regenerated vectors were written by a `-dirty` build, which §3 [C-01] says to point out.
// Every test here starts from a clean build's Engine so that notice is the one under test.
const VECTOR = readFileSync(path.join(DIR, 'homeworlds.swupgn'), 'utf-8').replace(/(\[Engine "[^"]*)-dirty"/, '$1"');
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
    const codes = ['not-swupgn', 'unsupported-version', 'too-large', 'line-too-long', 'too-many-records', 'too-deep',
        'bad-header-line', 'bad-escape', 'duplicate-tag', 'missing-tag', 'bad-count', 'duplicate-section',
        'record-outside-section', 'bad-json', 'not-object'];

    it('gives every code a human message that does not quote the file', () => {
        for (const code of codes) {
            const msg = replayErrorMessage(new SwuPgnError(code, `SECRET ${RLO} file text`, 4));
            expect(msg, code).not.toMatch(/SECRET|SWU-PGN:/);
            expect(msg.length, code).toBeGreaterThan(20);
        }
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
        expect(msg(VECTOR.replace('[Rounds "', '[Rounds "x'))).toMatch(/round count/);
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
