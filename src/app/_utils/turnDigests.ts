import type { SwuPgnDocument, Seat } from '@/lib/swupgn';
import { resourcingReport, type PlayerRoundResourcing } from './resourcingReport';
import { autoBookmarks, type Bookmark } from './replayDecisions';

// Per-turn digest (P3 polish): a round-by-round recap composed from the resourcing engine
// (cards resourced/played/drawn per seat) and the auto-bookmarks (defeats, big damage,
// initiative, game end) that fell in that round. Pure; the UI resolves names and seeks.

export interface TurnDigest {
    round: number;
    // ROUND_START seq for this round, for jump-to navigation (null if not recorded).
    seq: string | null;
    perSeat: Partial<Record<Seat, PlayerRoundResourcing>>;
    bookmarks: Bookmark[];
}

/** Round number embedded in an event seq like "R1.A.3" / "R0.S.9". Null if unparseable. */
export function roundOfSeq(seq: string): number | null {
    const m = /^R(\d+)\./.exec(seq);
    return m ? Number(m[1]) : null;
}

export function turnDigests(doc: SwuPgnDocument): TurnDigest[] {
    const rr = resourcingReport(doc);
    const marks = autoBookmarks(doc);

    const roundStartSeq: Record<number, string> = {};
    for (const e of doc.events) if (e.t === 'ROUND_START') roundStartSeq[e.round] = e.seq;

    const marksByRound = new Map<number, Bookmark[]>();
    for (const m of marks) {
        const r = roundOfSeq(m.seq);
        if (r == null) continue;
        const list = marksByRound.get(r) ?? [];
        list.push(m);
        marksByRound.set(r, list);
    }

    return rr.rounds.map((round) => {
        const perSeat: Partial<Record<Seat, PlayerRoundResourcing>> = {};
        for (const seat of [1, 2] as Seat[]) {
            const row = rr.byRound.find((b) => b.round === round && b.seat === seat);
            if (row) perSeat[seat] = row;
        }
        return {
            round,
            seq: roundStartSeq[round] ?? null,
            perSeat,
            bookmarks: marksByRound.get(round) ?? [],
        };
    });
}
