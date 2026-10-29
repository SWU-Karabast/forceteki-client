import { describe, it, expect } from 'vitest';
import { linkRefsFound, resolveFrameRef } from '../replayDeepLink';

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

describe('linkRefsFound', () => {
    // Value: protects=a shared moment still opens on the reserialized download with notes, whose bytes no longer hash to the link id; fails_when=the page goes back to matching the hash alone; why_new=red team and api-contract found the moment dropped; seam=none; no_claim=the page's hash comparison
    it('matches a link whose every seq is in the stream', () => {
        expect(linkRefsFound(events, ['R1.A.2u', null, null])).toBe(true);
        expect(linkRefsFound(events, [null, 'R1.A.1', 'R1.A.2u'])).toBe(true);
    });

    it('refuses a missing seq, a bare frame index, or no moment at all', () => {
        expect(linkRefsFound(events, ['R1.A.1', 'R9.A.9', null])).toBe(false);
        expect(linkRefsFound(events, ['3', null, null])).toBe(false);
        expect(linkRefsFound(events, ['R1.A.1', '2', null])).toBe(false);
        expect(linkRefsFound(events, [null, '', undefined])).toBe(false);
    });
});
