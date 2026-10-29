import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { checkKeyframes, fold, parse, render } from '../index';
import type { CardInstanceState, GameEvent, PlayerState } from '../index';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * forceteki's reader specs for 18cd06297..6147b3c58, the CR v9.0 coverage pass (spec §22):
 * the `fold`, `integrity` and `render` cases it added, ported verbatim apart from `function ()`
 * becoming an arrow, the fixture path and the helpers below. Each keeps upstream's "Value:" note.
 * `types.spec.ts`'s additions hold the type aliases to the JSON schema, which the client does not
 * copy; `validate.spec.ts`, `actionLinks.spec.ts` and `writerLinks.spec.ts` cover code the client
 * does not ship. Upstream's one parse case is at the end.
 */

/** A seat at rest (upstream integrity.spec.ts). */
function restingSeat(s: 1 | 2, over: Partial<PlayerState> = {}): PlayerState {
    return { seat: s, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
        resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], ...over };
}

// Wrong-board fixes (CR 5.4.1.b, 5.5.1.c, 3.4.4.b, 3.7.3).
describe('fold wrong-board fixes', () => {
    const seat = (n: 1 | 2, extra: object = {}) => ({ seat: n, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0, resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], ...extra });
    const keyframe = (extra1: object = {}) => ({ round: 1, phase: 'action', initiative: 1, initiativeTaken: false, players: { 1: seat(1, extra1), 2: seat(2) } });

    it('ROUND_START sets the initiative to its active seat', () => {
        const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, active: 2 }] as any);
        expect(s.initiative).toBe(2);
        expect(s.initiativeTaken).toBe(false);
    });

    it('a resource move into the row exhausted is counted once', () => {
        const start: any = { seq: 'R1.start', t: 'ROUND_START', round: 1, active: 1, keyframe: keyframe({ resourcesReady: 2 }) };
        const move = (extra: object) => ({ seq: 'R1.G.1', t: 'MOVE', card: 'A', from: 'hand', to: 'resource', p: 1, ...extra });
        const exhausted = fold([start, move({ exhausted: true })] as any).players[1];
        expect([exhausted?.resourcesReady, exhausted?.resourcesExhausted]).toEqual([2, 1]);
        expect(fold([start, move({})] as any).players[1]?.resourcesReady).toBe(3);
    });

    it('a leader moving from base into an arena is deployed without a DEPLOY_LEADER', () => {
        const start: any = { seq: 'R1.start', t: 'ROUND_START', round: 1, active: 1, keyframe: keyframe({ leader: { id: 'X', deployed: false, exhausted: false, epicActionUsed: false } }) };
        const s = fold([start, { seq: 'R1.A.1', t: 'MOVE', card: 'X', from: 'base', to: 'ground', p: 1 }] as any);
        expect(s.players[1]?.leader?.deployed).toBe(true);
    });

    it('a CAPTURE of a token holds nothing', () => {
        const s = fold([
            { seq: 'R1.A.1', t: 'MOVE', card: 'U', from: 'hand', to: 'ground', p: 1, kind: 'unit' },
            { seq: 'R1.A.2', t: 'CAPTURE', card: 'TOKEN:battle-droid#1', by: 'U' },
        ] as any);
        expect(s.players[1]?.cards.find((c) => c.id === 'U')?.captured).toEqual([]);
    });
});

// Lasting and delayed effects (spec §10.1, §11, §12.2; CR 1.16.1).
describe('fold effects', () => {
    const start = (seq: string, id: string, targets?: string[], extra: Partial<Extract<GameEvent, { t: 'EFFECT_START' }>> = {}): GameEvent =>
        ({ seq, t: 'EFFECT_START', id, src: 'SOR#142', p: 1, duration: 'phase', ...(targets ? { targets } : {}), ...extra });
    const end = (seq: string, id: string, targets?: string[]): GameEvent =>
        ({ seq, t: 'EFFECT_END', id, reason: targets ? 'targetLeft' : 'expired', ...(targets ? { targets } : {}) });

    // Value: protects=the board carries each active effect from its start to its end; fails_when=EFFECT_START/EFFECT_END fold to nothing, or the list is not kept in start order; why_new=effects are new; seam=none; no_claim=writer output
    it('EFFECT_START adds an active effect and EFFECT_END removes it', () => {
        const started = fold([start('R1.A.1a', 'fx@1', ['SOR#108']), start('R1.A.2a', 'fx@2', undefined, { seat: 2, duration: 'round', text: 'costs 1 more' })]);
        expect(started.effects).toEqual([
            { id: 'fx@1', src: 'SOR#142', p: 1, targets: ['SOR#108'], duration: 'phase' },
            { id: 'fx@2', src: 'SOR#142', p: 1, seat: 2, duration: 'round' },
        ]);
        const ended = fold([start('R1.A.1a', 'fx@1', ['SOR#108']), start('R1.A.2a', 'fx@2', undefined, { seat: 2 }), end('R1.A.3a', 'fx@1')]);
        expect(ended.effects?.map((e) => e.id)).toEqual(['fx@2']);
    });

    // Value: protects=a player-wide effect on both players folds as one effect with seat both (§10.1); fails_when=the fold drops seat "both"; why_new=final review item 15; seam=none; no_claim=writer output
    it('keeps seat both on a player-wide effect', () => {
        expect(fold([start('R1.A.1a', 'fx@1', undefined, { seat: 'both' })]).effects).toEqual([{ id: 'fx@1', src: 'SOR#142', p: 1, seat: 'both', duration: 'phase' }]);
    });

    // Value: protects=a target leaving play drops only that target (CR 7.7.3.d, 8.7) and the last one ends the effect; fails_when=a partial EFFECT_END ends the whole effect, or an effect with no targets left lingers; why_new=effects are new; seam=none; no_claim=writer emits the partial end
    it('a partial EFFECT_END drops only the named targets', () => {
        const both = start('R1.A.1a', 'fx@1', ['A', 'B']);
        expect(fold([both, end('R1.A.2a', 'fx@1', ['A'])]).effects).toEqual([{ id: 'fx@1', src: 'SOR#142', p: 1, targets: ['B'], duration: 'phase' }]);
        expect(fold([both, end('R1.A.2a', 'fx@1', ['A']), end('R1.A.3a', 'fx@1', ['B'])]).effects).toEqual([]);
    });

    // Value: protects=absent means "not recorded" for files older than effects; fails_when=emptyState or the fold seeds effects: [] for every file; why_new=effects are new; seam=none; no_claim=none
    it('a file without effect records folds with no effects field', () => {
        const fixtures = path.join(__dirname, 'fixtures');
        // A synthetic revision-4 file (`minimal` as it was before revision 6): older than effect records.
        const doc = parse(fs.readFileSync(path.join(fixtures, 'minimal-rev4.swupgn'), 'utf8'));
        expect(doc.header.writerRevision).toBe(4);
        expect('effects' in fold(doc.events)).toBe(false);
    });
});

