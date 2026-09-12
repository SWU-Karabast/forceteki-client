import type { GameEvent, ReducedState, Seat } from '@/lib/swupgn';
import { baseId, isSeat } from '@/lib/swupgn';
import type { Beat } from './replayBeats';

export type Arena = 'groundArena' | 'spaceArena';
export type Transition =
    | { kind: 'play'; card: string; seat: Seat; to: Arena; token: boolean }
    | { kind: 'upgrade'; card: string; seat: Seat; host: string }
    | { kind: 'event'; card: string; seat: Seat }
    | { kind: 'leaderDeploy'; card: string; seat: Seat; to: Arena; pilotHost?: string }
    | { kind: 'leaderReturn'; card: string; seat: Seat }
    | { kind: 'leaderFlip'; card: string; seat: Seat }
    | { kind: 'attack'; atk: string; def: string; seat: Seat; defenderType: 'unit' | 'base'; survived: boolean }
    | { kind: 'damage'; src?: string; tgt: string; amt: number; hp: number; survived: boolean }
    | { kind: 'baseHit'; seat: Seat; amt: number; hp: number }
    | { kind: 'heal'; tgt: string; amt: number; hp: number }
    | { kind: 'defeat'; card: string; seat: Seat; reason: string; by?: string }
    | { kind: 'resource'; card: string; seat: Seat }
    | { kind: 'draw'; seat: Seat; cards: string[] }
    | { kind: 'discard'; seat: Seat; cards: string[] }
    | { kind: 'capture'; card: string; by?: string }
    | { kind: 'release'; card: string }
    | { kind: 'transfer'; card: string; from: string; to: string }
    | { kind: 'steal'; card: string; to: Seat }
    | { kind: 'badge'; card: string; token: string; delta: number }
    | { kind: 'exhaust'; card: string }
    | { kind: 'ready'; card: string };

const ARENA: Record<string, Arena> = { ground: 'groundArena', space: 'spaceArena' };
const isArena = (z: string | undefined) => z === 'ground' || z === 'space';
const inPlay = (s: ReducedState | undefined, id: string) =>
    !!s && ([1, 2] as Seat[]).some((seat) => s.players[seat]?.cards.some((c) => c.id === id));
const leaderOf = (s: ReducedState, seat: Seat) => s.players[seat]?.leader?.id;
const seatOfCard = (s: ReducedState | undefined, id: string, fallback: Seat | undefined): Seat | undefined => {
    if (!s) return fallback;
    for (const seat of [1, 2] as Seat[]) if (s.players[seat]?.cards.some((c) => c.id === id)) return seat;
    return fallback;
};

/**
 * What moved in a beat, read straight off its records (no text parsing, no board diffing):
 * the writer already says what left where for whom. `prev`/`next` only settle the questions a
 * record can't -- did the target survive, whose card is it, which seat's leader.
 */
