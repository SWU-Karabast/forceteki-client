'use client';
import React from 'react';
import { Box, SxProps, Theme } from '@mui/material';
import { TextReplacementRule, defaultReplacementRules } from './replacementRules';

// ─────────────────────────────────────────────────────────────────────────────
// Text parsing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walks through `text` applying every rule in `rules` simultaneously via a
 * single combined regex, returning an array of React nodes (plain string
 * segments interleaved with rendered replacements).
 *
 * Rules are evaluated in the order provided; the first matching group wins.
 */
function parseText(text: string, rules: TextReplacementRule[]): React.ReactNode[] {
    if (!text) return [];
    if (!rules.length) return [text];

    // Convert inner capturing groups to non-capturing so that each rule
    // contributes exactly one top-level group in the combined regex.
    // This keeps the mapping match[i+1] → rules[i] correct.
    const toNonCapturing = (source: string) =>
        source.replace(/(?<!\\)\((?!\?)/g, '(?:');

    // Build one regex with a dedicated capturing group per rule so we can
    // identify *which* rule produced each match without running them serially.
    const combined = new RegExp(
        rules.map((r) => `(${toNonCapturing(r.pattern.source)})`).join('|'),
        'gi'
    );

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let nodeKey = 0;
    let match: RegExpExecArray | null;

    while ((match = combined.exec(text)) !== null) {
        // Append any literal text that precedes this match.
        if (match.index > lastIndex) {
            nodes.push(text.slice(lastIndex, match.index));
        }

        // Capturing groups start at index 1; group i+1 belongs to rules[i].
        for (let i = 0; i < rules.length; i++) {
            if (match[i + 1] !== undefined) {
                nodes.push(rules[i].render(match[i + 1], nodeKey++));
                break;
            }
        }

        lastIndex = match.index + match[0].length;
    }

    // Append any remaining literal text after the last match.
    if (lastIndex < text.length) {
        nodes.push(text.slice(lastIndex));
    }

    return nodes;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export interface RichTextProps {

    /** Raw text string, potentially containing replacement tokens. */
    text: string;

    /** MUI `sx` prop forwarded to the wrapping inline `<span>`. */
    sx?: SxProps<Theme>;

    /**
     * MUI component used as the wrapper element. Defaults to `Box`.
     * Pass `Typography` when the component needs to participate in MUI
     * typography style inheritance from its ancestors.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    component?: React.ElementType<any>;

    /**
     * Provide a completely custom set of replacement rules. When not supplied, 
     * ${@link defaultReplacementRules} are used.
     */
    replacementRules?: TextReplacementRule[];
}

/**
 * Renders a string with inline token replacements (icons, styled text, etc.).
 *
 * Uses all `defaultReplacementRules` by default (aspect icons, etc.).
 * Pass `replacementRules` to override completely.
 *
 * @example
 * // Renders "Disclose :vigilance:" with the Vigilance icon inline.
 * <RichText text="Disclose :vigilance:" />
 */
const RichText: React.FC<RichTextProps> = ({
    text,
    sx,
    replacementRules,
    component: Wrapper = Box,
}) => {
    const rules = replacementRules ?? defaultReplacementRules;
    const nodes = parseText(text, rules);

    return (
        <Wrapper component="span" sx={sx}>
            {nodes}
        </Wrapper>
    );
};

export default RichText;