describe('fold limited abilities, looks and names', () => {
    const use = (seq: string, per: 'phase' | 'round' | 'game', card = 'SOR#045', ability = 'a1', p: 1 | 2 = 1): GameEvent =>
        ({ seq, t: 'ABILITY_ACTIVATE', p, card, ability, kind: 'triggered', limit: { max: 2, per } });
    const phase = (seq: string, name: string): GameEvent => ({ seq, t: 'PHASE_START', phase: name });
    const round = (seq: string, n: number): GameEvent => ({ seq, t: 'ROUND_START', round: n, active: 1 });

    // Value: protects=a limited ability's used status (CR 7.2.5, 1.16.3) is on the board and resets only at the boundary its per names; fails_when=uses are not counted, or PHASE_START/ROUND_START clear the wrong entries; why_new=abilityUses are new; seam=none; no_claim=writer output
    it('counts a limited ability\'s uses and clears them at its reset boundary', () => {
        const counted = fold([use('R1.A.1', 'phase'), use('R1.A.2', 'phase'), use('R1.A.3', 'round', 'SOR#046'), use('R1.A.4', 'game', 'SOR#047', 'a2', 2)]);
        expect(counted.players[1]?.abilityUses).toEqual([
            { card: 'SOR#045', ability: 'a1', count: 2, per: 'phase', max: 2 },
            { card: 'SOR#046', ability: 'a1', count: 1, per: 'round', max: 2 },
        ]);
        expect(counted.players[2]?.abilityUses).toEqual([{ card: 'SOR#047', ability: 'a2', count: 1, per: 'game', max: 2 }]);

        // A phase ends the per-phase uses; the per-round and per-game ones survive it.
        const afterPhase = fold([use('R1.A.1', 'phase'), use('R1.A.3', 'round', 'SOR#046'), use('R1.A.4', 'game', 'SOR#047'), phase('R1.G.0', 'regroup')]);
        expect(afterPhase.players[1]?.abilityUses).toEqual([
            { card: 'SOR#046', ability: 'a1', count: 1, per: 'round', max: 2 },
            { card: 'SOR#047', ability: 'a1', count: 1, per: 'game', max: 2 },
        ]);

        // A round ends the per-round ones too; a per-game use is never cleared.
        const afterRound = fold([use('R1.A.1', 'phase'), use('R1.A.3', 'round', 'SOR#046'), use('R1.A.4', 'game', 'SOR#047'), round('R2.start', 2)]);
        expect(afterRound.players[1]?.abilityUses).toEqual([{ card: 'SOR#047', ability: 'a1', count: 1, per: 'game', max: 2 }]);
    });

    // Value: protects=an ability without limit, or a limit the fold cannot key, adds no entry; fails_when=every ABILITY_ACTIVATE is counted, or a limit with no ability id or an unknown per makes an entry; why_new=abilityUses are new; seam=none; no_claim=none
    it('counts only an ABILITY_ACTIVATE that carries a limit it knows and an ability id', () => {
        const s = fold([
            { seq: 'R1.A.1', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#045', ability: 'a1', kind: 'action' },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#045', kind: 'action', limit: { max: 1, per: 'phase' } },
            // A `per` from a newer minor version: the fold cannot know when it resets, so it does not count it (§18).
            { seq: 'R1.A.3', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#045', ability: 'a1', kind: 'action', limit: { max: 1, per: 'turn' as 'phase' } },
        ]);
        expect('abilityUses' in (s.players[1] ?? {})).toBe(false);
    });

    // Value: protects=LOOK, NAME, blind, simul and usedBy are notes the fold ignores; fails_when=any of them changes the board; why_new=the records are new; seam=none; no_claim=what the writer emits
    it('LOOK and NAME change nothing', () => {
        const base: GameEvent[] = [
            { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'SOR#108', zone: 'ground' },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#108', ability: 'a1', kind: 'action' },
        ];
        const noted: GameEvent[] = [
            { seq: 'R1.A.1', t: 'PLAY', p: 1, card: 'SOR#108', zone: 'ground', simul: 'R1.A.1' },
            { seq: 'R1.A.1a', t: 'LOOK', p: 1, owner: 2, zone: 'deck', cards: ['SOR#095', 'SOR#096'], count: 2 },
            { seq: 'R1.A.1b', t: 'NAME', p: 1, name: 'Wampa, Hungry Beast' },
            { seq: 'R1.A.1c', t: 'CHOICE', p: 2, offered: ['SOR#095'], chose: 0, blind: 'R1.A.1' },
            { seq: 'R1.A.1d', t: 'SEARCH', p: 1, owner: 2, zone: 'deck', seen: ['SOR#095'] },
            { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#108', ability: 'a1', kind: 'action', usedBy: 'SOR#200' },
        ];
        expect(fold(noted)).toEqual(fold(base));
    });

    // Value: protects=a use count reset off the per boundary (the card changed zone) is a stated record that clears only that card, or only that ability; fails_when=ABILITY_RESET does nothing, clears other cards or abilities, or creates a list; why_new=ABILITY_RESET is new (fix round 1); seam=none; no_claim=when the writer emits it
    it('ABILITY_RESET clears only that card, and only that ability when it names one', () => {
        const uses = [use('R1.A.1', 'round'), use('R1.A.2', 'round', 'SOR#045', 'a2'), use('R1.A.3', 'round', 'SOR#046'), use('R1.A.4', 'round', 'SOR#045', 'a1', 2)];
        const whole = fold([...uses, { seq: 'R1.A.5a', t: 'ABILITY_RESET', card: 'SOR#045' }]);
        expect(whole.players[1]?.abilityUses).toEqual([{ card: 'SOR#046', ability: 'a1', count: 1, per: 'round', max: 2 }]);
        expect(whole.players[2]?.abilityUses).toEqual([]);
        const one = fold([...uses, { seq: 'R1.A.5a', t: 'ABILITY_RESET', card: 'SOR#045', ability: 'a2' }]);
        expect(one.players[1]?.abilityUses?.map((u) => `${u.card}/${u.ability}`)).toEqual(['SOR#045/a1', 'SOR#046/a1']);
        expect(one.players[2]?.abilityUses?.length).toBe(1);
        expect('abilityUses' in (fold([{ seq: 'R1.A.1a', t: 'ABILITY_RESET', card: 'SOR#045' }]).players[1] ?? {})).toBe(false);
    });

    // Value: protects=max on the board is the latest limit.max, so a reader can say "spent"; fails_when=max is not folded or not updated; why_new=fix round 1; seam=none; no_claim=none
    it('keeps the latest limit max on the entry', () => {
        const s = fold([use('R1.A.1', 'game'), { seq: 'R1.A.2', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#045', ability: 'a1', limit: { max: 3, per: 'game' } }]);
        expect(s.players[1]?.abilityUses).toEqual([{ card: 'SOR#045', ability: 'a1', count: 2, per: 'game', max: 3 }]);
    });

    // Value: protects=absent means "not recorded" for files older than abilityUses; fails_when=emptyPlayer or the fold seeds abilityUses for every file; why_new=abilityUses are new; seam=none; no_claim=none
    it('a file without limited abilities folds with no abilityUses field', () => {
        const fixtures = path.join(__dirname, 'fixtures');
        // A synthetic revision-4 file (`minimal` as it was before revision 6): older than limited-ability uses.
        const doc = parse(fs.readFileSync(path.join(fixtures, 'minimal-rev4.swupgn'), 'utf8'));
        expect(doc.header.writerRevision).toBe(4);
        const s = fold(doc.events);
        expect('abilityUses' in (s.players[1] ?? {})).toBe(false);
        expect('abilityUses' in (s.players[2] ?? {})).toBe(false);
    });

    // Value: protects=a keyframe with a malformed abilityUses is damaged, not snapped to (§13); fails_when=a non-list or non-object entry is snapped to and a later ABILITY_ACTIVATE throws; why_new=abilityUses are new; seam=none; no_claim=none
    it('ignores a keyframe whose abilityUses is not a list of uses', () => {
        const seat = (s: 1 | 2, abilityUses?: unknown) => ({ seat: s, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
            resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], ...(abilityUses !== undefined ? { abilityUses } : {}) });
        for (const bad of [5, [null], [{ card: 'X' }], new Array(1001).fill({ card: 'X', ability: 'a', count: 1, per: 'game' })]) {
            const s = fold([
                { seq: 'R1.start', t: 'ROUND_START', round: 1, active: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: seat(1, bad) as any, 2: seat(2) as any } } },
                use('R1.A.1', 'game'),
            ]);
            expect(s.players[1]?.abilityUses).toEqual([{ card: 'SOR#045', ability: 'a1', count: 1, per: 'game', max: 2 }]);
        }
    });
});

// Attributes, control and ownership (spec §10.1 STATS and TAKE_CONTROL, §11, §12.2; CR 1.16.1, 1.5.2, 1.7.5, 8.27).
describe('fold attributes, control and ownership', () => {
    const unit = (seq: string, card: string, p: 1 | 2, from = 'hand'): GameEvent => ({ seq, t: 'MOVE', card, from, to: 'ground', p, kind: 'unit' });
    const upgrade = (seq: string, card: string, host: string, p: 1 | 2): GameEvent => ({ seq, t: 'MOVE', card, from: 'hand', to: 'ground', p, kind: 'upgrade', attachedTo: host });
    const take = (seq: string, card: string, p: 1 | 2, zone = 'ground', extra: Partial<Extract<GameEvent, { t: 'TAKE_CONTROL' }>> = {}): GameEvent =>
        ({ seq, t: 'TAKE_CONTROL', p, card, zone, from: p === 1 ? 2 : 1, ...extra });
    const card = (s: ReturnType<typeof fold>, seat: 1 | 2, id: string) => s.players[seat]?.cards.find((c) => c.id === id);

    // Value: protects=a unit's traits, lost abilities, leader-unit status and copied attributes are on the board as STATS states them (CR 1.16.1, 8.14.2, 8.5, 3.4.7); fails_when=STATS folds only power/hp/keywords; why_new=the attribute fields are new; seam=none; no_claim=writer output
    it('STATS carries traits, blank, leaderUnit and a copy\'s attributes', () => {
        const s = fold([
            unit('R1.A.1a', 'SOR#095', 1),
            { seq: 'R1.A.1b', t: 'STATS', card: 'SOR#095', power: 4, hp: 5, keywords: [], traits: ['trooper', 'rebel'], blank: true, leaderUnit: true,
                copyOf: 'SOR#108', name: 'Wampa, Hungry Beast', cost: 4, aspects: ['aggression', 'aggression'] },
        ]);
        const c = card(s, 1, 'SOR#095');
        expect(c?.traits).toEqual(['rebel', 'trooper']);
        expect(c?.blank).toBe(true);
        expect(c?.leaderUnit).toBe(true);
        expect([c?.copyOf, c?.name, c?.cost, c?.aspects]).toEqual(['SOR#108', 'Wampa, Hungry Beast', 4, ['aggression', 'aggression']]);
    });

    // Value: protects=STATS states the whole attribute set, so a field it leaves out is no longer true (a blanked unit regains its text, a copy ends); fails_when=an absent field keeps its old value; why_new=the attribute fields are new; seam=none; no_claim=none
    it('a STATS without traits clears them', () => {
        const s = fold([
            unit('R1.A.1a', 'SOR#095', 1),
            { seq: 'R1.A.1b', t: 'STATS', card: 'SOR#095', power: 4, hp: 5, traits: ['trooper'], blank: true, leaderUnit: true, copyOf: 'SOR#108', name: 'Wampa', cost: 4, aspects: ['aggression'] },
            { seq: 'R1.A.2a', t: 'STATS', card: 'SOR#095', power: 3, hp: 3, keywords: ['sentinel'] },
        ]);
        const c = card(s, 1, 'SOR#095');
        for (const field of ['traits', 'blank', 'leaderUnit', 'copyOf', 'name', 'cost', 'aspects']) {
            expect(field in (c ?? {})).toBe(false);
        }
        expect([c?.power, c?.hp, c?.keywords]).toEqual([3, 3, ['sentinel']]);
    });

    // Value: protects=an upgrade's controller (CR 1.16.1, 8.27) is on its host's entry when it differs from the host's, and a return clears it; fails_when=an upgrade TAKE_CONTROL re-seats nothing, or moves the host; why_new=the upgrade form of TAKE_CONTROL is new; seam=none; no_claim=writer output
    it('an upgrade taken by the other seat is listed in upgradeControllers and given back clears it', () => {
        const setup = [unit('R1.A.1a', 'SOR#095', 1), upgrade('R1.A.2a', 'LOF#215', 'SOR#095', 1)];
        const taken = fold([...setup, take('R1.A.3a', 'LOF#215', 2)]);
        expect(card(taken, 1, 'SOR#095')?.upgrades).toEqual(['LOF#215']);
        expect(card(taken, 1, 'SOR#095')?.upgradeControllers).toEqual({ 'LOF#215': 2 });
        expect(taken.players[2]?.cards).toEqual([]);
        const back = fold([...setup, take('R1.A.3a', 'LOF#215', 2), take('R1.A.4a', 'LOF#215', 1)]);
        expect('upgradeControllers' in (card(back, 1, 'SOR#095') ?? {})).toBe(false);
        expect(fold(setup)).toEqual(back);
    });

    // Value: protects=an upgrade played onto an enemy unit is listed under its player, and a host changing hands keeps each upgrade with its own controller; fails_when=the attaching move's seat is ignored, or a host's TAKE_CONTROL takes its upgrades with it; why_new=upgradeControllers is new; seam=none; no_claim=none
    it('an upgrade on an enemy unit is listed, and its host changing hands re-keys it', () => {
        const setup = [unit('R1.A.1a', 'SOR#095', 1), upgrade('R1.A.2a', 'LOF#215', 'SOR#095', 2), upgrade('R1.A.3a', 'LOF#216', 'SOR#095', 1)];
        expect(card(fold(setup), 1, 'SOR#095')?.upgradeControllers).toEqual({ 'LOF#215': 2 });
        const stolen = fold([...setup, take('R1.A.4a', 'SOR#095', 2)]);
        expect(card(stolen, 2, 'SOR#095')?.upgradeControllers).toEqual({ 'LOF#216': 1 });
        // The upgrade leaving play leaves the list with it.
        const gone = fold([...setup, take('R1.A.4a', 'SOR#095', 2), { seq: 'R1.A.5a', t: 'MOVE', card: 'LOF#216', from: 'ground', to: 'discard', p: 1 }]);
        expect('upgradeControllers' in (card(gone, 2, 'SOR#095') ?? {})).toBe(false);
    });

    // Value: protects=a unit's owner is on its entry when another seat controls it (CR 1.7.5), and the return clears it; fails_when=TAKE_CONTROL re-seats without recording the owner, or a stolen-back unit keeps it; why_new=owner is new; seam=none; no_claim=writer output
    it('a stolen unit records its owner and returning it clears the owner', () => {
        const stolen = fold([unit('R1.A.1a', 'SOR#095', 1), take('R1.A.2a', 'SOR#095', 2)]);
        expect(card(stolen, 2, 'SOR#095')?.owner).toBe(1);
        const back = fold([unit('R1.A.1a', 'SOR#095', 1), take('R1.A.2a', 'SOR#095', 2), take('R1.A.3a', 'SOR#095', 1)]);
        expect('owner' in (card(back, 1, 'SOR#095') ?? {})).toBe(false);
        // A unit played out of the other seat's discard (the whose-pile rule of §12.1) is that seat's.
        const played = fold([
            { seq: 'R1.A.1a', t: 'MOVE', card: 'JTL#221', from: 'hand', to: 'discard', p: 1 },
            unit('R1.A.2a', 'JTL#221', 2, 'discard'),
        ]);
        expect(card(played, 2, 'JTL#221')?.owner).toBe(1);
        expect('owner' in (card(fold([unit('R1.A.1a', 'SOR#095', 1)]), 1, 'SOR#095') ?? {})).toBe(false);
    });

    // Value: protects=a resource controlled by the seat that does not own it is listed in that seat's foreignResources, a return clears it, and the card leaving the row takes its owner with it; fails_when=resource TAKE_CONTROL moves only the counts and membership; why_new=foreignResources is new; seam=none; no_claim=none
    it('a stolen resource is a foreign resource', () => {
        const row: GameEvent = { seq: 'R0.S.1', t: 'MOVE', card: 'LAW#253', from: 'hand', to: 'resource', p: 1 };
        const stolen = fold([row, take('R1.A.1a', 'LAW#253', 2, 'resource')]);
        expect(stolen.players[2]?.foreignResources).toEqual(['LAW#253']);
        expect('foreignResources' in (stolen.players[1] ?? {})).toBe(false);
        const back = fold([row, take('R1.A.1a', 'LAW#253', 2, 'resource'), take('R1.A.2a', 'LAW#253', 1, 'resource')]);
        expect(back.players[2]?.foreignResources).toEqual([]);
        expect(back.players[1]?.resources).toEqual(['LAW#253']);
        // Played out of the row (Smuggle): the unit is the other seat's, and the row no longer lists it.
        const played = fold([row, take('R1.A.1a', 'LAW#253', 2, 'resource'), { seq: 'R1.A.2a', t: 'MOVE', card: 'LAW#253', from: 'resource', to: 'space', p: 2, kind: 'unit' }]);
        expect(played.players[2]?.foreignResources).toEqual([]);
        expect(card(played, 2, 'LAW#253')?.owner).toBe(1);
    });

    // Value: protects=a keyframe whose upgradeControllers or foreignResources the fold cannot work on is damaged, not snapped to (§13); fails_when=a later TAKE_CONTROL throws on it; why_new=both fields are new; seam=none; no_claim=none
    it('ignores a keyframe whose control fields are malformed', () => {
        const seat = (s: 1 | 2, over: Record<string, unknown> = {}) => ({ seat: s, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
            resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards: [], ...over });
        const host = (upgradeControllers: unknown) => ({ id: 'SOR#095', zone: 'ground', damage: 0, exhausted: false, upgrades: ['LOF#215'], shields: 0,
            experience: 0, statusTokens: {}, captured: [], upgradeControllers });
        for (const bad of [seat(1, { foreignResources: 5 }), seat(1, { cards: [host(5)] }), seat(1, { cards: [host(['x'])] })]) {
            const s = fold([{ seq: 'R1.start', t: 'ROUND_START', round: 1, active: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: bad as any, 2: seat(2) as any } } }]);
            expect(s.round).toBe(1);
            expect(s.players[1]?.cards).toEqual([]);
        }
    });
});

// Fix round 1: ownership when the steal changed zone, and owner on arrival whatever the record order.
describe('fold ownership fix round 1', () => {
    // Value: protects=a unit put into play as a resource under the other seat (Arquitens Assault Cruiser) is listed as foreign, from the TAKE_CONTROL's owner; fails_when=a resource TAKE_CONTROL without from is dropped, or it shifts counts the MOVE already carried; why_new=owner on the resource form is new (fix round 1); seam=none; no_claim=writer output
    it('a resource steal that changed zone is a foreign resource by its owner', () => {
        const events: GameEvent[] = [
            { seq: 'R1.A.1a', t: 'MOVE', card: 'SOR#095', from: 'hand', to: 'ground', p: 2, kind: 'unit' },
            { seq: 'R1.A.2a', t: 'MOVE', card: 'SOR#095', from: 'ground', to: 'resource', p: 1, kind: 'unit', exhausted: true },
            { seq: 'R1.A.2b', t: 'TAKE_CONTROL', p: 1, card: 'SOR#095', zone: 'resource', owner: 2 },
        ];
        const s = fold(events);
        expect(s.players[1]?.foreignResources).toEqual(['SOR#095']);
        expect([s.players[1]?.resourcesReady, s.players[1]?.resourcesExhausted, s.players[1]?.resources]).toEqual([0, 1, ['SOR#095']]);
        expect('foreignResources' in (s.players[2] ?? {})).toBe(false);
        // Its own owner's steal changes nothing.
        const own = fold([...events.slice(0, 2), { seq: 'R1.A.2b', t: 'TAKE_CONTROL', p: 1, card: 'SOR#095', zone: 'resource', owner: 1 }]);
        expect('foreignResources' in (own.players[1] ?? {})).toBe(false);
    });

    // Value: protects=owner on arrival does not depend on whether the PLAY or its MOVE comes first (§12.1); fails_when=a PLAY placed before the MOVE leaves the entry without owner; why_new=fix round 1; seam=none; no_claim=none
    it('a unit played out of the other seat\'s discard has its owner when the PLAY comes first', () => {
        const s = fold([
            { seq: 'R1.A.1a', t: 'MOVE', card: 'JTL#221', from: 'hand', to: 'discard', p: 1 },
            { seq: 'R1.A.2', t: 'PLAY', p: 2, card: 'JTL#221', zone: 'space', cost: 3 },
            { seq: 'R1.A.2a', t: 'MOVE', card: 'JTL#221', from: 'discard', to: 'space', p: 2, kind: 'unit' },
        ]);
        expect(s.players[2]?.cards.find((c) => c.id === 'JTL#221')?.owner).toBe(1);
        expect(s.players[1]?.discard).toEqual([]);
    });
});

describe('checkKeyframes effects', () => {
    const effect = (id: string, targets: string[]) => ({ id, src: 'SOR#142', p: 1 as const, targets, duration: 'phase' as const });
    const starts: GameEvent[] = [
        { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, targets: ['A', 'B'], duration: 'phase' },
        { seq: 'R1.A.2a', t: 'EFFECT_START', id: 'fx@2', src: 'SOR#142', p: 1, targets: ['C'], duration: 'phase' },
    ];
    const kf = (effects?: ReturnType<typeof effect>[]): GameEvent => ({ seq: 'R1.end', t: 'ROUND_END', round: 1,
        keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: restingSeat(1), 2: restingSeat(2) }, ...(effects ? { effects } : {}) } });
    const paths = (events: GameEvent[]) => checkKeyframes(events).mismatches.map((m) => m.path);

    // Value: protects=the gate compares effects by id as a set, targets as a set; fails_when=effects ungated or compared in order; why_new=effects are new; seam=none; no_claim=writer output
    it('compares effects by id as a set', () => {
        expect(paths([...starts, kf([effect('fx@2', ['C']), effect('fx@1', ['B', 'A'])])])).toEqual([]);
        expect(paths([...starts, kf([effect('fx@1', ['A', 'B'])])])).toEqual(['effects']);
        expect(paths([...starts, kf([effect('fx@1', ['A']), effect('fx@2', ['C'])])])).toEqual(['effects']);
    });

    // Value: protects=a keyframe written before effects existed still verifies; fails_when=an absent effects list reads as empty; why_new=effects are new; seam=none; no_claim=none
    it('does not compare effects when the keyframe has none', () => {
        expect(paths([...starts, kf()])).toEqual([]);
    });
});

