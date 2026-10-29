import { describe, it, expect } from 'vitest';
import { flatten, indexResolver, render, shorten, type NameResolver, type SwuPgnDocument } from '../index';

// Ported from forceteki test/server/swupgn/render.spec.ts "render card sides" at 950a65a82.
describe('render card sides in a mirror match (§16)', () => {
    const cards = [{ id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious' }];
    const doc = (events: unknown[]) => ({ header: {}, decks: [], setup: [], events, annotations: [], cards }) as unknown as SwuPgnDocument;
    const p = (seat: 1 | 2, leader: Record<string, unknown>) => ({ seat, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [],
        resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], leader });
    const linesOf = (out: string) => out.split('\n').map((l) => l.trim());

    // Value: protects=in a mirror match each copy of a leader is named by its own side (§16); fails_when=sides are tracked by printed id again, so one flip renames both; why_new=every side test used two different leaders; seam=none; no_claim=none beyond protects
    it('tracks each copy of a leader separately', () => {
        const out = linesOf(render(doc([
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R1.A.1a', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R2.start', t: 'ROUND_START', round: 2, keyframe: { round: 2, phase: 'action', initiative: 1, players: {
                1: p(1, { id: 'TWI#017', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: true }),
                2: p(2, { id: 'TWI#017:2', deployed: false, exhausted: false, epicActionUsed: false, onStartingSide: false }),
            } } },
            { seq: 'R2.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R2.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
        ])));
        expect(out).toContain('2. Player 2 uses Chancellor Palpatine, Playing Both Sides #2');
        expect(out).toContain('3. Player 1 uses Darth Sidious');
        expect(out).toContain('1. Player 1 uses Chancellor Palpatine, Playing Both Sides');
        expect(out).toContain('2. Player 2 uses Darth Sidious #2');
    });

    // Value: protects=render() asks a resolver by base id, so one that does not strip `:N` still names a copy; fails_when=a NameResolver call passes the copy id again; why_new=every resolver in the client strips `:N` itself; seam=none; no_claim=none beyond protects
    it('asks a caller\'s resolver by base id, so one keyed by printed id still names a copy', () => {
        const byId: Record<string, string> = { 'TWI#017': 'Chancellor Palpatine' };
        const plain = linesOf(render(doc([
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.1a', t: 'LEADER_FLIP', p: 2, card: 'TWI#017:2', onStartingSide: false },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 2, card: 'TWI#017:2', kind: 'action' },
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
        ]), { nameOf: (id) => byId[id] ?? id, backNameOf: (id) => (id === 'TWI#017' ? 'Darth Sidious' : undefined) }));
        expect(plain).toContain('2. Player 2 uses Darth Sidious #2');
        expect(plain).toContain('3. Player 1 uses Chancellor Palpatine');
    });
});

// Ported from forceteki test/server/swupgn/render.spec.ts at c17ef7499 (the 6147b3c58..c17ef7499 review hardening).
const plainDoc = (events: unknown[], cards: unknown[] = []) => ({ header: {}, decks: [], setup: [], events, annotations: [], cards }) as unknown as SwuPgnDocument;
const seatOf = (s: 1 | 2, cards: unknown[] = []) => ({ seat: s, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
    resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards });

describe('render cuts and flattens what a file names (§16 nm, R-04)', () => {
    const nm: NameResolver = { nameOf: (id: string) => ({ 'SOR#142': 'Bold Resistance', 'SOR#108': 'Wampa', 'SOR#095': 'Battlefield Marine', 'SOR#200': 'Clone' } as Record<string, string>)[id] ?? id };

    // Value: protects=one record is one story line (§16 strict layout, R-04); fails_when=a line break in text, untilText or a name reaches the story; why_new=c17ef7499; seam=none; no_claim=none
    it('keeps an effect\'s text, untilText and a named card on one line', () => {
        const out = render(plainDoc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, targets: ['SOR#108'], duration: 'until',
                text: '+1/+0\nnext', untilText: 'it\r\nattacks' },
            { seq: 'R1.A.1b', t: 'NAME', p: 1, name: 'Wampa\u2028Battlefield Marine' },
        ]), nm);
        expect(out.split('\n')).toEqual([
            '       ↳ Player 1: Bold Resistance — +1/+0 next on Wampa (until it  attacks)',
            '       ↳ Player 1 names Wampa Battlefield Marine',
        ]);
    });

    // Value: protects=an id the cards index does not list is cut like a card name on an effect's start and end; fails_when=the raw id is printed in full; why_new=c17ef7499; seam=none; no_claim=none
    it('cuts an unlisted id like a card name, on the start and the end of an effect', () => {
        const src = `X#${'9'.repeat(200)}`;
        const out = render(plainDoc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src, p: 1, seat: 1, duration: 'game' },
            { seq: 'R1.A.1b', t: 'EFFECT_END', id: 'fx@1', reason: 'expired' },
            { seq: 'R1.A.1c', t: 'EFFECT_START', id: 'fx@2', src: `SOR#108:${'2'.repeat(200)}`, p: 1, seat: 1, duration: 'game' },
            { seq: 'R1.A.1d', t: 'EFFECT_END', id: 'fx@2', reason: 'expired' },
        ]), nm);
        const cut = `X#${'9'.repeat(117)}…`;
        const copy = `Wampa #${'2'.repeat(117)}…`;
        expect(out.split('\n')).toEqual([
            `       ↳ Player 1: ${cut} for Player 1 (for the rest of the game)`,
            `       ↳ Effect from ${cut} ends (expired)`,
            `       ↳ Player 1: ${copy} for Player 1 (for the rest of the game)`,
            `       ↳ Effect from ${copy} ends (expired)`,
        ]);
    });

    // Value: protects=a copy's #N on the board is cut like a card name; fails_when=the board appends the raw suffix; why_new=c17ef7499; seam=client keyframe snap (render lays out snapToKeyframe's board); no_claim=none
    it('cuts a copied unit\'s #N on the board', () => {
        const clone = { id: `SOR#200:${'2'.repeat(200)}`, zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [],
            power: 4, hp: 5, traits: [], copyOf: 'SOR#108', name: 'Wampa', cost: 4, aspects: [] };
        const out = render(plainDoc([
            { seq: 'R2.start', t: 'ROUND_START', round: 2, active: 1, keyframe: { round: 2, phase: 'action', initiative: 1, players: { 1: seatOf(1, [clone]), 2: seatOf(2) } } },
        ]), nm).split('\n');
        expect(out).toContain(`      ground: Wampa #${'2'.repeat(117)}… 4/5`);
    });

    // Value: protects=a line break in any printed field never starts a new story line; fails_when=a field other than names and effect text is printed raw; why_new=c17ef7499; seam=none; no_claim=none
    it('turns line breaks in any printed field into spaces', () => {
        const out = render(plainDoc([
            { seq: 'R1.A.1', t: 'PASS', p: 1 },
            { seq: 'R1.A.1a', t: 'EFFECT_END', id: 'fx@9\nFAKE', reason: 'gone\nFAKE' },
            { seq: 'R1.A.1b', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#108', p: 1, seat: 1, duration: 'later\nFAKE' },
            { seq: 'R1.A.2', t: 'GAME_END', winner: 1, reason: 'basesDestroyed\r\nFAKE' },
        ]));
        expect(out.split('\n').filter((l) => l.trimStart().startsWith('FAKE'))).toEqual([]);
        expect(out).toContain('Effect fx@9 FAKE ends (gone FAKE)');
        expect(out).toContain('(later FAKE)');
    });

    // Value: protects=control and bidirectional characters never reach a story line; fails_when=flatten's class is narrowed to line breaks; why_new=c17ef7499; seam=none; no_claim=characters outside the listed set
    it('turns control and bidirectional characters into spaces', () => {
        const between = [0x0000, 0x0085, 0x202e, 0x2066, 0x200f, 0x061c, 0x2029, 0x007f];
        const out = render(plainDoc([
            { seq: 'R1.A.1', t: 'GAME_END', winner: 1, reason: 'abcdefghi'.split('').map((c, k) => (k > 0 ? String.fromCharCode(between[k - 1]) : '') + c).join('') },
        ]));
        expect(out).toContain('a b c d e f g h i');
    });

    // Value: protects=a resolver's long leader names are cut on deploy and flip lines; fails_when=DEPLOY_LEADER or LEADER_FLIP prints frontNameOf/backNameOf raw; why_new=c17ef7499; seam=none; no_claim=none
    it('cuts a resolver\'s long leader side names on deploy and flip lines', () => {
        const names = { nameOf: () => 'f'.repeat(200), backNameOf: () => 'b'.repeat(200) };
        const out = render(plainDoc([
            { seq: 'R1.A.1', t: 'DEPLOY_LEADER', p: 1, card: 'SOR#010' },
            { seq: 'R1.A.1a', t: 'LEADER_FLIP', p: 2, card: 'TWI#017', onStartingSide: false },
        ]), names).split('\n');
        const cut = (c: string) => `${c.repeat(119)}…`;
        expect(out[0]).toBe(`  1. Player 1 deploys ${cut('f')} as ${cut('b')}`);
        expect(out[1].length).toBeLessThan(300);
        expect(out[1]).toContain(` to ${cut('b')}`);
    });

    // Value: protects=a story line is never a non-record line's (§16); fails_when=render dereferences null/scalars/arrays; why_new=c17ef7499; seam=none; no_claim=none
    it('skips an events line that is not a record', () => {
        const clean = render(plainDoc([{ seq: 'R1.A.1', t: 'PASS', p: 1 }]));
        expect(render(plainDoc([null, 5, 'x', [{ seq: 'R1.A.0', t: 'PASS', p: 2 }], { seq: 'R1.A.1', t: 'PASS', p: 1 }]))).toBe(clean);
    });
});

