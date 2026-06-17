/** Expand the terse P1/P2 result tokens into full player labels. */
export function formatResult(result: string): string {
    return result.replace(/\bP1\b/g, 'Player 1').replace(/\bP2\b/g, 'Player 2');
}

function parseRoundPhase(seq: string): { round: string; phase: string } | null {
    const m = seq.match(/^R(\d+)\.([A-Z])/);
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
