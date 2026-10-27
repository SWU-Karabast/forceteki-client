import type { GameEvent } from './types';

// CLIENT SUBSET of forceteki `swupgn/src/actionLinks.ts`: only the numbered-action test, which
// `render.ts` and the replay UI share. `linkActionSteps` (the writer-side `for` stamping) is
// deliberately not ported -- see VERSION.md.

/**
 * Actions a sub-record can be filed under.
 *
 * `ABILITY_ACTIVATE` is in the set but qualifies only when its `kind` is `action` or `epic` —
 * using an action ability is one of the six things CR 6.1 lets a player spend their action on,
 * while a triggered, keyword or replacement ability is a consequence of some other action and
 * belongs under it. See `isTopLevelActionRecord`.
 */
const TOP_LEVEL_ACTIONS = new Set([
    'PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER',
    'ATTACK', 'PASS', 'CLAIM_INITIATIVE', 'ABILITY_ACTIVATE',
]);

/** Whether this record is an action in its own right (spec §9, §16). */
export function isTopLevelActionRecord(e: GameEvent): boolean {
    if (!TOP_LEVEL_ACTIONS.has(e.t)) {
        return false;
    }
    // A lettered seq is a sub-step whatever its type: a leader deployed BY its own Epic Action
    // is the ability's consequence (R1.A.1 ABILITY_ACTIVATE, R1.A.1c DEPLOY_LEADER), and the
    // player took one action, not two.
    if ((/^R\d+\.[SAG]\.\d+[a-z]+$/).test(e.seq)) {
        return false;
    }
    if (e.t !== 'ABILITY_ACTIVATE') {
        return true;
    }
    return e.kind === 'action' || e.kind === 'epic';
}
