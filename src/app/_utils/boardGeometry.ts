// The MEASUREMENT seam between the live board DOM and the pure animation planner:
// everything `planBeat` needs about where things are on screen, read in one pass
// off a committed frame. Keeping it here (rather than inline in the animator)
// means the selectors Task 4 tagged live in exactly one place.
import type { Seat } from '@/lib/swupgn';
import type { Snap } from './animPrimitives';
import type { Snapshot } from './frameAnimationPlan';

export type { Snapshot };

const rectOf = (el: HTMLElement, html: string): Snap | null => {
    const r = el.getBoundingClientRect();
    return r.width === 0 || r.height === 0 ? null : { x: r.left, y: r.top, w: r.width, h: r.height, html };
};

const esc = (s: string) => (typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(s) : s.replace(/["\\]/g, '\\$&'));

/** The measured rect of an element that is only ever a reference point (no clone). */
export const snapOf = (el: HTMLElement | null): Snap | null => (el ? rectOf(el, '') : null);

export function createBoardGeometry(container: HTMLElement) {
    return {
        measureAll(): Snapshot {
            const m: Snapshot = new Map();
            container.querySelectorAll<HTMLElement>('[data-card-uuid]').forEach((el) => {
                const u = el.getAttribute('data-card-uuid');
                if (!u || m.has(u)) return;                     // first (outermost) wins; clones are cleared before measuring
                const s = rectOf(el, el.outerHTML); if (s) m.set(u, s);
            });
            return m;
        },
        pile(kind: 'resource' | 'discard', playerId: string): Snap | null {
            return snapOf(container.querySelector<HTMLElement>(`[data-testid="${kind}-pile-${esc(playerId)}"]`));
        },
        hidden(playerId: string): Snap[] {
            return [...container.querySelectorAll<HTMLElement>(`[data-card-uuid^="${esc(playerId)}:hand:"]`)].map((el) => rectOf(el, el.outerHTML)).filter((s): s is Snap => !!s);
        },
        arenaBand() {
            const el = container.querySelector<HTMLElement>('[data-testid="gameboard-board-wrapper"]');
            const r = el?.getBoundingClientRect();
            return r ? { top: r.top, bottom: r.bottom } : { top: 0, bottom: 0 };
        },

        /** The two base cards, keyed by seat. A base card renders its SET#NUM id as its
         *  `data-card-uuid`, so the planner's `base@<seat>` has no node of its own to
         *  find: Board lays the opponent's row out first, so the perspective player's
         *  base is the SECOND of the two in DOM order. */
        bases(bottomSeat: Seat): Record<Seat, HTMLElement | null> {
            const els = container.querySelectorAll<HTMLElement>('[data-card-type="base"]');
            const top: Seat = bottomSeat === 1 ? 2 : 1;
            return { [top]: els[0] ?? null, [bottomSeat]: els[1] ?? null } as Record<Seat, HTMLElement | null>;
        },
    };
}
