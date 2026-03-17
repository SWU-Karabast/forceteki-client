import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A single text replacement rule.
 *
 * - `pattern` – a RegExp whose *source* is incorporated into a combined regex
 *   at parse time. Do **not** include the `g` flag; it is added automatically.
 *   Flags other than `g`/`i` are ignored in the combined pattern.
 *
 * - `render` – called for every match; must return a React node. Use `key` as
 *   the React key to avoid reconciliation warnings.
 */
export interface TextReplacementRule {
    pattern: RegExp;
    render: (match: string, key: number) => React.ReactNode;
}

// ─────────────────────────────────────────────────────────────────────────────
// Aspect icon replacements  (:vigilance:, :command:, …)
// ─────────────────────────────────────────────────────────────────────────────

const aspectIconStyle: React.CSSProperties = {
    display: 'inline-block',
    height: '1.15em',
    width: 'auto',
    verticalAlign: 'middle',
    marginInline: '0.15em',
};

/** Maps colon-delimited token name → public asset path. */
const ASPECT_ICONS: Record<string, string> = {
    vigilance: '/aspect-icons/aspect-vigilance.webp',
    command:   '/aspect-icons/aspect-command.webp',
    aggression:'/aspect-icons/aspect-aggression.webp',
    cunning:   '/aspect-icons/aspect-cunning.webp',
    villainy:  '/aspect-icons/aspect-villainy.webp',
    heroism:   '/aspect-icons/aspect-heroism.webp',
};

/**
 * Replacement rules for colon-delimited aspect tokens.
 * Each token (e.g. `:vigilance:`) is replaced by the corresponding aspect icon.
 */
export const aspectReplacementRules: TextReplacementRule[] = Object.entries(ASPECT_ICONS).map(
    ([name, src]) => ({
        // Case-insensitive match for :name: delimiters
        pattern: new RegExp(`:${name}:`, 'i'),
        render: (_match: string, key: number) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                key={key}
                src={src}
                alt={name}
                title={name.charAt(0).toUpperCase() + name.slice(1)}
                style={aspectIconStyle}
            />
        ),
    })
);

// ─────────────────────────────────────────────────────────────────────────────
// Resource icon replacements  ({resource:0}, {resource:1}, …)
// ─────────────────────────────────────────────────────────────────────────────

const resourceIconStyle: React.CSSProperties = {
    display: 'inline-block',
    height: '1.15em',
    width: 'auto',
    verticalAlign: 'middle',
    marginInline: '0.15em',
};

const MAX_RESOURCE_ICON = 12;

/**
 * Replacement rule for resource cost tokens.
 * `{resource:n}` where n is 0–12 renders the corresponding icon;
 * numbers beyond 12 are replaced with the text "N Resources".
 */
export const resourceReplacementRule: TextReplacementRule = {
    pattern: /\{resource:(\d+)\}/,
    render: (match: string, key: number) => {
        const n = Number(match.replace(/\{resource:(\d+)\}/, '$1'));
        if (n <= MAX_RESOURCE_ICON) {
            return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    key={key}
                    src={`/resource-icons/resource-${n}.webp`}
                    alt={`${n} resource${n !== 1 ? 's' : ''}`}
                    title={`${n} Resource${n !== 1 ? 's' : ''}`}
                    style={resourceIconStyle}
                />
            );
        }
        return <span key={key}>{n} Resources</span>;
    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Default rule set
// Add new rule sets here to enable them globally by default.
// ─────────────────────────────────────────────────────────────────────────────

export const defaultReplacementRules: TextReplacementRule[] = [
    ...aspectReplacementRules,
    resourceReplacementRule,
];
