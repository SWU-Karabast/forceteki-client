import { describe, it, expect } from 'vitest';
import { nagInfo, NAG_ORDER, NAG_TONE_COLOR } from '../nagGlyphs';

describe('nagGlyphs', () => {
    it('resolves each glyph in NAG_ORDER to info', () => {
        expect(NAG_ORDER).toHaveLength(6);
        for (const g of NAG_ORDER) {
            const info = nagInfo(g);
            expect(info).not.toBeNull();
            expect(info!.glyph).toBe(g);
            expect(info!.label.length).toBeGreaterThan(0);
            expect(NAG_TONE_COLOR[info!.tone]).toBeDefined();
        }
    });

    it('returns null for empty or unknown glyphs', () => {
        expect(nagInfo()).toBeNull();
        expect(nagInfo('')).toBeNull();
        expect(nagInfo('???')).toBeNull();
        expect(nagInfo('x')).toBeNull();
    });

    it('classifies tone correctly', () => {
        expect(nagInfo('!!')!.tone).toBe('good');
        expect(nagInfo('??')!.tone).toBe('bad');
        expect(nagInfo('!?')!.tone).toBe('mixed');
    });
});
