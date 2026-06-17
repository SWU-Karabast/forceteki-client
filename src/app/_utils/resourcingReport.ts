import type { SwuPgnDocument, Seat } from '@/lib/swupgn';
import { baseId } from '@/lib/swupgn';

// Interpreted resourcing report computed from ground-truth events. The engine reads the
// engine's source of truth (MOVE zone transitions) plus explicit PLAY*/DEPLOY_LEADER
// events when present, and a SET#NUM->cost map (public/card-costs.json) for spend/float.
//
// What's exact here vs KaraBuddy's scrape-and-infer: cards resourced/played/drawn per
// round and "drawn but never played" come straight from the event ids; pool comes from
// the round-start keyframe; spend = Σ cost of cards actually played. No re-derivation.

export interface PlayerRoundResourcing {
    seat: Seat;
    round: number;
    // Resources available this round (round-start keyframe resourcesReady+exhausted), or null.
    pool: number | null;
    // Cards committed to the resource zone this round.
    resourced: number;
    // Play actions this round (units/upgrades/events/leader).
    played: number;
    // Sum of cost of cards played this round, or null if no cost data for any play.
    spent: number | null;
    // How many of this round's plays had a known cost (completeness of `spent`).
    costsKnown: number;
    // pool - spent, clamped >=0; null when pool or spent is unknown.
    float: number | null;
    // Flagged when float >= the underspend threshold (resources left unspent).
    underspent: boolean;
    // Cards drawn this round.
    drawn: number;
}

export interface PlayerResourcingSummary {
    seat: Seat;
    totalResourced: number;
    totalPlayed: number;
    totalDrawn: number;
    totalSpent: number;
    // Mean per-round spend/pool over rounds where both are known, or null.
    avgEfficiency: number | null;
    // Exact ids drawn but never played to an arena (held, resourced, or discarded).
    drawnNeverPlayed: string[];
    // Of drawnNeverPlayed, how many were turned into resources.
    resourcedFromHand: number;
}

export interface ResourcingReport {
    rounds: number[];
    byRound: PlayerRoundResourcing[];
    summary: Record<Seat, PlayerResourcingSummary>;
    // True when at least one play cost was resolvable (float/spend meaningful).
    hasCostData: boolean;
}

const ARENA = new Set(['ground', 'space']);
const PLAY_TYPES = new Set(['PLAY', 'PLAY_EVENT', 'PLAY_UPGRADE', 'PLAY_SMUGGLE', 'DEPLOY_LEADER']);
const UNDERSPEND_THRESHOLD = 2;

interface Acc {
    pool: number | null;
    resourced: number;
    played: number;
    spent: number;
    costsKnown: number;
    drawn: number;
}

function emptyAcc(): Acc {
    return { pool: null, resourced: 0, played: 0, spent: 0, costsKnown: 0, drawn: 0 };
}

function costFor(card: string, explicit: number | undefined, costMap: Record<string, number>): number | undefined {
    if (typeof explicit === 'number') return explicit;
    return costMap[baseId(card)];
}

