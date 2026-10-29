import { type ActiveEffect, type GameEvent, type ReducedState, type Seat, asIdList, displayText, plainText, shorten } from '@/lib/swupgn';
import type { IOngoingEffectSummary } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { parseSetId } from './swupgnBoardAdapter';

// The story's words for an effect (spec §16), for the caption and the Effects list. render.ts
// keeps its own copies private (it is vendored verbatim), so these mirror its `durationWords`
// and `endWords` word for word; effectWords.test.ts holds every EFFECT_START/EFFECT_END caption
// of the vectors to the line render() prints.

// ` · `, as render() lists cards: a card's name has its own comma between title and subtitle.
const who = (p?: unknown): string => (p === 1 ? 'Player 1' : p === 2 ? 'Player 2' : '');

/** Each `EffectDuration` as the words that close an `EFFECT_START` line (render.ts `durationWords`). */
export function durationWords(duration: unknown, src: string, untilText: unknown, nm: (id: string) => string): string {
    switch (duration) {
        case 'attack': return 'for this attack';
        case 'phase': return 'for this phase';
        case 'round': return 'for this round';
        case 'whileSourceInPlay': return `while ${nm(src)} is in play`;
        // The file's text, cut like a card name, so it cannot grow the story (spec §16).
        case 'until': return `until ${typeof untilText === 'string' ? shorten(untilText) : 'a condition is met'}`;
        case 'delayed': return 'delayed';
        case 'game': return 'for the rest of the game';
        // A newer minor's duration (§18): the file's own word, neutralised and cut (§23, §16).
        default: return shorten(displayText(String(duration)));
    }
}

/** Each `EffectEndReason` as the words that close an `EFFECT_END` line (render.ts `endWords`). */
export function endWords(reason: unknown): string {
    switch (reason) {
        case 'expired': return 'expired';
        case 'fired': return 'it resolved';
        case 'sourceLeft': return 'its source left play';
        case 'targetLeft': return 'its target changed zone';
        case 'cancelled': return 'cancelled';
        default: return shorten(displayText(String(reason)));
    }
}

/** What an effect applies to: its targets, or the seat a player-wide effect is for. */
export function effectScope(fx: { targets?: unknown; seat?: unknown }, nm: (id: string) => string): string {
    const targets = asIdList(fx.targets);
    if (targets.length) return ` on ${targets.map(nm).join(' · ')}`;
    if (fx.seat === 1 || fx.seat === 2) return ` for ${who(fx.seat)}`;
    return fx.seat === 'both' ? ' for both players' : '';
}

/** An EFFECT_START as render() prints it: "Player 1: Grand Inquisitor — … on Wampa (for this phase)". */
export function effectStartLine(e: Extract<GameEvent, { t: 'EFFECT_START' }>, nm: (id: string) => string): string {
    const what = e.text ? ` — ${shorten(plainText(String(e.text)))}` : '';
    return `${who(e.p)}: ${nm(e.src)}${what}${effectScope(e, nm)} (${durationWords(e.duration, e.src, e.untilText, nm)})`;
}

/** An EFFECT_END as render() prints it, named by its source when `srcOf` knows the id. */
export function effectEndLine(e: Extract<GameEvent, { t: 'EFFECT_END' }>, nm: (id: string) => string, srcOf?: (id: string) => string | undefined): string {
    const src = srcOf?.(e.id);
    const which = src !== undefined ? `Effect from ${nm(src)}` : `Effect ${e.id}`;
    const targets = asIdList(e.targets);
    return `${which} ends${targets.length ? ` on ${targets.map(nm).join(' · ')}` : ''} (${endWords(e.reason)})`;
}

/** One row of the Effects list for an active effect: its source, what it applies to, how long. */
export function activeEffectLine(fx: ActiveEffect, nm: (id: string) => string): string {
    return `${nm(fx.src)}${effectScope(fx, nm)} (${durationWords(fx.duration, fx.src, undefined, nm)})`;
}

/** Effect id -> source card, over the whole stream: an EFFECT_END carries only the id. */
export function effectSources(events: readonly GameEvent[]): Map<string, string> {
    const out = new Map<string, string>();
    for (const e of events) {
        if (e?.t === 'EFFECT_START' && typeof e.id === 'string' && typeof e.src === 'string') out.set(e.id, e.src);
    }
    return out;
}