describe('checkKeyframes abilityUses', () => {
    const use = (seq: string, per: 'phase' | 'round' | 'game', card = 'SOR#045'): GameEvent =>
        ({ seq, t: 'ABILITY_ACTIVATE', p: 1, card, ability: 'a1', kind: 'triggered', limit: { max: 2, per } });
    const entry = (card: string, count: number, per: 'phase' | 'round' | 'game', max = 2) => ({ card, ability: 'a1', count, per, max });
    const kf = (t: 'ROUND_START' | 'ROUND_END', abilityUses?: ReturnType<typeof entry>[]): GameEvent => ({ seq: t === 'ROUND_END' ? 'R1.end' : 'R2.start', t, round: t === 'ROUND_END' ? 1 : 2, active: 1,
        keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: restingSeat(1, abilityUses ? { abilityUses } : {}), 2: restingSeat(2) } } });
    const paths = (events: GameEvent[]) => checkKeyframes(events).mismatches.map((m) => m.path);

    // Value: protects=the gate compares each seat's abilityUses as a set when the keyframe carries it; fails_when=abilityUses ungated, compared in order, or compared when absent; why_new=abilityUses are new; seam=none; no_claim=writer output
    it('compares abilityUses when the keyframe carries it', () => {
        const events = [use('R1.A.1', 'phase'), use('R1.A.2', 'phase'), use('R1.A.3', 'game', 'SOR#046')];
        expect(paths([...events, kf('ROUND_END', [entry('SOR#046', 1, 'game'), entry('SOR#045', 2, 'phase')])])).toEqual([]);
        expect(paths([...events, kf('ROUND_END', [entry('SOR#045', 1, 'phase'), entry('SOR#046', 1, 'game')])])).toEqual(['players.1.abilityUses']);
        expect(paths([...events, kf('ROUND_END', [entry('SOR#045', 2, 'phase')])])).toEqual(['players.1.abilityUses']);
        expect(paths([...events, kf('ROUND_END', [entry('SOR#046', 1, 'game'), entry('SOR#045', 2, 'phase', 3)])])).toEqual(['players.1.abilityUses']);
        expect(paths([...events, kf('ROUND_END')])).toEqual([]);
    });

    // Value: protects=a ROUND_START keyframe describes a round that has begun, so the per-phase and per-round uses the snap skips clearing are cleared before the compare; fails_when=a correct ROUND_START keyframe reports last round's uses as a mismatch; why_new=abilityUses are new; seam=none; no_claim=none
    it('clears per-phase and per-round uses before comparing a ROUND_START keyframe', () => {
        const events = [use('R1.A.1', 'phase'), use('R1.A.2', 'round', 'SOR#046'), use('R1.A.3', 'game', 'SOR#047')];
        expect(paths([...events, kf('ROUND_START', [entry('SOR#047', 1, 'game')])])).toEqual([]);
    });
});

