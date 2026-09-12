import { describe, it, expect } from 'vitest';
import { slide, lunge, playFlip, exitFade, shake, type Stage, type Snap } from '../animPrimitives';
import { DURATION } from '../replayTiming';

interface Call { el: string; keyframes: Keyframe[]; timing: KeyframeEffectOptions }
function fakeStage(cards: Record<string, boolean> = {}): Stage & { calls: Call[]; hidden: string[]; shown: string[]; timers: number[] } {
    const mk = (tag: string) => ({ tag, style: {} as Record<string, string>, appendChild() {}, replaceChildren() {}, remove() {} } as unknown as HTMLElement & { tag: string });
    const st = {
        rate: 1, calls: [] as Call[], hidden: [] as string[], shown: [] as string[], timers: [] as number[],
        findCard: (u: string) => (cards[u] ? Object.assign(mk('live'), { uuid: u }) : null),
        clone: (snap: Snap) => mk(`clone:${snap.html}`),
        layer: (snap: Snap) => ({ outer: mk(`outer:${snap.html}`), inner: mk(`inner:${snap.html}`) }),
        face: (html: string) => mk(`face:${html}`),
        mount: () => {}, rel: (p: { x: number; y: number }) => ({ left: p.x, top: p.y }),
        hide: (el: HTMLElement | null) => { if (el) st.hidden.push((el as { uuid?: string }).uuid ?? (el as unknown as { tag: string }).tag); },
        show: (el: HTMLElement | null) => { if (el) st.shown.push((el as { uuid?: string }).uuid ?? (el as unknown as { tag: string }).tag); },
        animate: (el: Element, keyframes: Keyframe[], timing: KeyframeEffectOptions, onDone?: () => void) => { st.calls.push({ el: (el as unknown as { tag: string }).tag ?? 'live', keyframes, timing }); onDone?.(); },
        later: (ms: number, fn: () => void) => { st.timers.push(ms); fn(); },
    };
    return st;
}
const snap = (x: number, y: number, w = 100, h = 140, html = 'A'): Snap => ({ x, y, w, h, html });

describe('animPrimitives', () => {
    it('slide clones the destination and translates from the old rect, hiding the live card until it lands', () => {
        const s = fakeStage({ A: true });
        slide(s, { uuid: 'A', from: snap(0, 0), to: snap(200, 50) });
        expect(s.calls).toHaveLength(1);
        expect(s.calls[0].keyframes[0].transform).toBe('translate(-200px, -50px) scale(1, 1)');
        expect(s.calls[0].keyframes[1].transform).toBe('translate(0, 0) scale(1, 1)');
        expect(s.calls[0].timing.duration).toBe(DURATION.slide);
        expect(s.hidden).toEqual(['A']); expect(s.shown).toEqual(['A']);
    });
    it('lunge thrusts 55% of the way to the target on the live node', () => {
        const s = fakeStage({ A: true });
        lunge(s, { uuid: 'A', from: snap(0, 0), to: snap(0, 200) });
        expect(s.calls[0].el).toBe('live');
        expect(s.calls[0].keyframes[1].transform).toBe('translate(0px, 110px) scale(1.08)');
        expect(s.calls[0].timing.duration).toBe(DURATION.lunge);
    });
    it('playFlip slides face-down then swaps the face at the flip midpoint', () => {
        const s = fakeStage({ B: true });
        playFlip(s, { uuid: 'B', from: snap(0, 300, 60, 84, 'BACK'), to: snap(200, 100, 100, 140, 'FRONT'), faceDown: true });
        expect(s.calls.map((c) => c.timing.duration)).toEqual([DURATION.playMove, DURATION.playFlip]);
        expect(s.calls[1].timing.delay).toBe(DURATION.playMove);
        expect(s.timers).toEqual([DURATION.playMove + DURATION.playFlip / 2]);
    });
    it('exitFade shrinks a clone of the old rect', () => {
        const s = fakeStage();
        exitFade(s, { from: snap(10, 10) });
        expect(s.calls[0].el).toBe('clone:A');
        expect(s.calls[0].keyframes[1].opacity).toBe(0);
    });
    it('shake is a damped recoil that returns to rest', () => {
        const s = fakeStage({ A: true });
        shake(s, { uuid: 'A', amplitude: 7 });
        const kf = s.calls[0].keyframes;
        expect(kf[0].transform).toBe('translate(0, 0)');
        expect(kf[kf.length - 1].transform).toBe('translate(0, 0)');
        expect(s.calls[0].timing.duration).toBe(DURATION.shake);
    });
});
