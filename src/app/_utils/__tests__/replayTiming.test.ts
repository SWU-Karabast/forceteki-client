import { describe, it, expect } from 'vitest';
import { autoplayDwellMs, beatDurationMs, dwellMs, transitionMs, DURATION, READ_BUFFER_MS, HANDOFF_PAUSE_MS, STATIC_BEAT_MS, SPEEDS } from '../replayTiming';
import type { Transition } from '../replayTransitions';
import type { Beat } from '../replayBeats';

const play: Transition = { kind: 'play', card: 'X', seat: 1, to: 'groundArena', token: false };
const attack: Transition = { kind: 'attack', atk: 'A', def: 'B', seat: 1, defenderType: 'unit', survived: true };
const defeat: Transition = { kind: 'defeat', card: 'B', seat: 2, reason: 'combat' };

describe('replayTiming', () => {
    it('a unit play is the flight plus the flip', () => expect(transitionMs(play)).toBe(DURATION.playMove + DURATION.playFlip));
    it('a beat lasts its longest transition plus a read buffer', () => {
        expect(beatDurationMs([attack, defeat])).toBe(DURATION.lunge + DURATION.exit + READ_BUFFER_MS); // the defeat waits for the jab
        expect(beatDurationMs([play])).toBe(700 + READ_BUFFER_MS);
    });
    it('a beat that moves nothing still holds for a moment', () => expect(beatDurationMs([])).toBe(STATIC_BEAT_MS));
    it('speed scales the dwell and a handoff adds a pause before scaling', () => {
        expect(dwellMs([play], false, 1)).toBe(1100);
        expect(dwellMs([play], true, 1)).toBe(1100 + HANDOFF_PAUSE_MS);
        expect(dwellMs([play], true, 2)).toBe(800);
        expect(dwellMs([play], false, 0.5)).toBe(2200);
    });
    it('every speed is positive and 1 is in the list', () => { expect(SPEEDS).toContain(1); for (const s of SPEEDS) expect(s).toBeGreaterThan(0); });
});

describe('autoplayDwellMs', () => {
    // The attack beat (frames 0-1) is long; the play beat after it (frame 2) is short.
    const beats: Beat[] = [
        { index: 0, kind: 'action', start: 0, end: 1, anchor: 0, seat: 1 },
        { index: 1, kind: 'action', start: 2, end: 2, anchor: 2, seat: 2 },
    ] as Beat[];
    const transitionsOf = (b: Beat): Transition[] => (b.index === 0 ? [attack, defeat] : [play]);

    // Value: protects=autoplay holds a beat for its OWN animation, so a long attack is not cut short by a short play after it; fails_when=the dwell is timed for the next beat again; why_new=Codex structured review (P2) found the next beat's duration used; seam=none; no_claim=what the animator draws
    it('holds a shown beat for its own animation, plus the handoff pause when the seat changes', () => {
        expect(autoplayDwellMs(beats, beats[0], 1, transitionsOf, 1)).toBe(beatDurationMs([attack, defeat]) + HANDOFF_PAUSE_MS);
        expect(autoplayDwellMs(beats, beats[1], 2, transitionsOf, 2)).toBe(Math.round(beatDurationMs([play]) / 2));
    });

    it('holds a frame part-way into a beat for the base dwell only', () => {
        expect(autoplayDwellMs(beats, beats[0], 0, transitionsOf, 1)).toBe(dwellMs([], false, 1));
    });
});