describe('checkKeyframes attributes, control and ownership', () => {
    const unit = (over: Partial<CardInstanceState> = {}): CardInstanceState => ({ id: 'SOR#095', zone: 'ground', damage: 0, exhausted: false,
        upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [], ...over });
    const kf = (p1: PlayerState, p2: PlayerState = restingSeat(2)): GameEvent => ({ seq: 'R1.end', t: 'ROUND_END', round: 1,
        keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: p1, 2: p2 } } });
    const enter: GameEvent = { seq: 'R1.A.1a', t: 'MOVE', card: 'SOR#095', from: 'hand', to: 'ground', p: 1, kind: 'unit' };
    const stats: GameEvent = { seq: 'R1.A.1b', t: 'STATS', card: 'SOR#095', power: 4, hp: 5, traits: ['trooper', 'rebel'], blank: true,
        copyOf: 'SOR#108', name: 'Wampa', cost: 4, aspects: ['aggression'] };
    const paths = (events: GameEvent[]) => checkKeyframes(events).mismatches.map((m) => m.path).sort();
    const copied = { traits: ['rebel', 'trooper'], blank: true, copyOf: 'SOR#108', name: 'Wampa', cost: 4, aspects: ['aggression'] };

    // Value: protects=the gate compares traits, blank, leaderUnit, the copy fields, owner, upgradeControllers and foreignResources once the keyframe records them, and skips them on a keyframe that predates them; fails_when=any of them is ungated, or an older keyframe without them reports a mismatch; why_new=the fields are new; seam=none; no_claim=writer output
    it('compares the new card fields when the keyframe carries them', () => {
        expect(paths([enter, stats, kf(restingSeat(1, { cards: [unit(copied)] }))])).toEqual([]);
        // A keyframe from before the fields existed carries none of them: nothing to compare.
        expect(paths([enter, stats, kf(restingSeat(1, { cards: [unit()] }))])).toEqual([]);
        // traits on the keyframe card says it records attributes, so an absent blank or copy means none.
        expect(paths([enter, stats, kf(restingSeat(1, { cards: [unit({ traits: ['trooper', 'rebel'] })] }))]))
            .toEqual(['players.1.cards[SOR#095].aspects', 'players.1.cards[SOR#095].blank', 'players.1.cards[SOR#095].copyOf',
                'players.1.cards[SOR#095].cost', 'players.1.cards[SOR#095].name']);
        expect(paths([enter, stats, kf(restingSeat(1, { cards: [unit({ ...copied, traits: ['trooper'], leaderUnit: true })] }))]))
            .toEqual(['players.1.cards[SOR#095].leaderUnit', 'players.1.cards[SOR#095].traits']);

        // Control and ownership: foreignResources on the keyframe seat says it records them, so an absent owner means the holder.
        const steal: GameEvent[] = [enter, { seq: 'R1.A.2a', t: 'TAKE_CONTROL', p: 2, card: 'SOR#095', zone: 'ground', from: 1 }];
        const stolenSeat = (over: Partial<CardInstanceState>) => restingSeat(2, { foreignResources: [], cards: [unit(over)] });
        expect(paths([...steal, kf(restingSeat(1, { foreignResources: [] }), stolenSeat({ owner: 1 }))])).toEqual([]);
        expect(paths([...steal, kf(restingSeat(1), restingSeat(2, { cards: [unit()] }))])).toEqual([]);
        expect(paths([...steal, kf(restingSeat(1, { foreignResources: [] }), stolenSeat({}))])).toEqual(['players.2.cards[SOR#095].owner']);

        const attach: GameEvent[] = [enter, { seq: 'R1.A.2a', t: 'MOVE', card: 'LOF#215', from: 'hand', to: 'ground', p: 2, kind: 'upgrade', attachedTo: 'SOR#095' }];
        const host = (over: Partial<CardInstanceState>) => restingSeat(1, { foreignResources: [], cards: [unit({ upgrades: ['LOF#215'], ...over })] });
        expect(paths([...attach, kf(host({ upgradeControllers: { 'LOF#215': 2 } }), restingSeat(2, { foreignResources: [] }))])).toEqual([]);
        expect(paths([...attach, kf(host({}), restingSeat(2, { foreignResources: [] }))])).toEqual(['players.1.cards[SOR#095].upgradeControllers']);

        const row: GameEvent[] = [{ seq: 'R0.S.1', t: 'MOVE', card: 'LAW#253', from: 'hand', to: 'resource', p: 1 },
            { seq: 'R1.A.1a', t: 'TAKE_CONTROL', p: 2, card: 'LAW#253', zone: 'resource', from: 1 }];
        const counts = { resourcesReady: 1, resources: ['LAW#253'] };
        expect(paths([...row, kf(restingSeat(1, { resources: [] }), restingSeat(2, { ...counts, foreignResources: ['LAW#253'] }))])).toEqual([]);
        expect(paths([...row, kf(restingSeat(1, { resources: [] }), restingSeat(2, counts))])).toEqual([]);
        expect(paths([...row, kf(restingSeat(1, { resources: [] }), restingSeat(2, { ...counts, foreignResources: [] }))])).toEqual(['players.2.foreignResources']);
    });
});