describe('render size (§16)', () => {
    // Value: protects=the story stops at 16 MiB however a file's names expand its ids; fails_when=render writes every record whatever its total size; why_new=c17ef7499; seam=none; no_claim=the 16 MiB file cap, which parse enforces
    it('stops the story at 16 MiB with a closing line', () => {
        const ids = Array.from({ length: 1000 }, (_, i) => `A#${i}`);
        const cards = ids.map((id) => ({ id, name: 'n'.repeat(120) }));
        const events = Array.from({ length: 150 }, (_, i) => ({ seq: `R1.A.${i + 1}`, t: 'DISCARD', p: 1, cards: ids }));
        const out = render(plainDoc(events, cards));
        const lines = out.split('\n');
        expect(out.length).toBeLessThan(16 * 1024 * 1024 + 200000);
        expect(lines[lines.length - 1]).toBe('… the story stops here: it is longer than 16777216 characters');
        expect(lines.length).toBeLessThan(150);
    });
});

describe('cardNames: flatten, and shorten on a name the client already cut (item 6)', () => {
    const hostile = [
        'Wampa\nHungry Beast', 'a\r\nb', 'x\u2028y\u2029z', '\u202Ereverse\u202C me', 'tab\there', '\u0000nul\u0085nel\u061Calm',
        'n'.repeat(5000), `\u202E${'m'.repeat(119)}\n${'k'.repeat(10)}`, '', 'Plain, Name',
    ];

    // Value: protects=flatten turns each C0/C1 control, U+2028/9 and bidi control into a space, nothing else; fails_when=the class is narrowed or widened; why_new=c17ef7499 flatten; seam=none; no_claim=none
    it('flattens controls, separators and bidi controls to spaces and keeps everything else', () => {
        expect(flatten('a\nb\rc\u2028d\u2029e\u202Ef\u2066g\u200Eh\u0085i\u0000j\tk')).toBe('a b c d e f g h i j k');
        expect(flatten('Darth Vader, Dark Lord of the Sith — ünïcödé ✦')).toBe('Darth Vader, Dark Lord of the Sith — ünïcödé ✦');
    });

    // Value: protects=the client's names are unchanged by render's new shorten() on them: indexResolver's flatten → displayText → cut already leaves nothing to flatten or cut; fails_when=render re-cuts or respaces a client name; why_new=shorten now flattens; seam=client indexResolver; no_claim=a caller's own resolver
    it('changes nothing when shorten runs again on an indexResolver name', () => {
        const r = indexResolver(hostile.map((name, i) => ({ id: `T#${i}`, name, backSideName: name })));
        hostile.forEach((_, i) => {
            const shown = r.nameOf(`T#${i}`);
            expect(shorten(shown), JSON.stringify(shown)).toBe(shown);
            expect(shown.length).toBeLessThanOrEqual(120);
            expect(shown).not.toMatch(/[\n\r\u2028\u2029\u202A-\u202E\u2066-\u2069]/);
            expect(shorten(r.backNameOf!(`T#${i}`)!)).toBe(r.backNameOf!(`T#${i}`));
        });
        // Bidi marks are still DROPPED by the client (displayText), not spaced as upstream's shorten does.
        expect(r.nameOf('T#3')).toBe('reverse me');
        expect(shorten('\u202Ereverse\u202C me')).toBe(' reverse  me');
    });
});
