import type { SwuPgnDocument, Header, DeckRecord, GameEvent, Annotation, SetupInitRecord, CardIndexRecord } from './types';

// Vendored from forceteki swupgn/src/parse.ts at c233908d6. Every block marked CLIENT-OWNED is
// a documented divergence (see VERSION.md); everything else mirrors upstream.

/**
 * A reader error with a stable `code` (spec §24 error table) so a consumer can branch on what went
 * wrong without matching message text, which is free to change.
 */
export class SwuPgnError extends Error {
    public readonly code: string;
    public readonly line?: number;

    public constructor(code: string, message: string, line?: number) {
        super(`SWU-PGN: ${message}`);
        this.name = 'SwuPgnError';
        this.code = code;
        this.line = line;
    }
}

/**
 * Resource limits (spec §23). A reader MAY cap these and MUST reject a file that exceeds one
 * rather than read part of it. The defaults sit far above any real game (the largest vector is
 * 66 KB, its longest line under 4 KB, under 1000 records) and far below what hurts a browser.
 */
export interface ParseLimits {
    maxBytes?: number;
    maxLineLength?: number;
    maxRecords?: number;
    maxDepth?: number;
}

export const DEFAULT_LIMITS: Required<ParseLimits> = {
    maxBytes: 16 * 1024 * 1024,
    maxLineLength: 1024 * 1024,
    maxRecords: 1_000_000,
    maxDepth: 64,
};

// CLIENT-OWNED. Safety ceiling on event count, stricter than DEFAULT_LIMITS.maxRecords and
// reported with the same code. A real game is a few thousand events; this bounds the per-frame
// fold (O(n) per frame) and the snapshot array so a malformed or hostile file — replays are
// shared between users — can't freeze/OOM the tab. Upstream's cap counts every record and is
// sized for a reader that never builds per-frame snapshots; the viewer does.
const MAX_EVENTS = 200_000;

// CLIENT-OWNED. Spec §18: a reader MUST refuse a different major version and MUST accept any
// 1.x. Upstream leaves this to validate(), which the client does not ship (Node-only), so
// the gate lives at the one place every file passes through. The shape is matched, never
// compared numerically: §22.1 says a file declaring 1.1 is OLDER than 1.0, so `>=` is wrong.
// §24 has no code for it; `unsupported-version` is the client's.
const SUPPORTED_GAME_TAG = /^SWU-PGN\/1\.\d+$/;

/** One `[Tag "value"]` pair. The only escapes are `\\` and `\"` (spec §4). */
const TAG_PAIR = /\[([A-Za-z0-9]+)\s+"((?:[^"\\]|\\.)*)"\]/g;
const HEADER_LINE = /^(?:\s*\[[A-Za-z0-9]+\s+"(?:[^"\\]|\\.)*"\])+\s*$/;

