import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';

/**
 * Three hand-maintained lists sit parallel to `fold.ts`'s switch, and all three have drifted
 * from it at least once:
 *
 *  - `swupgnFileIssues.KNOWN_EVENT_TYPES` — a type missing here makes a CONFORMANT file report
 *    "N unknown event types folded as do nothing (§18)". `LEADER_FLIP` did exactly that.
 *  - `replayAction.frameAction` — a type missing here gets no live caption. `LEADER_FLIP` again.
 *  - `swupgnMoves.MOVE_TYPES` — a type missing here gets no Moves-tab row.
 *
 * `render.ts` cannot drift because its switch ends in a `never` exhaustiveness check. These
 * three can't use one: they must keep a `default` that ignores an unknown type, because spec
 * §18 says a reader folds an unrecognised `t` to nothing rather than refusing the file.
 *
 * So the parity check is a test instead. It reads the source of the fold's switch and requires
 * every `case '<TYPE>'` in it to be accounted for in each list — handled, or deliberately named
 * in the exclusion set below with the reason. Adding an event type to `fold.ts` and nowhere
 * else fails here, which is the only thing that has ever caught this class.
 */
const SRC = (p: string) => readFileSync(path.join(__dirname, '..', p), 'utf-8');
const LIB = (p: string) => readFileSync(path.join(__dirname, '../../../lib/swupgn', p), 'utf-8');

/** Every `case 'X':` label in a switch-bearing source file. */
const caseLabels = (src: string): Set<string> =>
    new Set([...src.matchAll(/case '([A-Z_]+)':/g)].map((m) => m[1]));

/**
 * The UPPER_SNAKE string literals in the `const <name> = …` declaration, that declaration only.
 * Runs to the closing `]);` / `];` rather than the first `]`, because the first bracket after
 * the name belongs to the generic (`new Set<GameEvent['t']>([`), not to the array.
 */
function quotedNamesIn(src: string, name: string): Set<string> {
    const start = src.indexOf(`const ${name}`);
    if (start < 0) throw new Error(`${name} not found — the parity test is checking nothing`);
    const end = [']);', '];']
        .map((close) => src.indexOf(close, start))
        .filter((i) => i >= 0)
        .sort((a, b) => a - b)[0];
    if (end == null) throw new Error(`${name} is not an array literal any more`);
    return new Set([...src.slice(start, end).matchAll(/'([A-Z_]+)'/g)].map((m) => m[1]));
}

const FOLD_TYPES = caseLabels(LIB('fold.ts'));

describe('event-type parity with the fold switch', () => {
    it('the fold handles the types this test is meant to police', () => {
        // A sanity check on the regex itself: if the switch is ever restructured so no labels
        // are found, every assertion below would pass vacuously.
        expect(FOLD_TYPES.size).toBeGreaterThan(25);
        expect(FOLD_TYPES.has('LEADER_FLIP')).toBe(true);
    });

    it('swupgnFileIssues.KNOWN_EVENT_TYPES covers every type the fold folds', () => {
        const known = quotedNamesIn(SRC('swupgnFileIssues.ts'), 'KNOWN_EVENT_TYPES');
        const missing = [...FOLD_TYPES].filter((t) => !known.has(t));
        expect(missing, 'a conformant file would report these as "unknown event type"').toEqual([]);
    });

    it('replayAction.frameAction captions or deliberately silences every type', () => {
        const handled = caseLabels(SRC('replayAction.ts'));
        const missing = [...FOLD_TYPES].filter((t) => !handled.has(t));
        expect(missing, 'these get no caption on their frame').toEqual([]);
    });

    it('swupgnMoves.MOVE_TYPES omits only types that are not a player action', () => {
        // MOVE_TYPES is deliberately narrower: it lists what is worth clicking to seek. Every
        // omission has to be named here, so adding a new PLAYER ACTION to the fold without
        // adding it to the move list fails.
        const NOT_A_SEEK_TARGET = new Set([
            // Mechanism: the board shows what these did (§16 prints nothing for them either).
            'MOVE', 'EXHAUST', 'READY', 'EXHAUST_RESOURCES', 'READY_RESOURCES', 'STATS',
            'CHOICE', 'MODAL_CHOICE', 'SHUFFLE', 'PHASE_START', 'PHASE_END', 'ROUND_START',
            'ROUND_END',
            // Consequences of an action, reached by seeking to the action itself.
            'DAMAGE', 'HEAL', 'OVERWHELM', 'SHIELD_GAIN', 'SHIELD_USE', 'EXPERIENCE_GAIN',
            'STATUS_TOKEN', 'CREATE_TOKEN', 'CAPTURE', 'RESCUE', 'TAKE_CONTROL', 'TRIGGER',
            'ABILITY_ACTIVATE', 'DRAW', 'DISCARD', 'RESOURCE', 'REVEAL', 'SEARCH',
            'MULLIGAN', 'KEEP_HAND',
        ]);
        const moveTypes = quotedNamesIn(SRC('swupgnMoves.ts'), 'MOVE_TYPES');
        const missing = [...FOLD_TYPES].filter((t) => !moveTypes.has(t) && !NOT_A_SEEK_TARGET.has(t));
        expect(missing, 'a player action with no row in the Moves tab').toEqual([]);
    });
});
