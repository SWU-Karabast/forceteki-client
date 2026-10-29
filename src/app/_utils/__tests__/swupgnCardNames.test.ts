import { describe, it, expect } from 'vitest';
import { makeNameResolver, sidedResolver, nameAtSeq } from '../swupgnCardNames';
import { indexResolver, emptyState, foldFrames, type GameEvent, type ReducedState } from '@/lib/swupgn';

describe('makeNameResolver', () => {
    it('resolves a known id to its name', () => {
        const r = makeNameResolver({ 'SOR#010': 'Darth Vader' });
        expect(r.nameOf('SOR#010')).toBe('Darth Vader');
    });

    it('strips the :copy suffix before lookup', () => {
        const r = makeNameResolver({ 'SHD#257': 'Battlefield Marine' });
        expect(r.nameOf('SHD#257:3')).toBe('Battlefield Marine');
    });

    it('falls back to the raw id when unknown', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('LOF#164')).toBe('LOF#164');
    });

    it('handles TOKEN: refs by showing the token label', () => {
        const r = makeNameResolver({});
        expect(r.nameOf('TOKEN:Experience')).toBe('Experience');
    });
});

describe('token display names never leak the id shape', () => {
    // A token id carries its shape in the string: `TOKEN:Advantage:2` (pre-1.0 copy suffix)
    // and `TOKEN:advantage#5844562972` (1.0 numeric art id). Slicing the prefix alone put
    // "Advantage:2" and "advantage#5844562972" into captions. A 1.0 file usually resolves
    // names from its own %%% CARDS index, but that section is optional, so this path runs.
    const r = makeNameResolver({ 'SOR#108': 'Wampa' });

    it('renders a readable name for both id shapes', () => {
        expect(r.nameOf('TOKEN:Advantage')).toBe('Advantage');
        expect(r.nameOf('TOKEN:Advantage:2')).toBe('Advantage');
        expect(r.nameOf('TOKEN:advantage#5844562972')).toBe('Advantage');
        expect(r.nameOf('TOKEN:x-wing#9415311381')).toBe('X-Wing');
        expect(r.nameOf('TOKEN:the force#4571900905')).toBe('The Force');
    });

    it('still resolves ordinary cards from the map', () => {
        expect(r.nameOf('SOR#108')).toBe('Wampa');
        expect(r.nameOf('SOR#108:3')).toBe('Wampa');
        expect(r.nameOf('SOR#999')).toBe('SOR#999');
    });
});

describe('makeNameResolver on hostile ids', () => {
    it('never returns Object.prototype for __proto__ and always returns a string', async () => {
        const { makeNameResolver } = await import('../swupgnCardNames');
        const r = makeNameResolver(Object.assign(Object.create(null), { 'SOR#010': 'Darth Vader' }));
        expect(r.nameOf('__proto__')).toBe('__proto__');
        expect(typeof r.nameOf(5 as unknown as string)).toBe('string');
    });
});

