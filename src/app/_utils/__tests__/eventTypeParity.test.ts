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
 *
 * Two structural assumptions, stated because this reads source text rather than values:
 *  - each list stays ONE flat array literal of quoted names, not `[...A, ...B]` or `.concat()`;
 *  - `fold.ts` and `replayAction.ts` each keep exactly ONE switch over `GameEvent['t']`, since
 *    a second one would silently widen the sets and could hide a real gap.
 * Break either and this fails loudly (never vacuously — the size guard below covers that), but
 * for the wrong reason. Restructure the lists and this test has to move with them.
 */
const SRC = (p: string) => readFileSync(path.join(__dirname, '..', p), 'utf-8');
const LIB = (p: string) => readFileSync(path.join(__dirname, '../../../lib/swupgn', p), 'utf-8');

/** Every `case 'X':` label in a switch-bearing source file. */
const caseLabels = (src: string): Set<string> =>
    new Set([...src.matchAll(/case '([A-Z_]+)':/g)].map((m) => m[1]));

/** Every `case 'X':` label inside one named function's body (braces-matched), not the whole file. */
function caseLabelsInFunction(src: string, name: string): Set<string> {
    const start = src.indexOf(`function ${name}`);
    if (start < 0) throw new Error(`${name} not found — the parity test is checking nothing`);
    const bodyStart = src.indexOf('{', start);
    let depth = 0, end = bodyStart;
    for (; end < src.length; end++) {
        if (src[end] === '{') depth++;
        else if (src[end] === '}' && --depth === 0) break;
    }
    return caseLabels(src.slice(bodyStart, end + 1));
}

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
        // And the one-switch-per-file assumption the extraction rests on.
        for (const [file, src] of [['fold.ts', LIB('fold.ts')], ['replayAction.ts', SRC('replayAction.ts')]] as const) {
            expect((src.match(/\bswitch\s*\(/g) ?? []).length, `${file} has one switch`).toBe(1);
        }
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

    it('replayBeats.BANNERS includes only the types that are beat banners', () => {
        // BANNERS groups the round/phase/game markers into single-frame beats. Every event type
        // not in BANNERS has to be justified here, so adding a new ROUND_START-like type to the
        // fold without adding it to BANNERS fails.
        const NOT_A_BANNER = new Set([
            // Player actions and their consequences, grouped into action beats.
            'PLAY', 'PLAY_SMUGGLE', 'PLAY_EVENT', 'PLAY_UPGRADE', 'ATTACK', 'PASS', 'EXHAUST',
            'READY', 'EXHAUST_RESOURCES', 'READY_RESOURCES', 'STATS', 'CHOICE', 'MODAL_CHOICE',
            'ABILITY_ACTIVATE', 'LEADER_FLIP', 'DEPLOY_LEADER', 'CLAIM_INITIATIVE', 'DEFEAT',
            // Cards added to play or discard.
            'MOVE', 'DRAW', 'DISCARD', 'RESOURCE', 'REVEAL', 'SEARCH',
            // Effects of an action.
            'DAMAGE', 'HEAL', 'OVERWHELM', 'SHIELD_GAIN', 'SHIELD_USE', 'EXPERIENCE_GAIN',
            'STATUS_TOKEN', 'CREATE_TOKEN', 'CAPTURE', 'RESCUE', 'TAKE_CONTROL', 'TRIGGER',
            // Phase and round machinery (other than the banner markers).
            'PHASE_END', 'ROUND_END',
            // Housekeeping.
            'SHUFFLE', 'MULLIGAN', 'KEEP_HAND',
            // A note on the action it interrupted, so it rides in that action's beat.
            'UNDO',
        ]);
        const banners = quotedNamesIn(SRC('replayBeats.ts'), 'BANNERS');
        const missing = [...FOLD_TYPES].filter((t) => !banners.has(t) && !NOT_A_BANNER.has(t));
        expect(missing, 'an event type that looks like a banner but is not in BANNERS').toEqual([]);
    });

    it('replayTransitions.classifyBeat only switches on types the fold folds', () => {
        // Unlike the lists above, this checks the other direction: a typo'd case label in
        // classifyBeat's switch would silently never fire, since its `default` swallows it.
        const classified = caseLabelsInFunction(SRC('replayTransitions.ts'), 'classifyBeat');
        const bogus = [...classified].filter((t) => !FOLD_TYPES.has(t));
        expect(bogus, 'a case label here that fold.ts never emits would never fire').toEqual([]);
    });
});
