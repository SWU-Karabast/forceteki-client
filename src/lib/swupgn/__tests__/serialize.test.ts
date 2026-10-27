import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse } from '../parse';
import { serialize } from '../serialize';
import { render } from '../render';
import type { Annotation } from '../types';

const SAMPLE = readFileSync(
    path.join(__dirname, 'fixtures/sample-game.swupgn'),
    'utf-8',
);

describe('serialize ↔ parse round-trip', () => {
    it('re-parses to an equivalent document', () => {
        const doc = parse(SAMPLE);
        const reparsed = parse(serialize(doc));
        expect(reparsed.header).toEqual(doc.header);
        expect(reparsed.decks).toEqual(doc.decks);
        expect(reparsed.events).toEqual(doc.events);
        expect(reparsed.setup).toEqual(doc.setup);
    });

    it('renders a STORY and emits CARDS in spec order when the source had neither', () => {
        const doc = parse(SAMPLE);
        const text = serialize({ ...doc, story: undefined, cards: undefined });
        const idx = (s: string) => text.indexOf(`%%% ${s}`);
        expect(idx('STORY')).toBeGreaterThan(-1);
        expect(idx('STORY')).toBeLessThan(idx('DECKS'));
        expect(idx('DECKS')).toBeLessThan(idx('CARDS'));
        expect(idx('CARDS')).toBeLessThan(idx('SETUP'));
        expect(idx('SETUP')).toBeLessThan(idx('EVENTS'));
        expect(parse(text).story!.join('\n')).toBe(render(doc).replace(/^\n+|\n+$/g, ''));
    });

    it('emits an existing story verbatim instead of re-rendering it', () => {
        const doc = { ...parse(SAMPLE), story: ['hand-written line'] };
        expect(parse(serialize(doc)).story).toEqual(['hand-written line']);
    });

    it('round-trips appended annotations (needed for sharing)', () => {
        const doc = parse(SAMPLE);
        const note: Annotation = { ref: doc.events[5].seq, nag: '?', text: 'misplay', by: 'Coach' };
        const withNote = { ...doc, annotations: [...doc.annotations, note] };
        const reparsed = parse(serialize(withNote));
        expect(reparsed.annotations).toContainEqual(note);
    });
});

describe('file-controlled strings cannot open a section in an export', () => {
    // Value: protects=an exported STORY never carries a line of its own from an event field; fails_when=serialize lets a story line start with %%%; why_new=render interpolates UNDO.at and raw ids verbatim; seam=none; no_claim=render's own output
    it('neutralizes a %%% line smuggled through UNDO.at', () => {
        const doc = parse(SAMPLE);
        const events = [...doc.events, { seq: 'R9.A.1-undo', t: 'UNDO', at: 'X\n%%% ANNOTATIONS\n{"seq":"R1","text":"INJ"}\n  %%% ZZZ', by: 1 }] as typeof doc.events;
        const out = serialize({ ...doc, story: [], events });
        // parse() trims before it looks for a banner, so compare the way it reads.
        const banners = (text: string) => text.split('\n').filter((l) => l.trim().startsWith('%%%'));
        expect(banners(out)).toEqual(banners(serialize({ ...doc, story: [] })));
        const re = parse(out);
        expect(re.events).toHaveLength(events.length);
        expect(re.annotations).toEqual(doc.annotations);
        expect(re.skippedSections).toBeUndefined();
    });

    // Value: protects=a keyframe card with a non-array upgrades list cannot crash the Story tab; fails_when=render lays out the raw keyframe again; why_new=fold tests only cover the fold's own snap; seam=none; no_claim=board rendering
    it('renders a story when a keyframe card is half-shaped', () => {
        const doc = parse(SAMPLE);
        const i = doc.events.findIndex((e) => e.t === 'ROUND_START' && !!e.keyframe);
        const kf = JSON.parse(JSON.stringify((doc.events[i] as { keyframe: unknown }).keyframe));
        kf.players[1].cards = [{ id: 'X', zone: 'ground', upgrades: 5 }];
        const events = doc.events.map((e, j) => (j === i ? { ...e, keyframe: kf } : e)) as typeof doc.events;
        expect(() => render({ ...doc, story: [], events })).not.toThrow();
    });
});

