// Following the playhead down a panel's list, and nothing else.
//
// The viewer's Moves tab brings the row the board is standing on into view whenever the
// playhead moves. `scrollIntoView` is the obvious way to ask for that and it is the wrong
// one here, because it scrolls EVERY scrollable ancestor of the target — including the
// document itself, if the panel's own scroller isn't the only scrollable box on the page.
// Asking a row for itself would throw the whole board around on every beat advance.
//
// The box that should move is the panel's own scroller — the one the panel already states
// its clearance on. So that is the only box this moves.

/**
 * The panel's own scroll box: the nearest ancestor that scrolls.
 */
export function scrollerFor(el: Element | null): HTMLElement | null {
    for (let up = el?.parentElement; up; up = up.parentElement) {
        const overflow = getComputedStyle(up).overflowY;
        if (overflow === 'auto' || overflow === 'scroll') return up;
    }
    return null;
}

/** A box and the window it is being brought into, both in the same coordinates. */
export interface FollowGeometry {

    /** The target's top and bottom. */
    top: number;
    bottom: number;

    /** The scroller's own window, its `scroll-padding` already taken off. */
    windowTop: number;
    windowBottom: number;
}

/**
 * How far the scroller has to move for `top..bottom` to be inside its window —
 * `block: 'nearest'` semantics, and the whole of the arithmetic, so it can be
 * checked without a browser.
 *
 * Nothing while the target is already whole inside the window. Above it, come up by
 * exactly the shortfall. Below it, go down by exactly the overhang — but never so
 * far that the target's own top leaves the window, which is what a target taller
 * than the window would otherwise do (it would show the reader its last line and
 * hide the entry's identity).
 */
export function followDelta(g: FollowGeometry): number {
    if (g.top < g.windowTop) return g.top - g.windowTop;
    if (g.bottom > g.windowBottom) return Math.min(g.bottom - g.windowBottom, g.top - g.windowTop);
    return 0;
}

/**
 * Bring `target` into its panel's scroller, moving that scroller and nothing above
 * it. A no-op where the target is already whole on screen, so a reader who has
 * scrolled the list away is not fought for entries they can already see.
 */
export function followIntoView(target: Element | null | undefined, smooth = false): void {
    if (!target) return;
    const box = scrollerFor(target);
    if (!box) return;
    const style = getComputedStyle(box);
    const b = target.getBoundingClientRect();
    const s = box.getBoundingClientRect();
    const dy = followDelta({
        top: b.top,
        bottom: b.bottom,
        windowTop: s.top + (parseFloat(style.scrollPaddingTop) || 0),
        windowBottom: s.bottom - (parseFloat(style.scrollPaddingBottom) || 0),
    });
    if (dy === 0) return;
    if (typeof box.scrollBy === 'function') box.scrollBy({ top: dy, behavior: smooth ? 'smooth' : 'auto' });
    else box.scrollTop += dy;
}
