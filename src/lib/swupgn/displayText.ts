// CLIENT-ONLY (see VERSION.md). Spec §23 "Display injection", §3 [R-04].

/**
 * Bidirectional formatting: the embeddings and overrides (U+202A–U+202E), the isolates
 * (U+2066–U+2069) and the three marks (LRM, RLM, ALM). An override can make a line read
 * differently from what it says (U+202E before "nruter" shows it as "return"), and nothing a
 * card name, a note or a header value legitimately needs is lost without them.
 */
const BIDI = /[\u202A-\u202E\u2066-\u2069\u200E\u200F\u061C]/g;

/** C0 and C1 controls other than tab and line feed, and the Unicode line/paragraph separators. */
// eslint-disable-next-line no-control-regex
const CONTROL = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F\u2028\u2029]/g;

/**
 * A string from a `.swupgn` file, made safe to SHOW. Every such string is attacker-controlled
 * (CARDS names, `Reason`, CHOICE prompts, annotation text and author, P1/P2, unknown fields):
 * React already escapes it for HTML, so this neutralises what escaping does not -- bidi
 * formatting is dropped and other control characters become a space. Tab and line feed are
 * kept, because a note may span lines. A non-string becomes `''`.
 *
 * Display only: the document itself is never rewritten, so an export carries the file's bytes.
 */
export function displayText(v: unknown): string {
    return typeof v === 'string' ? v.replace(BIDI, '').replace(CONTROL, ' ') : '';
}