function parseHeaderLine(line: string, lineNo: number, raw: Record<string, string>, order: string[]): void {
    // A line may hold several pairs, but nothing else: text outside the brackets is a broken file,
    // not something to skip, because a skipped fragment can be half of a tag.
    if (!HEADER_LINE.test(line)) {
        throw new SwuPgnError('bad-header-line', `header line ${lineNo} is not a list of [Tag "value"] pairs`, lineNo);
    }
    let m: RegExpExecArray | null;
    TAG_PAIR.lastIndex = 0;
    while ((m = TAG_PAIR.exec(line)) !== null) {
        if (!(/^(?:[^\\]|\\["\\])*$/).test(m[2])) {
            throw new SwuPgnError('bad-escape', `header tag [${m[1]}] on line ${lineNo} uses an escape other than \\\\ or \\"`, lineNo);
        }
        if (Object.prototype.hasOwnProperty.call(raw, m[1])) {
            throw new SwuPgnError('duplicate-tag', `header tag [${m[1]}] appears twice (line ${lineNo})`, lineNo);
        }
        Object.defineProperty(raw, m[1], { value: m[2].replace(/\\(.)/g, '$1'), enumerable: true, writable: true, configurable: true });
        order.push(m[1]);
    }
}

/**
 * Nesting depth of one JSON line, counted before `JSON.parse` sees it, so a line of ten thousand
 * `[` is refused cheaply instead of being handed to every recursive consumer downstream.
 */
function jsonDepth(line: string): number {
    let depth = 0;
    let max = 0;
    let inString = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inString) {
            if (ch === '\\') {
                i++;
            } else if (ch === '"') {
                inString = false;
            }
        } else if (ch === '"') {
            inString = true;
        } else if (ch === '{' || ch === '[') {
            depth++;
            if (depth > max) {
                max = depth;
            }
        } else if (ch === '}' || ch === ']') {
            depth--;
        }
    }
    return max;
}

/**
 * A header count: base-10 digits only. Anything else is corrupt, not zero, so the tag is left
 * absent -- absent and zero mean different things for `Undos` and `RecorderErrors`.
 */
function strictCount(value: string): number | undefined {
    // CLIENT-OWNED: a digit run past 2^53 is not a count either (400 nines parse to Infinity).
    return (/^\d+$/).test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : undefined;
}

function buildHeader(raw: Record<string, string>): Header {
    const req = (k: string): string => {
        if (!Object.prototype.hasOwnProperty.call(raw, k)) {
            throw new SwuPgnError('missing-tag', `missing required header tag [${k}]`);
        }
        return raw[k];
    };
    const requiredCount = (value: string, k: string): number => {
        const n = strictCount(value);
        if (n === undefined) {
            throw new SwuPgnError('bad-count', `header tag [${k}] must be base-10 digits, got "${value}"`);
        }
        return n;
    };
    const game = req('Game');
    if (!SUPPORTED_GAME_TAG.test(game)) {
        throw new SwuPgnError('unsupported-version', `unsupported format version [Game "${game}"] (this reader speaks SWU-PGN/1.x)`);
    }
    return {
        game, gameId: req('GameId'), date: req('Date'),
        format: raw['Format'], cardPool: req('CardPool'), engine: req('Engine'),
        seed: req('Seed'),
        // The 'as' casts below are intentional: structural parsing trusts the raw
        // string values here; enum/value validation is performed by validate(),
        // not the parser.
        perspective: (raw['Perspective'] as Header['perspective']) ?? null,
        p1Id: req('P1Id'), p2Id: req('P2Id'), p1: req('P1'), p2: req('P2'),
        p1Leader: req('P1Leader'), p1Base: req('P1Base'),
        p2Leader: req('P2Leader'), p2Base: req('P2Base'),
        result: req('Result') as Header['result'], reason: req('Reason'),
        rounds: requiredCount(req('Rounds'), 'Rounds'),
        ...(strictCount(raw['RecorderErrors'] ?? '') !== undefined ? { recorderErrors: strictCount(raw['RecorderErrors']) } : {}),
        ...(strictCount(raw['Undos'] ?? '') !== undefined ? { undos: strictCount(raw['Undos']) } : {}),
        ...(strictCount(raw['WriterRevision'] ?? '') !== undefined ? { writerRevision: strictCount(raw['WriterRevision']) } : {}),
        ...(raw['EndDate'] != null ? { endDate: raw['EndDate'] } : {}),
        ...(raw['Match'] != null ? { match: raw['Match'] } : {}),
        ...(strictCount(raw['GameNumber'] ?? '') !== undefined ? { gameNumber: strictCount(raw['GameNumber']) } : {}),
    };
}

type Section = 'NONE' | 'UNKNOWN' | 'STORY' | 'DECKS' | 'CARDS' | 'SETUP' | 'EVENTS' | 'ANNOTATIONS';

/** Sections whose lines are NDJSON records. `STORY` is deliberately not one of them. */
export const JSON_SECTIONS = ['DECKS', 'CARDS', 'SETUP', 'EVENTS', 'ANNOTATIONS'];

/**
 * Every `%%%` banner this version knows. Exported so `validate()` warns on exactly the set
 * `parse()` accepts -- two hand-maintained copies drift, and the warning then fires on a
 * section the reader does happily parse, or stays silent on one it drops.
 */
export const KNOWN_SECTIONS: readonly string[] = ['STORY', ...JSON_SECTIONS];

/** Drop leading/trailing blank lines a section banner's spacing leaves around the prose. */
function trimBlankEdges(lines: string[]): string[] {
    let start = 0;
    let end = lines.length;
    while (start < end && lines[start].trim() === '') {
        start++;
    }
    while (end > start && lines[end - 1].trim() === '') {
        end--;
    }
    return lines.slice(start, end);
}

/**
 * CLIENT-OWNED: what parse() read but could not use. A header count that is present but
 * unreadable is absent from `header` (strictCount), and that must not read as "none": a garbled
 * RecorderErrors would pass a partial file as complete. A skipped section (a later version's,
 * §18, or a misspelled banner) is named so it is not silently empty; one with the `X_`
 * extension prefix is not named, since §18 says to ignore it without a warning.
 *
 * `extraTags` and `extraSections` carry, verbatim, the header tags and sections this version
 * does not define, so an export with notes added drops nothing the file carried (§3 [A-01], §18).
 */
export interface ParseNotes {
    unreadableTags?: Record<string, string>;
    skippedSections?: string[];
    extraTags?: [string, string][];
    extraSections?: { banner: string; lines: string[] }[];
}
export type ParsedDocument = SwuPgnDocument & ParseNotes;

/** The §5.2 header counts strictCount reads. */
const COUNT_TAGS = ['RecorderErrors', 'Undos', 'WriterRevision', 'GameNumber'];

/** Every header tag §5 defines. Anything else is a later version's or an extension's. */
const KNOWN_TAGS = new Set([
    'Game', 'GameId', 'Date', 'CardPool', 'Engine', 'Seed', 'P1Id', 'P2Id', 'P1', 'P2',
    'P1Leader', 'P1Base', 'P2Leader', 'P2Base', 'Result', 'Reason', 'Rounds',
    'WriterRevision', 'Format', 'Perspective', 'EndDate', 'Match', 'GameNumber', 'Undos', 'RecorderErrors',
]);

export function parse(text: string, limits: ParseLimits = {}): ParsedDocument {
    const lim = { ...DEFAULT_LIMITS, ...limits };
    if (text.length > lim.maxBytes) {
        throw new SwuPgnError('too-large', `file is ${text.length} characters, over the ${lim.maxBytes} limit`);
    }
    // Writers MUST NOT emit a byte order mark; readers strip one, because editors add it.
    if (text.charCodeAt(0) === 0xFEFF) {
        text = text.slice(1);
    }
    // Prototype-less: tag names come from the file, and `constructor` is a legal one.
    const raw: Record<string, string> = Object.create(null);
    const tagOrder: string[] = [];
    const skipped = new Set<string>();
    const extraSections: { banner: string; lines: string[] }[] = [];
    const story: string[] = [];
    const decks: DeckRecord[] = [];
    const cards: CardIndexRecord[] = [];
    const setup: (SetupInitRecord | GameEvent)[] = [];
    const events: GameEvent[] = [];
    const annotations: Annotation[] = [];
    const seen = new Set<string>();
    let section: Section = 'NONE';
    let records = 0;
    let sawFirst = false;

    const lines = text.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i];
        if (rawLine.length > lim.maxLineLength) {
            throw new SwuPgnError('line-too-long', `line ${i + 1} is ${rawLine.length} characters, over the ${lim.maxLineLength} limit`, i + 1);
        }
        const line = rawLine.trim();

        // The first line is the magic number (spec §19): `[Game "SWU-PGN/…"]`. Anything else is
        // not this format, and saying so beats a confusing "missing tag" three screens later.
        if (!sawFirst) {
            if (line.length === 0) {
                continue;
            }
            sawFirst = true;
            if (!(/^\[Game\s+"SWU-PGN\//).test(line)) {
                throw new SwuPgnError('not-swupgn', 'the first line is not a [Game "SWU-PGN/…"] tag', i + 1);
            }
        }

        // %%% STORY is prose, not NDJSON: keep every line verbatim (blank lines included,
        // they are part of the layout) until the next banner.
        if (section === 'STORY' && !line.startsWith('%%%')) {
            story.push(rawLine.replace(/\r$/, ''));
            continue;
        }
        // CLIENT-OWNED: an unknown section is skipped unread (§18), but its lines are kept
        // verbatim, blank ones included, so serialize() can write them back out.
        if (section === 'UNKNOWN' && !line.startsWith('%%%')) {
            extraSections[extraSections.length - 1].lines.push(rawLine.replace(/\r$/, ''));
            continue;
        }
        if (line.length === 0) {
            continue;
        }
        // Header lines only exist before the first banner (spec §4). Inside a JSON section a
        // `[`-prefixed line is a record (a JSON array), and must reach the JSON path below so
        // that validate() can reject it, rather than vanish as a mis-parsed header.
        if (section === 'NONE' && line.startsWith('[')) {
            parseHeaderLine(line, i + 1, raw, tagOrder);
            continue;
        }
        if (line.startsWith('%%%')) {
            const name = line.slice(3).trim()
                .toUpperCase();
            // A section appears once. Two `%%% EVENTS` banners would be two streams in one
            // file, and nothing says which order to fold them in.
            if (seen.has(name)) {
                throw new SwuPgnError('duplicate-section', `section %%% ${name} appears twice (line ${i + 1})`, i + 1);
            }
            seen.add(name);
            section = (name === 'STORY' || JSON_SECTIONS.includes(name) ? name : 'UNKNOWN') as Section;
            if (section === 'UNKNOWN') {
                extraSections.push({ banner: line, lines: [] });
                if (!name.startsWith('X_') && skipped.size < 20) {
                    skipped.add(name.slice(0, 40));
                }
            }
            continue;
        }
        if (section === 'NONE') {
            throw new SwuPgnError('record-outside-section', `record before any %%% section on line ${i + 1}`, i + 1);
        }
        if (++records > lim.maxRecords) {
            throw new SwuPgnError('too-many-records', `more than ${lim.maxRecords} records`, i + 1);
        }
        if (jsonDepth(line) > lim.maxDepth) {
            throw new SwuPgnError('too-deep', `line ${i + 1} nests JSON deeper than ${lim.maxDepth}`, i + 1);
        }
        let rec: unknown;
        try {
            rec = JSON.parse(line);
        } catch {
            throw new SwuPgnError('bad-json', `invalid JSON on line ${i + 1}`, i + 1);
        }
        // CLIENT-OWNED. Every record is an object (§4). A bare `null`, number or array is
        // valid JSON, and it used to reach `events[i].seq` in the viewer, crash the page,
        // and be persisted first, so the `?id=` link crash-looped on every reload. Upstream
        // leaves this to validate(), where it is the §24 error `not-object`.
        if (rec == null || typeof rec !== 'object' || Array.isArray(rec)) {
            throw new SwuPgnError('not-object', `record on line ${i + 1} is not a JSON object`, i + 1);
        }
        switch (section) {
            case 'DECKS': decks.push(rec as DeckRecord); break;
            case 'CARDS': cards.push(rec as CardIndexRecord); break;
            case 'SETUP': setup.push(rec as SetupInitRecord | GameEvent); break;
            case 'EVENTS':
                if (events.length >= MAX_EVENTS) {
                    throw new SwuPgnError('too-many-records', `more than ${MAX_EVENTS} events`, i + 1);
                }
                events.push(rec as GameEvent);
                break;
            case 'ANNOTATIONS': annotations.push(rec as Annotation); break;
            default: break;
        }
    }
    if (!sawFirst) {
        throw new SwuPgnError('not-swupgn', 'the file is empty');
    }

    const unreadable = Object.fromEntries(COUNT_TAGS
        .filter((tag) => raw[tag] != null && strictCount(raw[tag]) === undefined)
        .map((tag) => [tag, raw[tag]]));
    const extraTags = tagOrder.filter((tag) => !KNOWN_TAGS.has(tag)).map((tag): [string, string] => [tag, raw[tag]]);
    for (const s of extraSections) {
        s.lines = trimBlankEdges(s.lines);
    }
    return {
        header: buildHeader(raw), story: trimBlankEdges(story), decks, cards, setup, events, annotations,
        ...(Object.keys(unreadable).length ? { unreadableTags: unreadable } : {}),
        ...(skipped.size ? { skippedSections: [...skipped] } : {}),
        ...(extraTags.length ? { extraTags } : {}),
        ...(extraSections.length ? { extraSections } : {}),
    };
}
