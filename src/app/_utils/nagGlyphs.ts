// NAG (Numeric Annotation Glyph) set for replay annotations — chess-style quality
// marks an author can attach to a move. The .swupgn Annotation.nag field stores the
// literal glyph string (see src/lib/swupgn/types.ts). This module is the single source
// of truth for which glyphs exist, their order in the picker, and how they render.

export interface NagInfo {
    glyph: string;
    label: string;

    /** Semantic color bucket for the badge: positive | negative | neutral. */
    tone: 'good' | 'bad' | 'mixed';
}

// Order shown in the authoring picker (best → worst, then the "mixed" pair).
export const NAG_ORDER: readonly string[] = ['!!', '!', '!?', '?!', '?', '??'];

const NAG_TABLE: Record<string, NagInfo> = {
    '!!': { glyph: '!!', label: 'Brilliant', tone: 'good' },
    '!': { glyph: '!', label: 'Good', tone: 'good' },
    '!?': { glyph: '!?', label: 'Interesting', tone: 'mixed' },
    '?!': { glyph: '?!', label: 'Dubious', tone: 'mixed' },
    '?': { glyph: '?', label: 'Mistake', tone: 'bad' },
    '??': { glyph: '??', label: 'Blunder', tone: 'bad' },
};

/** Look up display info for a NAG glyph. Returns null for empty/unknown glyphs. */
export function nagInfo(nag?: string): NagInfo | null {
    if (!nag) return null;
    return NAG_TABLE[nag] ?? null;
}

/** Badge color per tone (CSS color string). Used by AnnotationBadge / ReviewPanel. */
export const NAG_TONE_COLOR: Record<NagInfo['tone'], string> = {
    good: '#39d98a', // green
    bad: '#ff6b6b', // red
    mixed: '#ffc857', // amber
};
