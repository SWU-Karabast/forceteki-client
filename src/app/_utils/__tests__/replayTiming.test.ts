import { describe, it, expect } from 'vitest';
import { beatDurationMs, dwellMs, transitionMs, DURATION, READ_BUFFER_MS, HANDOFF_PAUSE_MS, STATIC_BEAT_MS, SPEEDS } from '../replayTiming';
import type { Transition } from '../replayTransitions';

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