describe('sidedResolver — a leader is named by the side that is up', () => {
    // Value: protects=a flipped double-sided leader (Palpatine->Sidious) named by its up side on board/captions; fails_when=the onStartingSide===false clause is dropped, or the side set is keyed on baseId so a mirror copy flips too; why_new=vectors only exercise the deployed path; seam=none; no_claim=render() side tracking
    it('a flipped leader reads its back, an unflipped one its front, and other cards are untouched', () => {
        const names = indexResolver([
            { id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious, Sith Lord' },
            { id: 'SOR#010', name: 'Darth Vader, Dark Lord of the Sith' },
            { id: 'SOR#095', name: 'Wampa' },
        ]);
        const withLeaders = (p1: object, p2: object): ReducedState => {
            const s = emptyState();
            s.players[1] = { ...s.players[1]!, leader: { deployed: false, exhausted: false, epicActionUsed: false, ...p1 } as never };
            s.players[2] = { ...s.players[2]!, leader: { deployed: false, exhausted: false, epicActionUsed: false, ...p2 } as never };
            return s;
        };
        const flipped = sidedResolver(names, withLeaders({ id: 'TWI#017', onStartingSide: false }, { id: 'SOR#010', deployed: true }));
        expect(flipped.nameOf('TWI#017')).toBe('Darth Sidious, Sith Lord');
        // A mirror match: seat 2's copy is TWI#017:2 (§11) and keeps its own, unflipped side.
        const mirror = sidedResolver(names, withLeaders({ id: 'TWI#017', onStartingSide: false }, { id: 'TWI#017:2', onStartingSide: true }));
        expect(mirror.nameOf('TWI#017')).toBe('Darth Sidious, Sith Lord');
        expect(mirror.nameOf('TWI#017:2')).toBe('Chancellor Palpatine, Playing Both Sides');
        expect(flipped.frontNameOf('TWI#017')).toBe('Chancellor Palpatine, Playing Both Sides');
        // A deployed leader with no other name keeps its own, and a bystander is unaffected.
        expect(flipped.nameOf('SOR#010')).toBe('Darth Vader, Dark Lord of the Sith');
        expect(flipped.nameOf('SOR#095')).toBe('Wampa');
        const front = sidedResolver(names, withLeaders({ id: 'TWI#017', onStartingSide: true }, { id: 'SOR#010' }));
        expect(front.nameOf('TWI#017')).toBe('Chancellor Palpatine, Playing Both Sides');
        // No state yet (before the first frame): every card reads its front.
        expect(sidedResolver(names, undefined).nameOf('TWI#017')).toBe('Chancellor Palpatine, Playing Both Sides');
    });
});

describe('sidedResolver follows a leader that leaves base by MOVE, as render() does', () => {
    // Value: protects=a two-sided leader moved base -> arena with no DEPLOY_LEADER is named by its back, and by its front once home; fails_when=sidedResolver reads only leader.deployed again; why_new=no vector moves a leader out without a DEPLOY record; seam=none; no_claim=render()'s own mirror keying
    it('names the back side after base -> space, the front after space -> base', () => {
        const names = indexResolver([{ id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' }]);
        const seat = (n: number, extra = {}) => ({ seat: n, hand: [], discard: [], cards: [], ...extra });
        const events = [
            { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: seat(1, { leader: { id: 'HMW#004', deployed: false, exhausted: false, epicActionUsed: false } }), 2: seat(2) } } },
            { seq: 'R1.A.1', t: 'MOVE', card: 'HMW#004', from: 'base', to: 'space', p: 1, kind: 'unit' },
            { seq: 'R1.A.2', t: 'MOVE', card: 'HMW#004', from: 'space', to: 'base', p: 1, kind: 'unit' },
        ] as unknown as GameEvent[];
        const frames = foldFrames(events);
        expect(sidedResolver(names, frames[1]).nameOf('HMW#004')).toBe('The Death Star, Icon of Tyranny');
        expect(sidedResolver(names, frames[2]).nameOf('HMW#004')).toBe('Grand Moff Tarkin, Tyrant of the Outer Rim');
    });

    // Value: protects=a leader moved base -> arena as a pilot (attached to a vehicle) with no DEPLOY_LEADER also reads its back; fails_when=sidedResolver looks only at arena cards, not their upgrades; why_new=the unit test above never attaches; seam=none; no_claim=render()'s own mirror keying
    it('names the back side of a leader that left base as a pilot', () => {
        const names = indexResolver([{ id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' }]);
        const seat = (n: number, extra = {}) => ({ seat: n, hand: [], discard: [], cards: [], ...extra });
        const vehicle = { id: 'V', zone: 'space', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [] };
        const events = [
            { seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: seat(1, { cards: [vehicle], leader: { id: 'HMW#004', deployed: false, exhausted: false, epicActionUsed: false } }), 2: seat(2) } } },
            { seq: 'R1.A.1', t: 'MOVE', card: 'HMW#004', from: 'base', to: 'space', p: 1, kind: 'upgrade', attachedTo: 'V' },
        ] as unknown as GameEvent[];
        const frames = foldFrames(events);
        expect(frames[1].players[1]!.cards[0].upgrades).toEqual(['HMW#004']);
        expect(sidedResolver(names, frames[1]).nameOf('HMW#004')).toBe('The Death Star, Icon of Tyranny');
    });
});

describe('sidedResolver finds a leader on either seat', () => {
    // Value: protects=a seat's leader standing in, or piloting a unit on, the OTHER seat's side (a control change) still reads its back; fails_when=inArena scans only the leader's own seat; why_new=the pilot and unit tests keep the leader on its own seat; seam=none; no_claim=how a file records the control change
    it('names the back side when the leader is on the opponent\'s side', () => {
        const names = indexResolver([{ id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' }]);
        const withP2Cards = (cards: object[]): ReducedState => {
            const s = emptyState();
            s.players[1] = { ...s.players[1]!, leader: { id: 'HMW#004', deployed: false, exhausted: false, epicActionUsed: false } as never };
            s.players[2] = { ...s.players[2]!, cards: cards as never };
            return s;
        };
        expect(sidedResolver(names, withP2Cards([{ id: 'HMW#004', zone: 'space', upgrades: [] }])).nameOf('HMW#004')).toBe('The Death Star, Icon of Tyranny');
        expect(sidedResolver(names, withP2Cards([{ id: 'V', zone: 'space', upgrades: ['HMW#004'] }])).nameOf('HMW#004')).toBe('The Death Star, Icon of Tyranny');
        expect(sidedResolver(names, withP2Cards([{ id: 'V', zone: 'space', upgrades: [] }])).nameOf('HMW#004')).toBe('Grand Moff Tarkin, Tyrant of the Outer Rim');
    });
});

describe('nameAtSeq — a bookmark names a card as it read at its record', () => {
    // Value: protects=bookmark and digest labels name a two-sided leader by its side at that record, and fall back to its front for an unknown seq; fails_when=nameAtSeq ignores the frame or throws on an unknown seq; why_new=the logic lived inside the React provider; seam=none; no_claim=the provider wiring
    it('uses the side up at the record, and the front for a seq no record has', () => {
        const names = indexResolver([{ id: 'HMW#004', name: 'Grand Moff Tarkin, Tyrant of the Outer Rim', backSideName: 'The Death Star, Icon of Tyranny' }]);
        const before = emptyState();
        const after = emptyState();
        after.players[1] = { ...after.players[1]!, leader: { id: 'HMW#004', deployed: true, exhausted: false, epicActionUsed: false } };
        const frameBySeq = new Map([['R8.A.1', 0], ['R8.A.1c', 1]]);
        expect(nameAtSeq(names, [before, after], frameBySeq, 'HMW#004', 'R8.A.1')).toBe('Grand Moff Tarkin, Tyrant of the Outer Rim');
        expect(nameAtSeq(names, [before, after], frameBySeq, 'HMW#004', 'R8.A.1c')).toBe('The Death Star, Icon of Tyranny');
        expect(nameAtSeq(names, [before, after], frameBySeq, 'HMW#004', 'R99.A.1')).toBe('Grand Moff Tarkin, Tyrant of the Outer Rim');
    });
});
