import type { GameEvent } from '@/lib/swupgn';
import { NUMBERED_ACTIONS as NUMBERED } from './swupgnMoves';

/**
 * Maps the numbered lines of a `%%% STORY` back to frames, using the story's own numbering
 * (spec §16): only PLAY, PLAY_EVENT, PLAY_UPGRADE, PLAY_SMUGGLE, DEPLOY_LEADER, ATTACK, PASS
 * and CLAIM_INITIATIVE get a number, and the counter resets at every ROUND_START and every
 * PHASE_START. Built from EVENTS (the truth), never from the prose, so a wording change
 * cannot break it; an ability activation or a claimed initiative used to shift every click
 * after it onto the wrong event.
 *
 * Keys: `R{round}` for a round banner, `R{round}.{phaseOrdinal}.{n}` for the n-th numbered
 * action of that round's k-th phase block (k counts ` ── phase ──` lines since the banner).
 */
export function storySeekIndex(events: GameEvent[]): Map<string, number> {
    const m = new Map<string, number>();
    let round = 0;
    let phase = 0;
    let action = 0;
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        if (e == null || typeof e !== 'object') continue;
        if (e.t === 'ROUND_START') {
            round = e.round; phase = 0; action = 0;
            m.set(`R${round}`, i);
            continue;
        }
        if (e.t === 'PHASE_START') { phase += 1; action = 0; continue; }
        if (NUMBERED.has(e.t)) {
            action += 1;
            const key = `R${round}.${phase}.${action}`;
            if (!m.has(key)) m.set(key, i);
        }
    }
    return m;
}

/** `  7. Player 1 attacks ...` -> 7. Only leading-numbered lines are seekable. */
export const actionNumberOf = (line: string): number | null => {
    const m = /^\s{1,4}(\d+)\.\s/.exec(line);
    return m ? Number(m[1]) : null;
};

/** `═══ ROUND 2 ═══` / ` ROUND 2   initiative: ...` -> 2. */
export const roundOf = (line: string): number | null => {
    const m = /^[\s═]*ROUND\s+(\d+)\b/.exec(line);
    return m ? Number(m[1]) : null;
};

/** ` ── action ──` -> true: a phase banner, which restarts the numbering. */
export const isPhaseLine = (line: string): boolean => /^\s*──\s.*\s──\s*$/.test(line);

/**
 * Walks the story lines and yields, per line, the frame it can seek to (or undefined).
 * Before any round banner the prose sits in round 0 (the setup prologue).
 */
export function storyLineTargets(lines: string[], index: Map<string, number>): Array<number | undefined> {
    let round = 0;
    let phase = 0;
    return lines.map((line) => {
        const r = roundOf(line);
        if (r != null) { round = r; phase = 0; return index.get(`R${r}`); }
        if (isPhaseLine(line)) { phase += 1; return undefined; }
        const n = actionNumberOf(line);
        return n != null ? index.get(`R${round}.${phase}.${n}`) : undefined;
    });
}
