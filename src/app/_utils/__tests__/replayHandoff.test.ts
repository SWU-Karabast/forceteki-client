import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'fs';
import path from 'path';
import { parse, serialize, type GameEvent, type SwuPgnDocument } from '@/lib/swupgn';
import { replayUrl, replayTooHeavy, storeReplayContent } from '../replayHandoff';

describe('replayUrl', () => {
    it('keeps only t/from/to and adds no separator when there are none', () => {
        expect(replayUrl('abc', new URLSearchParams('t=R1.A.2&x=1'))).toBe('/Replay?id=abc&t=R1.A.2');
        expect(replayUrl('abc', new URLSearchParams('from=3&to=9'))).toBe('/Replay?id=abc&from=3&to=9');
        expect(replayUrl('abc', new URLSearchParams(''))).toBe('/Replay?id=abc');
    });
    it('encodes the id and the kept values', () => {
        expect(replayUrl('a b', new URLSearchParams([['t', 'R1 A']]))).toBe('/Replay?id=a%20b&t=R1+A');
    });
});

describe('replayTooHeavy', () => {
    // Value: protects=a small file that keeps a wide board for thousands of records is refused before the viewer builds its frame table, and every real game opens; fails_when=the frameCost check or its budget is dropped from the load paths; why_new=a 400 KB crafted file took 2.7 GB in foldFrames; seam=none; no_claim=the page wiring (FileUpload, ?id= load, storeReplayContent)
    it('refuses a crafted wide-and-long file, and passes every vector', () => {
        const events: GameEvent[] = [];
        for (let i = 0; i < 2000; i++) events.push({ seq: `R1.A.${i}`, t: 'MOVE', card: `SOR#${i}`, from: 'hand', to: 'ground', p: (i % 2) + 1 } as GameEvent);
        for (let i = 0; i < 5000; i++) events.push({ seq: `R1.A.x${i}`, t: 'PASS', p: 1 } as GameEvent);
        const dir = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
        const vector = (f: string) => parse(readFileSync(path.join(dir, f), 'utf8'));
        const first = vector(readdirSync(dir).find((f) => f.endsWith('.swupgn'))!);
        expect(replayTooHeavy({ ...first, events, annotations: [] } as SwuPgnDocument)).toMatch(/too large to show/);
        for (const f of readdirSync(dir).filter((x) => x.endsWith('.swupgn'))) expect(replayTooHeavy(vector(f)), f).toBeNull();
    });
});

describe('replayTooHeavy counts what a card holds, and storeReplayContent refuses before storing', () => {
    const dir = path.join(__dirname, '../../../lib/swupgn/__tests__/fixtures/vectors');
    const first = () => parse(readFileSync(path.join(dir, readdirSync(dir).find((f) => f.endsWith('.swupgn'))!), 'utf8'));

    // Value: protects=a file that piles its width onto ONE host's upgrades (1000 attachments, then hundreds of records) is refused like a wide arena; fails_when=frameSize stops counting a card's upgrades/captured, so the budget sees ~2 ids per frame; why_new=the only heavy fixture is wide in cards[], never in attachments; seam=none; no_claim=the exact budget value
    it('refuses one host carrying a thousand upgrades for many records', () => {
        const events: GameEvent[] = [{ seq: 'R1.A.h', t: 'MOVE', card: 'SOR#host', from: 'hand', to: 'ground', p: 1, kind: 'unit' } as GameEvent];
        for (let i = 0; i < 1000; i++) events.push({ seq: `R1.A.u${i}`, t: 'MOVE', card: `SOR#u${i}`, from: 'hand', to: 'ground', p: 1, kind: 'upgrade', attachedTo: 'SOR#host' } as GameEvent);
        for (let i = 0; i < 3000; i++) events.push({ seq: `R1.A.x${i}`, t: 'PASS', p: 1 } as GameEvent);
        expect(replayTooHeavy({ ...first(), events, annotations: [] } as SwuPgnDocument)).toMatch(/too large to show/);
    });

    // Value: protects=a keyframe carrying a fat field the reader passes through (or a card's statusTokens map) counts at its real size, so it cannot slip a tiny-looking board past the budget; fails_when=frameSize goes back to counting only the known lists; why_new=cycle-2 security review showed that bypass; seam=none; no_claim=what fields the fold should keep
    it('refuses a keyframe whose pass-through field is huge, repeated over many records', () => {
        const seat = (n: number, extra = {}) => ({ seat: n, hand: [], discard: [], cards: [], ...extra });
        const junk = Array.from({ length: 20000 }, (_, i) => i);
        const events: GameEvent[] = [{ seq: 'R1.start', t: 'ROUND_START', round: 1, keyframe: { round: 1, phase: 'action', initiative: 1, players: { 1: seat(1, { junk }), 2: seat(2) } } } as unknown as GameEvent];
        for (let i = 0; i < 400; i++) events.push({ seq: `R1.A.${i}`, t: 'PASS', p: 1 } as GameEvent);
        expect(replayTooHeavy({ ...first(), events, annotations: [] } as SwuPgnDocument)).toMatch(/too large to show/);
    });

    // Value: protects=a too-heavy upload is rejected with the too-large message BEFORE it reaches storage, so Recent Replays never reopens a file that hangs the tab; fails_when=storeReplayContent drops its replayTooHeavy check (the call then reaches generateReplayId/IndexedDB and fails some other way, or stores it); why_new=replayTooHeavy was tested alone, its storeReplayContent wiring was not; seam=none; no_claim=FileUpload and the ?id= page path
    it('storeReplayContent rejects a too-heavy file with the too-large message', async () => {
        const events: GameEvent[] = [];
        for (let i = 0; i < 2000; i++) events.push({ seq: `R1.A.${i + 1}`, t: 'MOVE', card: `SOR#${i}`, from: 'hand', to: 'ground', p: (i % 2) + 1 } as GameEvent);
        for (let i = 0; i < 5000; i++) events.push({ seq: `R1.A.${i + 2001}`, t: 'PASS', p: 1 } as GameEvent);
        const raw = serialize({ ...first(), events, annotations: [] } as SwuPgnDocument);
        expect(parse(raw).events.length).toBe(7000);
        await expect(storeReplayContent(raw)).rejects.toThrow(/too large to show/);
    });
});
