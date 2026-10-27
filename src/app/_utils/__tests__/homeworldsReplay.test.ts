import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, foldFrames, normalizeEvents, indexResolver, type GameEvent } from '@/lib/swupgn';
import { frameAction } from '../replayAction';
import { buildBeats, beatAt } from '../replayBeats';
import { buildMoveList, isNumberedAction } from '../swupgnMoves';
import { sidedResolver } from '../swupgnCardNames';

/**
 * Spec §10.3 (Homeworlds) and §10.4 (Grand Moff Tarkin) through the client's own prose and
 * pacing: captions and the move list name a leader by the side that is up, a granted ability
 * names its grantor, and a deploy performed by an Epic Action plays as that one action.
 */
const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const load = (name: string) => {
    const doc = parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const names = indexResolver(doc.cards);
    const at = (seq: string) => events.findIndex((e) => e.seq === seq);
    const label = (seq: string) => frameAction(events[at(seq)], sidedResolver(names, frames[at(seq)])).label;
    return { events, frames, names, at, label };
};

describe('death-star (§10.4)', () => {
    const { events, frames, names, at, label } = load('death-star');

    it('the deploy names both sides, and the deployed leader is The Death Star from then on', () => {
        expect(label('R8.A.1')).toBe('Player 1 uses Grand Moff Tarkin, Tyrant of the Outer Rim\'s Epic Action');
        expect(label('R8.A.1c')).toBe('Player 1 deploys Grand Moff Tarkin, Tyrant of the Outer Rim as The Death Star, Icon of Tyranny');
        expect(label('R8.G.3')).toBe('Player 2\'s base is defeated by The Death Star, Icon of Tyranny');
    });

    it('the move list names the leader by the side up at each row', () => {
        const moves = buildMoveList(events, (i) => sidedResolver(names, frames[i]));
        expect(moves.find((m) => m.seq === 'R8.G.3')?.label).toContain('by The Death Star');
        // Before the deploy it is still Tarkin.
        expect(sidedResolver(names, frames[at('R8.A.1')]).nameOf('HMW#004')).toBe('Grand Moff Tarkin, Tyrant of the Outer Rim');
    });

    it('the Epic Action and the deploy it performs are one beat', () => {
        const beats = buildBeats(events);
        expect(beatAt(beats, at('R8.A.1c'))).toBe(beatAt(beats, at('R8.A.1')));
    });
});

describe('homeworlds (§10.3)', () => {
    const { label, events, names, at } = load('homeworlds');

    it('a base\'s gained ability names the upgrade that granted it', () => {
        expect(label('R2.A.0a')).toBe('Player 1\'s base uses an ability (granted by Beast Lair)');
        // A base is not an arena card, so its ability glows nothing; a unit's ability glows the unit.
        expect(frameAction(events[at('R2.A.0a')], names).highlight).toEqual([]);
        expect(frameAction({ seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#095', kind: 'action' } as GameEvent, names).highlight).toEqual(['SOR#095']);
    });

    it('a Fortify play names the base as its host', () => {
        expect(label('R1.A.1')).toBe('Player 1 plays Beast Lair on Player 1\'s base (cost 2)');
    });
});

describe('a double-sided leader flip names both faces when the index has them', () => {
    it('reads "flips <face left> to <face landed>"', () => {
        const names = indexResolver([{ id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious, Sith Lord' }]);
        const flip = { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 1, card: 'TWI#017', onStartingSide: false } as GameEvent;
        expect(frameAction(flip, names).label).toBe('Player 1 flips Chancellor Palpatine, Playing Both Sides to Darth Sidious, Sith Lord');
        expect(frameAction({ ...flip, onStartingSide: true } as GameEvent, names).label).toBe('Player 1 flips Darth Sidious, Sith Lord to Chancellor Palpatine, Playing Both Sides');
    });
});

describe.each(readdirSync(DIR).filter((f) => f.endsWith('.swupgn')).map((f) => f.replace(/\.swupgn$/, '')))('%s: the client numbers what the story numbers, in its words', (name) => {
    it('every numbered story line is the caption of the matching numbered action', () => {
        const { events, frames, names } = load(name);
        const doc = parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));
        const numbered = (lines: string[]) => lines.flatMap((l) => { const m = /^\s*\d+\.\s+(.*)$/.exec(l); return m ? [m[1]] : []; });
        const mine = events.flatMap((e, i) => (isNumberedAction(e) ? [frameAction(e, sidedResolver(names, frames[i])).label] : []));
        expect(mine).toEqual(numbered(doc.story ?? []));
    });
});

describe('a mirror-match flip caption words the line as the story does', () => {
    // Value: protects=the flip caption for a copy (`TWI#017:2`) matches render()'s line exactly; fails_when=the copy suffix moves to the other face; why_new=the flip test used an uncopied leader; seam=none; no_claim=render's own mirror keying (upstream)
    it('suffixes the face it left and names the face it landed on bare', () => {
        const cards = [{ id: 'TWI#017', name: 'Chancellor Palpatine, Playing Both Sides', backSideName: 'Darth Sidious, Sith Lord' }];
        const names = indexResolver(cards);
        const flip = { seq: 'R1.A.1', t: 'LEADER_FLIP', p: 2, card: 'TWI#017:2', onStartingSide: false } as GameEvent;
        expect(frameAction(flip, names).label).toBe('Player 2 flips Chancellor Palpatine, Playing Both Sides #2 to Darth Sidious, Sith Lord');
        const home = { ...flip, onStartingSide: true } as GameEvent;
        expect(frameAction(home, names).label).toBe('Player 2 flips Darth Sidious, Sith Lord #2 to Chancellor Palpatine, Playing Both Sides');
    });
});

describe('a granted ability spent as the player\'s action names its grantor too', () => {
    // Value: protects=an action/Epic Action ABILITY_ACTIVATE with grantedBy keeps "(granted by X)" and glows no base; fails_when=the grantor is dropped from the player-action branch; why_new=the vector's granted ability is a triggered one; seam=none; no_claim=render()'s story line
    it('reads "uses <card>\'s Epic Action (granted by <upgrade>)"', () => {
        const names = indexResolver([{ id: 'HMW#147', name: 'Beast Lair' }]);
        const use = { seq: 'R2.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'base@1', kind: 'epic', grantedBy: 'HMW#147' } as GameEvent;
        const a = frameAction(use, names);
        expect(a.label).toBe('Player 1 uses Player 1\'s base\'s Epic Action (granted by Beast Lair)');
        expect(a.highlight).toEqual([]);
        expect(frameAction({ ...use, kind: 'action' } as GameEvent, names).label).toBe('Player 1 uses Player 1\'s base (granted by Beast Lair)');
    });
});
