import { describe, it, expect } from 'vitest';
import { resolveFrameRef } from '../replayDeepLink';

const events = [{ seq: 'S.1' }, { seq: 'R1.A.1' }, { seq: 'R1.A.2u' }, { seq: 'R1.A.2u' }];

describe('resolveFrameRef', () => {
    it('resolves a seq to its first frame', () => {
        expect(resolveFrameRef(events, 'R1.A.2u')).toBe(2);
    });

    it('takes an all-digits value as a legacy frame index', () => {
        expect(resolveFrameRef(events, '3')).toBe(3);
        expect(resolveFrameRef(events, 0)).toBe(0);
    });

    it('floors a fractional value', () => {
        expect(resolveFrameRef(events, '1.5')).toBe(1);
    });

    it('returns null for a non-numeric value that matches no seq', () => {
        expect(resolveFrameRef(events, 'R9.Z.9')).toBeNull();
    });

    it('returns null for an empty or missing value', () => {
        expect(resolveFrameRef(events, '')).toBeNull();
        expect(resolveFrameRef(events, null)).toBeNull();
        expect(resolveFrameRef(events, undefined)).toBeNull();
    });
});
