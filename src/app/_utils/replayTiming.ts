import type { Transition } from './replayTransitions';

/** One source of truth for how long each motion runs and how long a beat holds. The
 *  animator plays these; the autoplay dwell is derived from the same numbers, so a beat
 *  always outlasts its own animation (the Karabuddy B138 lesson). */
export const SPEEDS = [0.5, 0.75, 1, 1.5, 2] as const;
export const DURATION = {
    slide: 300, enter: 300, exit: 320, playMove: 420, playFlip: 280, lunge: 440, tracer: 300,
    eventPresent: 1400, upgradePresent: 1250, resource: 1100, leaderDeploy: 1330, vignette: 380, shake: 260, badge: 240,
} as const;
export const READ_BUFFER_MS = 400;
export const HANDOFF_PAUSE_MS = 500;
export const STATIC_BEAT_MS = 350;

/** Steps arriving faster than this are a held key: snap, don't animate. */
export const RAPID_STEP_MS = 110;

export function transitionMs(t: Transition): number {
    switch (t.kind) {
        case 'play': return t.token ? DURATION.enter : DURATION.playMove + DURATION.playFlip;
        case 'upgrade': return DURATION.upgradePresent;
        case 'event': return DURATION.eventPresent;
        case 'leaderDeploy': return DURATION.leaderDeploy + DURATION.vignette;
        case 'leaderReturn': case 'leaderFlip': return DURATION.slide + DURATION.playFlip;
        case 'attack': return DURATION.lunge + (t.survived ? DURATION.shake : 0);
        case 'damage': return DURATION.tracer + (t.survived ? DURATION.shake : 0);
        case 'heal': return DURATION.tracer + DURATION.shake;
        case 'baseHit': return DURATION.shake;
        case 'defeat': return DURATION.exit;
        case 'resource': return DURATION.resource;
        case 'draw': case 'discard': case 'transfer': case 'capture': case 'release': case 'steal': return DURATION.slide;
        case 'badge': return DURATION.badge;
        case 'exhaust': case 'ready': return 0;
    }
}

/** A defeat inside an attack or a bolt beat starts when the strike lands, so it extends the chain. */
export function beatDurationMs(ts: Transition[]): number {
    if (ts.length === 0) return STATIC_BEAT_MS;
    const strike = ts.some((t) => t.kind === 'attack') ? DURATION.lunge : ts.some((t) => t.kind === 'damage') ? DURATION.tracer : 0;
    const longest = ts.reduce((m, t) => Math.max(m, t.kind === 'defeat' ? strike + transitionMs(t) : transitionMs(t)), 0);
    return longest + READ_BUFFER_MS;
}

export function dwellMs(ts: Transition[], handoff: boolean, speed: number): number {
    return Math.round((beatDurationMs(ts) + (handoff ? HANDOFF_PAUSE_MS : 0)) / (speed > 0 ? speed : 1));
}
