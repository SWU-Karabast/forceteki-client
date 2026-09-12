import type { GameEvent, Seat, NameResolver } from '@/lib/swupgn';
import { NUMBERED_ACTIONS } from './swupgnMoves';
import { frameAction, isPlayerAction } from './replayAction';

/**
 * A beat is one thing a player would say happened: an action with the records the engine
 * filed around it, a seat's resource picks, a draw burst, the regroup ready step, a banner.
 * Stepping and autoplay move by beats; frames stay the unit of state and of deep links.
 *
 * `start..end` are frame indices into the repaired stream; `anchor` is the frame that names
 * the beat (the action record, the last DRAW of a burst) for the caption and the move list.
 */
export type BeatKind = 'setup' | 'banner' | 'action' | 'resource' | 'draw' | 'ready';
export interface Beat { index: number; kind: BeatKind; start: number; end: number; anchor: number; seat?: Seat }
const BANNERS = new Set(['ROUND_START', 'PHASE_START', 'GAME_END']);
const isDraw = (e: GameEvent) => e.t === 'DRAW' || (e.t === 'MOVE' && e.from === 'deck' && e.to === 'hand');
const isReady = (e: GameEvent) => e.t === 'READY' || e.t === 'READY_RESOURCES';
const seatOf = (e: GameEvent): Seat | undefined => ('p' in e && (e.p === 1 || e.p === 2) ? e.p : undefined);
const cardOf = (e: GameEvent) => ('card' in e && typeof e.card === 'string' ? e.card : undefined);
// The seq a lettered consequence points at: `R2.A.6a` -> `R2.A.6`; a bare `R2.A.6` is its own base.
const baseSeq = (seq: string) => { const m = /^(.*?)[a-z]+$/.exec(seq); return m ? m[1] : seq; };
interface Owner { key: string; kind: BeatKind; seat?: Seat; anchor: number }
export function buildBeats(events: GameEvent[]): Beat[] {
    // Frame of every record a `for` or a lettered suffix can point at (spec §9.1): the numbered
    // actions, plus a RESOURCE that stands on its own (setup, regroup) -- a RESOURCE filed as a
    // consequence of an action (an ability that resources a card) rides with that action.
    const actionFrames = new Map<string, number>();
    events.forEach((e, i) => { if (NUMBERED_ACTIONS.has(e.t)) actionFrames.set(e.seq, i); });
    events.forEach((e, i) => { if (e.t === 'RESOURCE' && !actionFrames.has(baseSeq(e.seq))) actionFrames.set(e.seq, i); });
    // A leader's or unit's ACTION or Epic Action ability is the player's action (CR 6.1) and the
    // writer numbers it as one (Part D-2), so it anchors a beat and owns its lettered
    // consequences -- including the draw one of them causes, which would otherwise split off
    // into its own draw beat. On a pre-D-2 file the record is itself lettered under the
    // opponent's PASS; it still gets its own beat here, and the `prev` rule below keeps its
    // siblings with it.
    events.forEach((e, i) => { if (isPlayerAction(e)) actionFrames.set(e.seq, i); });
    const ownerOfAction = (f: number): Owner => ({ key: events[f].seq, kind: events[f].t === 'RESOURCE' ? 'resource' : 'action', seat: seatOf(events[f]), anchor: f });
    // Pass 1: who owns each frame.
    const owners: Owner[] = [];
    let prev: Owner = { key: 'setup', kind: 'setup', anchor: 0 };
    for (let i = 0; i < events.length; i++) {
        const e = events[i];
        const filedFor = typeof e.for === 'string' ? actionFrames.get(e.for) : undefined;
        const suffix = /^(.*?)[a-z]+$/.exec(e.seq);
        const consequenceOf = suffix ? actionFrames.get(suffix[1]) : undefined;
        let o: Owner;
        if (BANNERS.has(e.t)) o = { key: `banner:${e.seq}`, kind: 'banner', anchor: i };
        else if (actionFrames.has(e.seq)) o = ownerOfAction(i);
        else if (filedFor !== undefined) o = ownerOfAction(filedFor);
        // A consequence stays with the beat it is already in when that beat shares its base -- so
        // an action ability's own consequences follow the ability, not the PASS it was filed under.
        else if (consequenceOf !== undefined) o = prev.kind === 'action' && baseSeq(events[prev.anchor].seq) === events[consequenceOf].seq ? prev : ownerOfAction(consequenceOf);
        // A resource MOVE precedes its RESOURCE with no `for` stamp (Part D-3): a record naming the
        // same card as the action right after it is that action's precursor.
        else if (i + 1 < events.length && actionFrames.has(events[i + 1].seq) && cardOf(e) !== undefined && cardOf(e) === cardOf(events[i + 1])) o = ownerOfAction(i + 1);
        else if (isDraw(e)) o = { key: `draw:${i}`, kind: 'draw', seat: seatOf(e), anchor: i };
        else if (isReady(e)) o = { key: `ready:${i}`, kind: 'ready', anchor: i };
        else o = prev; // a SHUFFLE, a SEARCH, a PHASE_END, a ROUND_END rides with what came before, anchor untouched
        owners.push(o); prev = o;
    }
    // Pass 2: consecutive frames with one owner are one beat.
    const beats: Beat[] = [];
    let lastKey = '';
    for (let i = 0; i < owners.length; i++) {
        const o = owners[i];
        if (beats.length && lastKey === o.key) { beats[beats.length - 1].end = i; continue; }
        beats.push({ index: beats.length, kind: o.kind, seat: o.seat, start: i, end: i, anchor: o.anchor });
        lastKey = o.key;
    }
    // Pass 3: runs read as one beat -- a seat's opening resource picks, a draw burst, the regroup ready step.
    const runs = (a: Beat, b: Beat) => a.kind === b.kind && (a.kind === 'ready' || ((a.kind === 'draw' || a.kind === 'resource') && a.seat === b.seat));
    const merged: Beat[] = [];
    for (const b of beats) {
        const last = merged[merged.length - 1];
        if (last && runs(last, b)) { last.end = b.end; last.anchor = b.anchor; continue; }
        merged.push({ ...b, index: merged.length });
    }
    return merged;
}
export function beatAt(beats: Beat[], frame: number): Beat {
    let lo = 0, hi = beats.length - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (beats[mid].end < frame) lo = mid + 1; else hi = mid; }
    return beats[lo];
}

/** What the caption bar says for a whole beat: the anchor's label, plus how many records resolved it. */
export function captionForBeat(b: Beat, events: GameEvent[], names: NameResolver): { label: string; extra: number } {
    return { label: frameAction(events[b.anchor], names).label, extra: b.end - b.start };
}

/** Scrubber landmarks: a round mark per ROUND_START, a phase tick per PHASE_START -- both as
 *  beat indices (the slider now scrubs by beat, not by frame). */
export function chapterMarks(beats: Beat[], events: GameEvent[]): { value: number; label: string; kind: 'round' | 'phase' }[] {
    const out: { value: number; label: string; kind: 'round' | 'phase' }[] = [];
    for (const b of beats) {
        const e = events[b.anchor];
        if (e.t === 'ROUND_START') out.push({ value: b.index, label: `R${e.round}`, kind: 'round' });
        else if (e.t === 'PHASE_START') out.push({ value: b.index, label: e.phase === 'setup' ? 'Setup' : e.phase === 'action' ? 'Action' : 'Regroup', kind: 'phase' });
    }
    return out;
}