describe('render effects', () => {
    const nm = { nameOf: (id: string) => ({ 'SOR#142': 'Bold Resistance', 'SOR#108': 'Wampa', 'SOR#095': 'Battlefield Marine' }[id] ?? id) };
    const doc = (events: any[]) => ({ header: {} as any, decks: [], setup: [], events, annotations: [], cards: [] });

    // Value: protects=the §16 wording of EFFECT_START / EFFECT_END; fails_when=either line drifts from the spec table; why_new=effects are new; seam=none; no_claim=board summary
    it('renders an effect start and end', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, targets: ['SOR#108', 'SOR#095'], duration: 'phase', text: '+2/+0' },
            { seq: 'R1.A.1b', t: 'EFFECT_START', id: 'fx@2', src: 'SOR#142', p: 2, seat: 1, duration: 'until', untilText: 'Player 1 plays a unit' },
            { seq: 'R1.A.1c', t: 'EFFECT_START', id: 'fx@3', src: 'SOR#108', p: 1, targets: ['base@2'], duration: 'whileSourceInPlay' },
            { seq: 'R1.A.2a', t: 'EFFECT_END', id: 'fx@1', reason: 'targetLeft', targets: ['SOR#095'] },
            { seq: 'R1.A.2b', t: 'EFFECT_END', id: 'fx@2', reason: 'fired' },
            { seq: 'R1.A.2c', t: 'EFFECT_END', id: 'fx@9', reason: 'expired' },
        ]), nm).split('\n');
        expect(out).toEqual([
            '       ↳ Player 1: Bold Resistance — +2/+0 on Wampa · Battlefield Marine (for this phase)',
            '       ↳ Player 2: Bold Resistance for Player 1 (until Player 1 plays a unit)',
            '       ↳ Player 1: Wampa on Player 2\'s base (while Wampa is in play)',
            '       ↳ Effect from Bold Resistance ends on Battlefield Marine (its target changed zone)',
            '       ↳ Effect from Bold Resistance ends (it resolved)',
            '       ↳ Effect fx@9 ends (expired)',
        ]);
    });

    // Value: protects=icon markup in EFFECT_START.text never reaches the plain-text story (§16); fails_when=text is printed raw; why_new=fix round 1; seam=none; no_claim=none
    it('prints an effect text\'s icon markup as plain text', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, targets: ['SOR#108'], duration: 'phase',
                text: 'gains {keyword:sentinel} and {keyword:raid:2}, costs {resource:1} less, :aggression::heroism:' },
        ]), nm);
        expect(out).toBe('       ↳ Player 1: Bold Resistance — gains Sentinel and Raid 2, costs 1 resource less, Aggression Heroism on Wampa (for this phase)');
    });

    // Value: protects=a player-wide effect on both players reads as one (§10.1 seat, §16); fails_when=seat both prints nothing or a seat; why_new=final review item 15; seam=none; no_claim=none
    it('renders an effect on both players', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, seat: 'both', duration: 'phase' },
        ]), nm);
        expect(out).toBe('       ↳ Player 1: Bold Resistance for both players (for this phase)');
    });

    // Value: protects=an effect's text and untilText are cut like a card name, so a file cannot grow the story (§16, §23); fails_when=either is printed in full; why_new=final review: NAME was cut and these were not; seam=none; no_claim=none
    it('cuts a long effect text and untilText as it cuts a card name', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'EFFECT_START', id: 'fx@1', src: 'SOR#142', p: 1, targets: ['SOR#108'], duration: 'until',
                text: 't'.repeat(200), untilText: 'u'.repeat(200) },
        ]), nm);
        expect(out).toBe(`       ↳ Player 1: Bold Resistance — ${'t'.repeat(119)}… on Wampa (until ${'u'.repeat(119)}…)`);
    });
});

