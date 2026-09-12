import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, fold, foldFrames, normalizeEvents, checkKeyframes, baseId, type ReducedState, type Seat, type CardInstanceState } from '@/lib/swupgn';
import { adaptState, ownerSeatMap } from '../swupgnBoardAdapter';
import { fileIssues, writerGeneration } from '../swupgnFileIssues';
import { entryExhaustByFrame } from '../entryExhaust';

/**
 * Spec §20 vectors, one level up from the fold: the board the viewer renders at the final
 * frame must state every §11 field the vector's `.fold.json` carries. `.fold.json` is the
 * normative board; `adaptState` is what the React board reads. No card data is loaded, so
 * everything asserted here comes from the file alone.
 */
const DIR = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
const VECTORS = readdirSync(DIR).filter((f) => f.endsWith('.swupgn')).map((f) => f.replace(/\.swupgn$/, ''));
const SEATS: Record<Seat, string> = { 1: 'P1', 2: 'P2' };

type Card = Record<string, unknown> & { uuid: string; parentCardId?: string; name?: string; zone: string };

describe.each(VECTORS)('board at the final frame: %s', (name) => {
    const doc = parse(readFileSync(path.join(DIR, `${name}.swupgn`), 'utf-8'));
    const expected = JSON.parse(readFileSync(path.join(DIR, `${name}.fold.json`), 'utf-8')) as ReducedState;
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const last = frames[frames.length - 1];
    // `resourcedIds` is what Replay.context passes: the fold's own `resources` (§11) when the
    // file states one, its MOVE scan otherwise. Without it the row is all face-down.
    const gs = adaptState(last, doc, SEATS, {
        nameOf: (id) => id,
        resourcedIds: { 1: last.players[1]?.resources, 2: last.players[2]?.resources },
    });
    const owners = ownerSeatMap(doc);

    it('folds the repaired stream to the same final board as the raw one', () => {
        expect(last).toEqual(fold(doc.events));
    });

    it.each([1, 2] as Seat[])('seat %i: every scalar of §11 reaches the player object', (seat) => {
        const e = expected.players[seat]!;
        const p = gs.players[SEATS[seat]];
        expect(p.cardPiles.hand.length, 'handSize').toBe(e.handSize);
        expect(p.availableResources, 'resourcesReady').toBe(e.resourcesReady);
        expect(p.cardPiles.resources.length, 'resources total').toBe(e.resourcesReady + e.resourcesExhausted);
        expect(p.cardPiles.credits.length, 'credits').toBe(e.credits);
        expect(p.forceToken.active, 'hasForce').toBe(e.hasForce);
        expect(p.numCardsInDeck, 'deckSize').toBe(e.deckSize);
        expect(p.cardPiles.discard.map((c: Card) => c.uuid), 'discard').toEqual(e.discard);
        // Which cards are in the resource row, when the file states them (§11 `resources`).
        if (Array.isArray(e.resources)) {
            expect(p.cardPiles.resources.map((c: Card) => c.uuid).sort(), 'resources').toEqual([...e.resources].sort());
        }
        // The BASE's Epic Action, a separate ability from the leader's.
        expect(p.base.epicActionSpent, 'baseEpicActionUsed').toBe(e.baseEpicActionUsed || undefined);
        // Only a double-sided leader carries a face; absent must stay absent, never `false`.
        expect(p.leader.onStartingSide, 'leader onStartingSide').toBe(e.leader!.onStartingSide);
        // Base HP: printed max from the keyframe, damage from the absolute hp the file states.
        expect(p.base.hp, 'baseMaxHp').toBe(e.baseMaxHp);
        expect(p.base.damage, 'base damage').toBe(e.baseMaxHp - e.baseHp);
        expect(p.hasInitiative).toBe(expected.initiative === seat);
        // The leader's four flags (§11 LeaderState).
        expect(p.leader.uuid).toBe(e.leader!.id);
        expect(p.leader.zone === 'base', 'leader undeployed').toBe(!e.leader!.deployed);
        expect(!!p.leader.exhausted, 'leader exhausted').toBe(!e.leader!.deployed && e.leader!.exhausted);
        expect(!!p.leader.epicActionSpent, 'epicActionUsed').toBe(e.leader!.epicActionUsed);
    });

    it('initiativeTaken drives the claimed flag', () => {
        expect(gs.initiativeClaimed).toBe(expected.initiativeTaken ?? expected.initiative != null);
        expect(gs.phase).toBe(expected.phase);
    });

    it.each([1, 2] as Seat[])('seat %i: every arena card states its zone, damage, exhaust, stats, keywords, upgrades, tokens and captives', (seat) => {
        const e = expected.players[seat]!;
        const p = gs.players[SEATS[seat]];
        const arena = (z: string): Card[] => (z === 'ground' ? p.cardPiles.groundArena : p.cardPiles.spaceArena);
        const units = [...p.cardPiles.groundArena, ...p.cardPiles.spaceArena].filter((c: Card) => !c.parentCardId) as Card[];
        expect(units.map((c) => c.uuid).sort()).toEqual(e.cards.map((c) => c.id).sort());
        for (const ec of e.cards as CardInstanceState[]) {
            const c = arena(ec.zone).find((x) => x.uuid === ec.id && !x.parentCardId)!;
            expect(c, ec.id).toBeDefined();
            expect(c.damage, `${ec.id} damage`).toBe(ec.damage);
            expect(c.exhausted, `${ec.id} exhausted`).toBe(ec.exhausted);
            expect(c.power, `${ec.id} power`).toBe(ec.power);
            expect(c.hp, `${ec.id} hp`).toBe(ec.hp);
            expect(c.statsReconstructed, `${ec.id} stated, not rebuilt`).toBeUndefined();
            expect(c.keywords ?? [], `${ec.id} keywords`).toEqual(ec.keywords ?? []);
            expect(!!c.sentinel).toBe((ec.keywords ?? []).includes('sentinel'));
            expect(c.controllerId).toBe(SEATS[seat]);
            expect(c.ownerId, `${ec.id} owner`).toBe(SEATS[owners.get(baseId(ec.id)) ?? seat]);
            const attached = arena(ec.zone).filter((x) => x.parentCardId === ec.id);
            const printed = attached.filter((x) => x.type !== 'token').map((x) => x.uuid).sort();
            expect(printed, `${ec.id} upgrades`).toEqual([...ec.upgrades].sort());
            const tokens = attached.filter((x) => x.type === 'token').map((x) => String(x.name).toLowerCase());
            const count = (n: string) => tokens.filter((t) => t === n).length;
            expect(count('shield'), `${ec.id} shields`).toBe(ec.shields);
            expect(count('experience'), `${ec.id} experience`).toBe(ec.experience);
            for (const [token, n] of Object.entries(ec.statusTokens ?? {})) expect(count(token), `${ec.id} ${token}`).toBe(n);
            const held = (p.cardPiles.capturedZone as Card[]).filter((x) => x.parentCardId === ec.id).map((x) => x.uuid).sort();
            expect(held, `${ec.id} captured`).toEqual([...(ec.captured ?? [])].sort());
        }
    });

    it('no token upgrade and no attached card stands in an arena as its own unit', () => {
        for (const seat of [1, 2] as Seat[]) {
            const p = gs.players[SEATS[seat]];
            for (const c of [...p.cardPiles.groundArena, ...p.cardPiles.spaceArena] as Card[]) {
                if (c.parentCardId) continue;
                expect(c.uuid.startsWith('TOKEN:') && c.type === 'token', `${c.uuid} is a bare token upgrade`).toBe(false);
            }
        }
    });

    it('is a clean, current-writer file: FileHealth has nothing to report', () => {
        expect(checkKeyframes(doc.events).mismatches).toEqual([]);
        expect(fileIssues(doc)).toEqual([]);
        expect(writerGeneration(doc)).toEqual([]);
    });
});