describe('render names a two-sided leader by the side that is up', () => {
    // Value: protects=a Leader Unit going home is named by its front again in the story; fails_when=render's MOVE arena->base side reset is dropped; why_new=the death-star vector never brings the leader home; seam=none; no_claim=keyframe-driven side snaps
    it('reads the back while deployed and the front after it goes home', () => {
        const doc = parse(SAMPLE);
        const cards = [...(doc.cards ?? []), { id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' }];
        const events = [...doc.events,
            { seq: 'R9.A.1', t: 'DEPLOY_LEADER', p: 1, card: 'HMW#004', zone: 'space' },
            { seq: 'R9.A.2', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
            { seq: 'R9.A.2a', t: 'MOVE', card: 'HMW#004', from: 'space', to: 'base', p: 1, kind: 'unit' },
            { seq: 'R9.A.3', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
        ] as typeof doc.events;
        const lines = render({ ...doc, cards, story: [], events }).split('\n').filter((l) => l.includes('base with'));
        expect(lines.slice(-2).map((l) => l.replace(/^.*with /, ''))).toEqual(['The Death Star, Icon of Tyranny', 'Grand Moff Tarkin, Tyrant of the Outer Rim']);
    });
});

describe('render names a double-sided leader by its face', () => {
    // Value: protects=LEADER_FLIP turns the story's name to the back and back again; fails_when=render's LEADER_FLIP side tracking is dropped; why_new=no vector has a LEADER_FLIP; seam=none; no_claim=mirror matches (render still keys on baseId, upstream)
    it('reads Sidious after a flip to the back and Palpatine after a flip home', () => {
        const doc = parse(SAMPLE);
        const cards = [...(doc.cards ?? []), { id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious, Sith Lord' }];
        const events = [...doc.events,
            { seq: 'R9.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
            { seq: 'R9.A.2', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
            { seq: 'R9.A.3', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: true },
            { seq: 'R9.A.4', t: 'ABILITY_ACTIVATE', p: 1, card: 'TWI#017', kind: 'action' },
        ] as typeof doc.events;
        const uses = render({ ...doc, cards, story: [], events }).split('\n').filter((l) => / uses /.test(l));
        expect(uses.slice(-2).map((l) => l.replace(/^.* uses /, ''))).toEqual(['Darth Sidious, Sith Lord', 'Chancellor Palpatine, Playing Both Sides']);
    });
});

describe('render: the audit gaps around sides, undo marks and base holdings', () => {
    const TARKIN = { id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' };
    const PALPATINE = { id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious, Sith Lord' };
    const docWith = (extra: unknown[], cards: { id: string; name: string; backSideName?: string }[] = []) => {
        const doc = parse(SAMPLE);
        return { ...doc, cards: [...(doc.cards ?? []), ...cards], story: [], events: [...doc.events, ...extra] as typeof doc.events };
    };
    // A copy of the sample's last complete keyframe, with `edit` applied to seat 1.
    const keyframeWith = (round: number, edit: (p1: Record<string, unknown>) => void) => {
        const doc = parse(SAMPLE);
        const last = [...doc.events].reverse().find((e) => e.t === 'ROUND_START' && !!(e as { keyframe?: unknown }).keyframe) as unknown as { keyframe: unknown };
        const kf = JSON.parse(JSON.stringify(last.keyframe));
        kf.round = round;
        edit(kf.players[1]);
        return { seq: `R${round}.start`, t: 'ROUND_START', round, keyframe: kf };
    };
    const after = (text: string, marker: string) => text.split('\n').filter((l) => l.includes(marker)).map((l) => l.slice(l.indexOf(marker) + marker.length));

    // Value: protects=a story flip line names the face it left and the face it landed on, both ways; fails_when=render drops or swaps the " to <face>" suffix of LEADER_FLIP; why_new=existing render flip tests read only "uses" lines or "flips" prefix; seam=none; no_claim=mirror copies
    it('words each flip as "flips <left> to <landed>"', () => {
        const text = render(docWith([
            { seq: 'R9.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false },
            { seq: 'R9.A.2', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: true },
        ], [PALPATINE]));
        expect(after(text, 'Player 1 flips ')).toEqual([
            'Chancellor Palpatine, Playing Both Sides to Darth Sidious, Sith Lord',
            'Darth Sidious, Sith Lord to Chancellor Palpatine, Playing Both Sides',
        ]);
    });

    // Value: protects=an UNDO is an unnumbered margin mark naming who undid, or "A player"; fails_when=UNDO goes back through line()/numbering or interpolates an absent `by`; why_new=no golden vector or render test has an UNDO; seam=none; no_claim=the replay caption
    it('marks an undo in the margin without numbering it', () => {
        const plain = render(docWith([]));
        const text = render(docWith([
            { seq: 'R3.A.90-undo', t: 'UNDO', at: 'R3.A.4', by: 2 },
            { seq: 'R3.A.91-undo', t: 'UNDO', at: 'R3.A.5' },
        ]));
        const numbered = (t: string) => t.split('\n').filter((l) => /^\s*\d+\.\s/.test(l));
        expect(numbered(text)).toEqual(numbered(plain));
        expect(text.split('\n').slice(-2)).toEqual([
            '    ·· Player 2 undid back to R3.A.4 ··',
            '    ·· A player undid back to R3.A.5 ··',
        ]);
    });

    // Value: protects=a keyframe stating a deployed (or home) leader sets the side the story names; fails_when=render's ROUND_START keyframe side snap is dropped; why_new=vectors deploy by record, so the snap is never the only source; seam=none; no_claim=board layout of the leader
    it('names a leader by the side its keyframe states', () => {
        const leader = (deployed: boolean) => (p1: Record<string, unknown>) => {
            p1.leader = { id: 'HMW#004', deployed, exhausted: false, epicActionUsed: deployed };
        };
        const text = render(docWith([
            keyframeWith(9, leader(true)),
            { seq: 'R9.A.1', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
            keyframeWith(10, leader(false)),
            { seq: 'R10.A.1', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
        ], [TARKIN]));
        expect(after(text, 'base with ').slice(-2)).toEqual(['The Death Star, Icon of Tyranny', 'Grand Moff Tarkin, Tyrant of the Outer Rim']);
    });

    // Value: protects=a leader leaving the base zone for an arena with no DEPLOY_LEADER reads by its back in the story; fails_when=render's MOVE base->arena side branch is dropped; why_new=sidedResolver's twin test covers the UI resolver, not render; seam=none; no_claim=pilot attachment
    it('names a leader moved out to an arena by its back', () => {
        const text = render(docWith([
            { seq: 'R9.A.1', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
            { seq: 'R9.A.2', t: 'MOVE', card: 'HMW#004', from: 'base', to: 'space', p: 1, kind: 'unit' },
            { seq: 'R9.A.3', t: 'ATTACK', p: 1, atk: 'HMW#004', def: 'base@2', defenderType: 'base' },
        ], [TARKIN]));
        expect(after(text, 'base with ').slice(-2)).toEqual(['Grand Moff Tarkin, Tyrant of the Outer Rim', 'The Death Star, Icon of Tyranny']);
    });

    // Value: protects=a round banner lists the base's Fortify upgrades then its captives as "holds X"; fails_when=boardSummary drops baseCaptured or the "holds" wording; why_new=no golden render shows a base captive; seam=none; no_claim=unit captives
    it('lays out a base\'s upgrades and captives on the round banner', () => {
        const text = render(docWith([
            keyframeWith(9, (p1) => {
                p1.baseUpgrades = ['HMW#147'];
                p1.baseCaptured = ['SOR#095'];
            }),
        ], [{ id: 'HMW#147', name: 'Beast Lair' }, { id: 'SOR#095', name: 'Captive Unit' }]));
        expect(text.split('\n')).toContain('      base: Beast Lair  ·  holds Captive Unit');
    });
});