describe('render looks, names, used-by and simultaneous groups', () => {
    const nm = { nameOf: (id: string) => ({ 'SOR#142': 'Bold Resistance', 'SOR#108': 'Wampa', 'SOR#095': 'Battlefield Marine', 'SOR#200': 'Chimaera' }[id] ?? id) };
    const doc = (events: any[]) => ({ header: {} as any, decks: [], setup: [], events, annotations: [], cards: [] });

    // Value: protects=the §16 wording of LOOK; fails_when=the line drifts from the spec table, or the cards are not listed; why_new=LOOK is new; seam=none; no_claim=perspective redaction
    it('renders a look', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'LOOK', p: 1, owner: 2, zone: 'deck', cards: ['SOR#108', 'SOR#095', 'SOR#142'], count: 3 },
            { seq: 'R1.A.1b', t: 'LOOK', p: 2, owner: 2, zone: 'hand', cards: ['SOR#108'], count: 1 },
            { seq: 'R1.A.1c', t: 'LOOK', p: 1, owner: 1, zone: 'deck', cards: [], count: 0 },
        ]), nm).split('\n');
        expect(out).toEqual([
            '       ↳ Player 1 looks at 3 cards of Player 2\'s deck: Wampa · Battlefield Marine · Bold Resistance',
            '       ↳ Player 2 looks at 1 card of Player 2\'s hand: Wampa',
            '       ↳ Player 1 looks at 0 cards of Player 1\'s deck',
        ]);
    });

    // Value: protects=the §16 wording of NAME, and that a hostile name is cut like a card name; fails_when=the line drifts, or an unbounded name reaches the story; why_new=NAME is new; seam=none; no_claim=escaping for a medium (§23)
    it('renders a named card', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'NAME', p: 1, name: 'Wampa, Hungry Beast' },
            { seq: 'R1.A.1b', t: 'NAME', p: 2, name: 'x'.repeat(200) },
        ]), nm).split('\n');
        expect(out).toEqual([
            '       ↳ Player 1 names Wampa, Hungry Beast',
            `       ↳ Player 2 names ${'x'.repeat(119)}…`,
        ]);
    });

    // Value: protects=an ability used by another card's ability names that card (CR 7.6.13d, 7.6.14d); fails_when=usedBy is dropped from the line; why_new=usedBy is new; seam=none; no_claim=none
    it('names the card that used an ability', () => {
        const out = render(doc([
            { seq: 'R1.A.1a', t: 'ABILITY_ACTIVATE', p: 1, card: 'SOR#108', kind: 'triggered', usedBy: 'SOR#200' },
        ]), nm);
        expect(out).toBe('       ↳ Wampa uses an ability (used by Chimaera)');
    });

    // Value: protects=ABILITY_RESET is mechanism and prints nothing (§16); fails_when=it renders a line; why_new=fix round 1; seam=none; no_claim=none
    it('prints nothing for an ability reset', () => {
        expect(render(doc([{ seq: 'R1.A.1a', t: 'ABILITY_RESET', card: 'SOR#108', ability: 'a1' }]), nm)).toBe('');
    });

    // Value: protects=a simul group renders exactly as the same records without it, in file order (§16); fails_when=simul reorders, merges or changes a line; why_new=simul is new; seam=none; no_claim=a scrubber's stopping points
    it('keeps a simultaneous group on consecutive lines in file order', () => {
        const records = [
            { seq: 'R1.A.1', t: 'ATTACK', p: 1, atk: 'SOR#108', def: 'SOR#095', defenderType: 'unit' },
            { seq: 'R1.A.1a', t: 'DAMAGE', src: 'SOR#108', tgt: 'SOR#095', amt: 4, damageType: 'combat', hp: -1 },
            { seq: 'R1.A.1b', t: 'DAMAGE', src: 'SOR#095', tgt: 'SOR#108', amt: 3, damageType: 'combat', hp: 2 },
            { seq: 'R1.A.1c', t: 'DEFEAT', card: 'SOR#095', reason: 'attack', defeatedBy: 'SOR#108' },
        ];
        const grouped = records.map((r, i) => (i === 1 || i === 2 ? { ...r, simul: 'R1.A.1a' } : r));
        const plain = render(doc(records), nm);
        expect(render(doc(grouped), nm)).toBe(plain);
        expect(plain.split('\n')).toEqual([
            '  1. Player 1 attacks Battlefield Marine with Wampa',
            '       ↳ 4 damage to Battlefield Marine — -1 HP left',
            '       ↳ 3 damage to Wampa — 2 HP left',
            '       ↳ Battlefield Marine is defeated by Wampa',
        ]);
    });
});