describe('a played unit comes in exhausted (minimal vector, spec §10.1 entering EXHAUST)', () => {
    const doc = parse(readFileSync(path.join(DIR, 'minimal.swupgn'), 'utf-8'));
    const events = normalizeEvents(doc.events);
    const frames = foldFrames(events);
    const ahead = entryExhaustByFrame(events);
    const idx = (seq: string) => events.findIndex((e) => e.seq === seq);
    const wampa = (seq: string) => adaptState(frames[idx(seq)], doc, SEATS, { exhaustedIds: [...ahead[idx(seq)]] }).players.P1.cardPiles.groundArena[0];

    it('reads exhausted from its arrival MOVE through the PLAY, then from the fold once the EXHAUST lands', () => {
        // The fold alone shows it ready until R1.A.1a; the look-ahead closes that gap.
        expect(frames[idx('R1.A.1')].players[1]!.cards[0].exhausted).toBe(false);
        for (const seq of ['R1.A.0b', 'R1.A.0c', 'R1.A.1']) expect(wampa(seq).exhausted, seq).toBe(true);
        expect(ahead[idx('R1.A.1a')].size).toBe(0);
        const entered = wampa('R1.A.1a');
        expect(entered.exhausted).toBe(true);
        expect([entered.power, entered.hp, entered.keywords]).toEqual([4, 5, ['overwhelm']]);
        // Readied at regroup, and nothing pending there.
        expect(wampa('R1.G.11').exhausted).toBe(false);
    });
});