export function classifyBeat(beat: Beat, events: GameEvent[], prev: ReducedState | undefined, next: ReducedState): Transition[] {
    const out: Transition[] = [];
    // Every ATTACK filed anywhere in the beat owns its combat damage -- not just one filed as
    // the beat's ANCHOR. A lettered (ability-granted) ATTACK anchors on the ABILITY_ACTIVATE
    // that granted it, so keying off `anchor` alone missed it and let the combat DAMAGE fire
    // its own hit/flash on top of the attack's lunge.
    const attackers = new Set(
        events.slice(beat.start, beat.end + 1)
            .filter((e): e is Extract<GameEvent, { t: 'ATTACK' }> => e.t === 'ATTACK')
            .map((e) => e.atk)
    );
    const deploying = new Set<string>();
    const defeated = new Set<string>();
    for (let i = beat.start; i <= beat.end; i++) {
        const e = events[i];
        switch (e.t) {
            case 'DEPLOY_LEADER': deploying.add(e.card); break;
            case 'DEFEAT': defeated.add(e.card); break;
            default: break;
        }
    }
    for (let i = beat.start; i <= beat.end; i++) {
        const e = events[i];
        const seat: Seat | undefined = 'p' in e && isSeat(e.p) ? e.p : beat.seat;
        switch (e.t) {
            case 'MOVE': {
                const owner = seat ?? seatOfCard(next, e.card, seatOfCard(prev, e.card, undefined));
                if (!owner) break;
                const isLeader = baseId(e.card) === baseId(leaderOf(next, owner) ?? leaderOf(prev ?? next, owner) ?? '');
                if (e.from === 'hand' && isArena(e.to)) {
                    if (e.kind === 'upgrade' && e.attachedTo) out.push({ kind: 'upgrade', card: e.card, seat: owner, host: e.attachedTo });
                    else out.push({ kind: 'play', card: e.card, seat: owner, to: ARENA[e.to], token: false });
                } else if (isArena(e.to) && isLeader) {
                    out.push({ kind: 'leaderDeploy', card: e.card, seat: owner, to: ARENA[e.to], ...(e.attachedTo ? { pilotHost: e.attachedTo } : {}) });
                } else if (isArena(e.from) && isLeader && (e.to === 'base' || e.to === 'leader')) {
                    out.push({ kind: 'leaderReturn', card: e.card, seat: owner });
                } else if (e.from === 'hand' && e.to === 'resource') {
                    out.push({ kind: 'resource', card: e.card, seat: owner });
                } else if (e.from === 'deck' && e.to === 'hand') {
                    out.push({ kind: 'draw', seat: owner, cards: [e.card] });
                } else if (e.from === 'hand' && e.to === 'discard') {
                    out.push({ kind: 'discard', seat: owner, cards: [e.card] });
                } else if (isArena(e.from) && isArena(e.to) && e.from !== e.to) {
                    out.push({ kind: 'transfer', card: e.card, from: ARENA[e.from], to: ARENA[e.to] });
                } else if (isArena(e.from) && e.to === 'capturedZone') {
                    out.push({ kind: 'capture', card: e.card, ...(e.attachedTo ? { by: e.attachedTo } : {}) });
                } else if (e.from === 'capturedZone' && isArena(e.to)) {
                    out.push({ kind: 'release', card: e.card });
                }
                // arena -> discard/outsideTheGame rides with its DEFEAT; a token upgrade leaving rides with its badge.
                break;
            }
            case 'CREATE_TOKEN':
                if (seat && e.kind === 'unit' && isArena(e.zone)) out.push({ kind: 'play', card: e.token, seat, to: ARENA[e.zone], token: true });
                break;
            case 'PLAY_EVENT': if (seat) out.push({ kind: 'event', card: e.card, seat }); break;
            case 'LEADER_FLIP': if (seat) out.push({ kind: 'leaderFlip', card: e.card, seat }); break;
            case 'ATTACK':
                out.push({ kind: 'attack', atk: e.atk, def: e.def, seat: e.p, defenderType: e.defenderType, survived: e.defenderType === 'base' || !defeated.has(e.def) });
                break;
            case 'DAMAGE': {
                const base = /^base@(\d)$/.exec(e.tgt);
                if (base) { out.push({ kind: 'baseHit', seat: Number(base[1]) as Seat, amt: e.amt, hp: e.hp }); break; }
                // Combat damage is drawn by the lunge; anything else is a bolt from its source.
                if (e.damageType === 'combat' && (attackers.has(e.src) || attackers.has(e.tgt))) break;
                out.push({ kind: 'damage', ...(e.src ? { src: e.src } : {}), tgt: e.tgt, amt: e.amt, hp: e.hp, survived: !defeated.has(e.tgt) });
                break;
            }
            case 'OVERWHELM': { const m = /^base@(\d)$/.exec(e.tgt); if (m) out.push({ kind: 'baseHit', seat: Number(m[1]) as Seat, amt: e.amt, hp: e.hp }); break; }
            case 'HEAL': out.push({ kind: 'heal', tgt: e.tgt, amt: e.amt, hp: e.hp }); break;
            case 'DEFEAT': {
                const owner = seatOfCard(prev, e.card, seat);
                if (owner) out.push({ kind: 'defeat', card: e.card, seat: owner, reason: e.reason, ...(e.defeatedBy ? { by: e.defeatedBy } : {}) });
                break;
            }
            case 'DRAW': if (seat) out.push({ kind: 'draw', seat, cards: e.cards }); break;
            case 'DISCARD': if (seat) out.push({ kind: 'discard', seat, cards: e.cards }); break;
            case 'CAPTURE': out.push({ kind: 'capture', card: e.card, ...(e.by ? { by: e.by } : {}) }); break;
            case 'RESCUE': out.push({ kind: 'release', card: e.card }); break;
            case 'TAKE_CONTROL': out.push({ kind: 'steal', card: e.card, to: e.p }); break;
            case 'SHIELD_GAIN': out.push({ kind: 'badge', card: e.card, token: 'shield', delta: e.count ?? 1 }); break;
            case 'SHIELD_USE': out.push({ kind: 'badge', card: e.card, token: 'shield', delta: -(e.count ?? 1) }); break;
            case 'EXPERIENCE_GAIN': out.push({ kind: 'badge', card: e.card, token: 'experience', delta: e.count }); break;
            case 'STATUS_TOKEN': out.push({ kind: 'badge', card: e.card, token: e.token, delta: e.count }); break;
            case 'EXHAUST': if (inPlay(next, e.card) || deploying.has(e.card)) out.push({ kind: 'exhaust', card: e.card }); break;
            case 'READY': if (inPlay(next, e.card)) out.push({ kind: 'ready', card: e.card }); break;
            default: break; // §18: an unknown record moves nothing
        }
    }
    // A leader deploy's MOVE and its DEPLOY_LEADER both name the card; keep one transition.
    return dedupe(out);
}

function dedupe(ts: Transition[]): Transition[] {
    const seen = new Set<string>();
    return ts.filter((t) => { const k = JSON.stringify(t); if (seen.has(k)) return false; seen.add(k); return true; });
}