export function resourcingReport(doc: SwuPgnDocument, costMap: Record<string, number> = {}): ResourcingReport {
    const events = doc.events;
    const hasPlayEvents = events.some((e) => PLAY_TYPES.has(e.t));
    const hasMoveEvents = events.some((e) => e.t === 'MOVE');

    // (round,seat) -> accumulator; plus per-seat id sets for drawn/played/resourced.
    const cells = new Map<string, Acc>();
    const roundSet = new Set<number>();
    const drawnIds: Record<Seat, Set<string>> = { 1: new Set(), 2: new Set() };
    const playedIds: Record<Seat, Set<string>> = { 1: new Set(), 2: new Set() };
    const resourcedIds: Record<Seat, Set<string>> = { 1: new Set(), 2: new Set() };
    let costResolved = false;

    let round = 0;
    const cell = (seat: Seat, r: number): Acc => {
        roundSet.add(r);
        const key = `${r}:${seat}`;
        let a = cells.get(key);
        if (!a) { a = emptyAcc(); cells.set(key, a); }
        return a;
    };

    const recordPlay = (seat: Seat, card: string, explicitCost: number | undefined) => {
        const a = cell(seat, round);
        a.played += 1;
        playedIds[seat].add(card);
        const c = costFor(card, explicitCost, costMap);
        if (typeof c === 'number') { a.spent += c; a.costsKnown += 1; costResolved = true; }
    };

    for (const e of events) {
        if (e.t === 'ROUND_START') {
            round = e.round;
            roundSet.add(round);
            if (e.keyframe) {
                for (const seat of [1, 2] as Seat[]) {
                    const ps = e.keyframe.players[seat];
                    if (ps) cell(seat, round).pool = ps.resourcesReady + ps.resourcesExhausted;
                }
            }
            continue;
        }
        switch (e.t) {
            case 'DRAW': {
                const a = cell(e.p, round);
                a.drawn += e.count;
                for (const id of e.cards) drawnIds[e.p].add(id);
                break;
            }
            case 'MOVE': {
                if (e.p == null) break;
                // "Resourced" = a card the player deliberately committed from hand. Cards
                // entering the resource zone from elsewhere (outsideTheGame setup dumps,
                // effects) are not player resourcing decisions and are excluded.
                if (e.to === 'resource' && e.from === 'hand') {
                    cell(e.p, round).resourced += 1;
                    resourcedIds[e.p].add(e.card);
                }
                // MOVE-only logs: a hand->arena move is a unit/upgrade play.
                if (!hasPlayEvents && e.from === 'hand' && ARENA.has(e.to)) {
                    recordPlay(e.p, e.card, undefined);
                }
                break;
            }
            case 'RESOURCE': {
                // Only trust RESOURCE when MOVE isn't the source of truth (no MOVE in log).
                if (!hasMoveEvents) {
                    cell(e.p, round).resourced += 1;
                    resourcedIds[e.p].add(e.card);
                }
                break;
            }
            case 'PLAY': case 'PLAY_EVENT': case 'PLAY_UPGRADE': case 'PLAY_SMUGGLE':
                recordPlay(e.p, e.card, 'cost' in e ? e.cost : undefined);
                break;
            case 'DEPLOY_LEADER':
                recordPlay(e.p, e.card, 'cost' in e ? e.cost : undefined);
                break;
            default:
                break;
        }
    }

    const rounds = [...roundSet].sort((a, b) => a - b);

    const byRound: PlayerRoundResourcing[] = [];
    for (const r of rounds) {
        for (const seat of [1, 2] as Seat[]) {
            const a = cells.get(`${r}:${seat}`);
            if (!a) continue;
            const spent = a.costsKnown > 0 ? a.spent : null;
            const float = a.pool != null && spent != null ? Math.max(0, a.pool - spent) : null;
            byRound.push({
                seat, round: r,
                pool: a.pool, resourced: a.resourced, played: a.played,
                spent, costsKnown: a.costsKnown,
                float, underspent: float != null && float >= UNDERSPEND_THRESHOLD,
                drawn: a.drawn,
            });
        }
    }

    const summary = {} as Record<Seat, PlayerResourcingSummary>;
    for (const seat of [1, 2] as Seat[]) {
        const seatRounds = byRound.filter((b) => b.seat === seat);
        const effRounds = seatRounds.filter((b) => b.pool != null && b.pool > 0 && b.spent != null);
        const avgEfficiency = effRounds.length
            ? effRounds.reduce((s, b) => s + (b.spent! / b.pool!), 0) / effRounds.length
            : null;
        const neverPlayed = [...drawnIds[seat]].filter((id) => !playedIds[seat].has(id));
        summary[seat] = {
            seat,
            totalResourced: seatRounds.reduce((s, b) => s + b.resourced, 0),
            totalPlayed: seatRounds.reduce((s, b) => s + b.played, 0),
            totalDrawn: seatRounds.reduce((s, b) => s + b.drawn, 0),
            totalSpent: seatRounds.reduce((s, b) => s + (b.spent ?? 0), 0),
            avgEfficiency,
            drawnNeverPlayed: neverPlayed,
            resourcedFromHand: neverPlayed.filter((id) => resourcedIds[seat].has(id)).length,
        };
    }

    return { rounds, byRound, summary, hasCostData: costResolved };
}
