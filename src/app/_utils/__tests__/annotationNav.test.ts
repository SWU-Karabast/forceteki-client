import { describe, it, expect } from 'vitest';
import { annotatedIndices, nextTag, prevTag } from '../annotationNav';

const seqs = ['R1.P1.1', 'R1.P1.2', 'R1.P2.1', 'R1.P2.2', 'R2.P1.1'];

describe('annotationNav', () => {
    const refs = new Set(['R1.P1.2', 'R2.P1.1']); // annotated at indices 1 and 4

    it('annotatedIndices returns annotated frame indices in order', () => {
        expect(annotatedIndices(seqs, refs)).toEqual([1, 4]);
    });

    it('nextTag finds the next annotated frame after current', () => {
        expect(nextTag(seqs, refs, 0)).toBe(1);
        expect(nextTag(seqs, refs, 1)).toBe(4);
        expect(nextTag(seqs, refs, 2)).toBe(4);
    });

    it('nextTag returns null when none remain', () => {
        expect(nextTag(seqs, refs, 4)).toBeNull();
        expect(nextTag(seqs, new Set(), 0)).toBeNull();
    });

    it('prevTag finds the previous annotated frame before current', () => {
        expect(prevTag(seqs, refs, 4)).toBe(1);
        expect(prevTag(seqs, refs, 2)).toBe(1);
    });

    it('prevTag returns null when none remain', () => {
        expect(prevTag(seqs, refs, 1)).toBeNull();
        expect(prevTag(seqs, refs, 0)).toBeNull();
        expect(prevTag(seqs, new Set(), 4)).toBeNull();
    });
});
