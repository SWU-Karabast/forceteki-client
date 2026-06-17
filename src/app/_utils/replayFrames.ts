import type { GameEvent } from '@/lib/swupgn';

/** One frame per event; the frame's seq is the event's seq. */
export function snapshotSeqs(events: GameEvent[]): string[] {
    return events.map((e) => e.seq);
}

/** Events resolved at each frame (1:1 in 1.1) — drives caption/highlight. */
export function eventsByFrame(events: GameEvent[]): GameEvent[][] {
    return events.map((e) => [e]);
}
