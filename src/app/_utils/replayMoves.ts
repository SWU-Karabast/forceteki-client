/** Expand the terse P1/P2 result tokens into full player labels. */
export function formatResult(result: string): string {
    return result.replace(/\bP1\b/g, 'Player 1').replace(/\bP2\b/g, 'Player 2');
}

function parseRoundPhase(seq: string): { round: string; phase: string } | null {
    const m = String(seq).match(/^R(\d+)\.([A-Z])/);
    if (!m) return null;
    const phase = m[2] === 'A' ? 'Action' : m[2] === 'G' ? 'Regroup' : m[2] === 'S' ? 'Setup' : m[2];
    return { round: m[1], phase };
}

/**
 * Human label for a seq's round + phase, e.g. "Round 1, Action Phase".
 * Empty string when the seq doesn't carry a round/phase. Single source of truth
 * for phase decoding so the scrub bar and transport label can't drift — the
 * server emits A=Action, G=Regroup, S=Setup.
 */
export function formatRoundPhase(seq: string): string {
    const rp = parseRoundPhase(seq);
    if (!rp) return '';
    return `Round ${rp.round}, ${rp.phase} Phase`;
}

/**
 * First frame filed under each top-level action, from the `for` links (spec §9.1).
 *
 * The engine performs part of an action before it announces it, so those records are numbered
 * with the PREVIOUS action's step: an attack's target `CHOICE` and the attacker's `EXHAUST`
 * are `R2.A.5a`/`R2.A.5b` and belong to the `ATTACK` at `R2.A.6`. The writer states that with
 * `for`, which is legal on any record, so a reader never has to implement the sentence.
 *
 * Used to start a move's span at the first record belonging to it rather than at its own
 * record: otherwise the move list highlights the previous action while the attacker is being
 * chosen and exhausted on screen. A file whose writer stamped no `for` simply has no entries
 * here, and every span starts where it always did.
 *
 * This reports the first index carrying each link and nothing more — it does NOT promise the
 * links are sanely ordered, because `for` is legal on ANY record and these files are uploaded.
 * The caller decides whether a filed frame is usable (see `moveFrames` in Replay.context).
 */
export function firstFrameByAction(events: Array<{ for?: string }>): Map<string, number> {
    const out = new Map<string, number>();
    for (let i = 0; i < events.length; i++) {
        const link = events[i]?.for;
        if (typeof link === 'string' && !out.has(link)) out.set(link, i);
    }
    return out;
}

/** `1h 04m` / `12m 31s` / `48s`, from a millisecond span. */
function formatSpan(ms: number): string {
    const total = Math.round(ms / 1000);
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
    if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
}

/**
 * The file's own metadata line: how long the game took, and where it sits in a match.
 *
 * `Date` is when the game started and `EndDate` when it ended (spec §5.2), so the pair is the
 * duration — the one thing per-event timestamps would have bought. `Match` is an opaque id
 * stable across the games of one Bo3 (the reference writer emits `sha256:<hex>` of the lobby
 * id, never the lobby id itself), and `GameNumber` says which game of it this is; a match id
 * is shown short, since only its equality with another file's matters.
 *
 * Every part is optional and each is emitted only when the file states it: an older file, an
 * unfinished game, or a delivery path that never set `GameNumber` shows fewer parts, never a
 * guess. Empty string when the file states none.
 */
/**
 * ISO-8601 with an explicit offset (`Z` or `±hh:mm`). §5.2 says `Date`/`EndDate` are UTC, but
 * nothing validates it and these files are uploaded: `Date.parse` reads an offset-less
 * timestamp as LOCAL time, which is finite and plausible, so the existing guards pass and the
 * duration is silently wrong by the viewer's UTC offset. A stamp that does not say its zone
 * is treated as not recorded.
 */
const utcMs = (v: string | undefined): number =>
    (v && /(?:Z|[+-]\d{2}:?\d{2})$/.test(v) ? Date.parse(v) : NaN);

export function formatGameMeta(h: { date?: string; endDate?: string; match?: string; gameNumber?: number }): string {
    const parts: string[] = [];
    const start = utcMs(h.date);
    const end = utcMs(h.endDate);
    // A negative span is a clock that went backwards between the two stamps: say nothing
    // rather than "-3m".
    if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        parts.push(formatSpan(end - start));
    }
    if (h.match) {
        // `GameNumber` is meaningless without `Match` (§5.2), so it only ever rides along here.
        const short = h.match.replace(/^sha256:/, '').slice(0, 7);
        parts.push(h.gameNumber ? `game ${h.gameNumber} of match ${short}` : `match ${short}`);
    }
    return parts.join(' · ');
}