/**
 * The frame's active effects, one line each, or `null` when the frame does not record effects
 * at all. Absent `effects` is "not recorded" (spec §11): a file from before writer revision 6
 * has none, and the viewer must not read that as "no active effects".
 */
export function activeEffectRows(s: ReducedState | undefined, nm: (id: string) => string): { id: string; text: string }[] | null {
    if (!Array.isArray(s?.effects)) return null;
    return s.effects.map((fx) => ({ id: fx.id, text: activeEffectLine(fx, nm) }));
}

/** Card id -> the lines of the active effects that target it, for the mark on the board. */
export function effectNotesByCard(s: ReducedState | undefined, nm: (id: string) => string): Map<string, string[]> {
    const out = new Map<string, string[]>();
    for (const fx of Array.isArray(s?.effects) ? s.effects : []) {
        const line = activeEffectLine(fx, nm);
        for (const id of asIdList(fx.targets)) out.set(id, [...(out.get(id) ?? []), line]);
    }
    return out;
}

const PER_WORDS: Record<string, string> = { phase: 'this phase', round: 'this round', game: 'this game' };

/**
 * The limited abilities that are spent (`count` has reached `max`, spec §11 `abilityUses`), or
 * `null` when neither seat records ability uses (a file from before writer revision 6).
 */
export function spentAbilityRows(s: ReducedState | undefined, nm: (id: string) => string): { key: string; seat: Seat; text: string }[] | null {
    const seats = ([1, 2] as Seat[]).filter((seat) => Array.isArray(s?.players?.[seat]?.abilityUses));
    if (!seats.length) return null;
    return seats.flatMap((seat) => (s!.players[seat]!.abilityUses ?? [])
        .filter((u) => u.max > 0 && u.count >= u.max)
        .map((u) => ({
            key: `${seat}:${u.card}:${u.ability}`,
            seat,
            text: `${nm(u.card)}: ability used ${u.count} of ${u.max} ${Object.hasOwn(PER_WORDS, u.per) ? `for ${PER_WORDS[u.per]}` : ''}`.trim(),
        })));
}

/** Effect id -> the `text` its EFFECT_START gave (what it does, with the file's icon markup). */
export function effectTexts(events: readonly GameEvent[]): Map<string, string> {
    const out = new Map<string, string>();
    for (const e of events) {
        if (e?.t === 'EFFECT_START' && typeof e.id === 'string' && typeof e.text === 'string') out.set(e.id, e.text);
    }
    return out;
}

/**
 * The frame's active effects in the live board's own shape, for the trays' ongoing-effects panel
 * (one thumbnail per source card, its targets highlighted on hover). `null` when the frame does
 * not record effects (a file before writer revision 6): the panel then says nothing, where an
 * empty list would claim "No active effects" (spec §11, absent is "not recorded").
 *
 * The description is the EFFECT_START's `text`, made safe and cut like a card name (§16, §23);
 * its icon markup (`{keyword:raid:2}`) goes to the panel's RichText, which turns it into React
 * nodes, never into HTML. A `base@N` source is drawn as that seat's base card.
 */
export function ongoingEffectSummaries(
    s: ReducedState | undefined,
    texts: ReadonlyMap<string, string>,
    seatId: Record<Seat, string>,
    nameOf: (id: string) => string,
    baseCardOf: (seat: Seat) => string,
): IOngoingEffectSummary[] | null {
    if (!Array.isArray(s?.effects)) return null;
    return s.effects.filter((fx) => typeof fx.src === 'string').map((fx) => {
        const base = /^base@([12])$/.exec(fx.src);
        const card = base ? baseCardOf(Number(base[1]) as Seat) : fx.src;
        const [title, ...rest] = displayText(nameOf(card)).split(', ');
        const text = texts.get(fx.id);
        return {
            sourceCardUuid: fx.src,
            source: {
                setId: parseSetId(card),
                ...(base ? { type: 'base' } : {}),
                controllerId: seatId[fx.p === 2 ? 2 : 1],
                sourceTitle: title,
                ...(rest.length ? { sourceSubtitle: rest.join(', ') } : {}),
                ...(text ? { effectDescription: shorten(displayText(text.replace(/[\r\n]+/g, ' '))) } : {}),
            },
            targets: asIdList(fx.targets).filter((t) => !/^base@/.test(t)),
        };
    });
}