describe('render copies', () => {
    const nm = { nameOf: (id: string) => ({ 'SOR#108': 'Wampa', 'SOR#095': 'Battlefield Marine', 'SOR#200': 'Clone' }[id] ?? id) };
    const doc = (events: any[]) => ({ header: {} as any, decks: [], setup: [], events, annotations: [], cards: [] });
    const seat = (s: 1 | 2, cards: any[] = []) => ({ seat: s, baseHp: 30, baseMaxHp: 30, handSize: 0, hand: [], resourcesReady: 0,
        resourcesExhausted: 0, credits: 0, hasForce: false, discard: [], cards });

    // Value: protects=a unit that is a copy of another (CR 8.5) is named by the copied name, on the board and in the story, until a STATS ends the copy; fails_when=a copy is named by its printed card, or keeps the copied name after it ends; why_new=copyOf and name are new; seam=none; no_claim=escaping for a medium (§23)
    it('a copied unit is named by its copy name', () => {
        const clone = { id: 'SOR#200', zone: 'ground', damage: 0, exhausted: false, upgrades: [], shields: 0, experience: 0, statusTokens: {}, captured: [],
            power: 4, hp: 5, traits: [], copyOf: 'SOR#108', name: 'Wampa, Hungry Beast', cost: 4, aspects: [] };
        const out = render(doc([
            { seq: 'R2.start', t: 'ROUND_START', round: 2, active: 1, keyframe: { round: 2, phase: 'action', initiative: 1, players: { 1: seat(1, [clone]), 2: seat(2) } } },
            { seq: 'R2.A.1', t: 'ATTACK', p: 1, atk: 'SOR#200', def: 'SOR#095', defenderType: 'unit' },
            { seq: 'R2.A.1a', t: 'STATS', card: 'SOR#200', power: 0, hp: 0, traits: [] },
            { seq: 'R2.A.2', t: 'ATTACK', p: 1, atk: 'SOR#200', def: 'SOR#095', defenderType: 'unit' },
            { seq: 'R2.A.2a', t: 'STATS', card: 'SOR#200:2', power: 1, hp: 1, copyOf: 'SOR#095', name: 'x'.repeat(200) },
            { seq: 'R2.A.3', t: 'ATTACK', p: 1, atk: 'SOR#200:2', def: 'SOR#095', defenderType: 'unit' },
        ]), nm).split('\n');
        expect(out).toContain('      ground: Wampa, Hungry Beast 4/5');
        expect(out).toContain('  1. Player 1 attacks Battlefield Marine with Wampa, Hungry Beast');
        expect(out).toContain('  2. Player 1 attacks Battlefield Marine with Clone');
        expect(out).toContain(`  3. Player 1 attacks Battlefield Marine with ${'x'.repeat(119)}… #2`);
    });
});

describe('parse effect records', () => {
    const SAMPLE = fs.readFileSync(path.join(__dirname, 'fixtures/sample-game.swupgn'), 'utf-8');

    // Value: protects=effect records parse into typed events with every field kept; fails_when=parse drops or rewrites a field of EFFECT_START / EFFECT_END; why_new=effects are new; seam=none; no_claim=validation
    it('reads EFFECT_START and EFFECT_END as events', () => {
        const start = '{"seq":"R1.A.1a","t":"EFFECT_START","id":"fx@1","src":"SOR#108","p":1,"targets":["SOR#108"],"duration":"until","untilText":"it attacks","ability":"a1","text":"+2/+0"}';
        const end = '{"seq":"R1.A.2a","t":"EFFECT_END","id":"fx@1","reason":"targetLeft","targets":["SOR#108"]}';
        const doc = parse(SAMPLE.replace(/%%% EVENTS\r?\n/, `%%% EVENTS\n${start}\n${end}\n`));
        expect(doc.events.slice(0, 2)).toEqual([JSON.parse(start), JSON.parse(end)]);
    });
});
