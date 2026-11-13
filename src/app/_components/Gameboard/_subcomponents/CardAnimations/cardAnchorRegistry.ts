/**
 * Where each card on the board is drawn, so the animation layer can play an effect over it.
 *
 * Cards register the element that frames their art. The layer looks a card up by uuid when a
 * record names it. A card that has just left the board (a defeated unit) is already gone from the
 * DOM by the time the layer reads its records, so on unmount each anchor leaves a snapshot of
 * where it was and which image it showed; the layer redraws that snapshot as a ghost and plays the
 * defeat over it.
 *
 * While a defeated unit's ghost plays, its slot in the arena grid is held open (see
 * {@link holdSlots}) so the units beside it stay where they were; once the slot is released they
 * slide over to close the gap.
 *
 * This is module state rather than a context: it holds DOM elements, never renders anything,
 * and the cards that write to it and the layer that reads it sit in different subtrees.
 */
import { useLayoutEffect, useRef, useSyncExternalStore, type RefObject } from 'react';

export type CardAnchorShape = 'unit' | 'base';

export interface ICardAnchorInfo {

    /** The image the card is showing, used to draw its ghost once it has left the board. */
    imageUrl: string;
    shape: CardAnchorShape;
}

export interface IAnchorRect {
    left: number;
    top: number;
    width: number;
    height: number;
}

export interface ICardSnapshot {
    rect: IAnchorRect;

    /** The unit's whole grid cell, art plus upgrade strips. Absent for cards outside an arena grid, such as bases. */
    slotRect?: IAnchorRect;
    info: ICardAnchorInfo;
    borderRadius: string;

    /** `performance.now()` when the anchor unmounted. */
    takenAt: number;
}

interface IAnchorEntry {
    element: HTMLElement;
    info: RefObject<ICardAnchorInfo>;
}

export type CardAliasKind = 'shield';

interface IAliasEntry {
    parentUuid: string;
    kind: CardAliasKind;

    /** Set once the alias stops being rendered; it is kept a little longer so a defeat can still find its parent. */
    removedAt?: number;
}

/** Marks the element that is a unit's cell in an arena grid. The slide that closes a gap moves this element. */
export const UNIT_SLOT_ATTRIBUTE = 'data-unit-slot';

/** How long a snapshot or a removed alias stays usable. Records arrive in the same commit that removes the card, so this only needs to cover a slow frame. */
const STALE_AFTER_MS = 1500;

/** A held slot is released after this long even if nothing releases it, so a lost timer can never leave a hole in the board. */
const MAX_HOLD_MS = 5000;

const SLIDE_DURATION_MS = 300;

const anchors = new Map<string, IAnchorEntry>();
const snapshots = new Map<string, ICardSnapshot>();
const aliases = new Map<string, IAliasEntry>();

function pruneStale(now: number) {
    for (const [uuid, snapshot] of snapshots) {
        if (now - snapshot.takenAt > STALE_AFTER_MS) {
            snapshots.delete(uuid);
        }
    }
    for (const [uuid, alias] of aliases) {
        if (alias.removedAt !== undefined && now - alias.removedAt > STALE_AFTER_MS) {
            aliases.delete(uuid);
        }
    }
}

function toRect(rect: DOMRect): IAnchorRect {
    return { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
}

function slotElementOf(element: HTMLElement): HTMLElement | null {
    return element.closest<HTMLElement>(`[${UNIT_SLOT_ATTRIBUTE}]`);
}

function measureElement(element: HTMLElement | null): IAnchorRect | undefined {
    if (!element?.isConnected) {
        return undefined;
    }
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0 ? toRect(rect) : undefined;
}

// ----------------Pre-commit positions----------------//

/**
 * Every anchor's position as it was before the current commit touched the DOM.
 *
 * Measuring a card while React removes it is not enough: when several units leave one grid in
 * the same commit, they are removed one after another, and each removal shifts the ones after
 * it. The second defeated unit would be measured in the first one's place.
 */
const preCommitRects = new Map<string, { rect: IAnchorRect; slotRect?: IAnchorRect }>();

/** Records where every anchor is. Called before React changes the DOM for a commit that carries animation records. */
export function capturePreCommitRects() {
    preCommitRects.clear();
    for (const [uuid, entry] of anchors) {
        const rect = measureElement(entry.element);
        if (rect) {
            preCommitRects.set(uuid, { rect, slotRect: measureElement(slotElementOf(entry.element)) });
        }
    }
}

/** Forgets the positions taken by {@link capturePreCommitRects} once the commit they describe is done. */
export function clearPreCommitRects() {
    preCommitRects.clear();
}

// ----------------Anchors----------------//

/**
 * Registers the element a card's art is drawn in. Returns the ref to attach to it.
 *
 * Call it unconditionally (it is a hook) and pass `enabled: false` where the card is not on the
 * board, such as in a hand, a popup or the lobby.
 */
export function useCardAnimationAnchor<T extends HTMLElement = HTMLDivElement>(
    uuid: string | undefined,
    info: ICardAnchorInfo,
    enabled: boolean,
): RefObject<T> {
    const ref = useRef<T>(null);
    const infoRef = useRef(info);
    infoRef.current = info;

    useLayoutEffect(() => {
        const element = ref.current;
        if (!enabled || !uuid || !element) {
            return;
        }

        const entry: IAnchorEntry = { element, info: infoRef };
        anchors.set(uuid, entry);

        return () => {
            if (anchors.get(uuid) === entry) {
                anchors.delete(uuid);
            }

            // On unmount React runs this cleanup before it detaches the subtree, so the element is
            // still in the document. Its position may already have shifted, though, if a unit
            // before it left in the same commit, so the position from before the commit wins.
            const before = preCommitRects.get(uuid);
            const rect = before?.rect ?? measureElement(element);
            if (rect) {
                const now = performance.now();
                snapshots.set(uuid, {
                    rect,
                    slotRect: before ? before.slotRect : measureElement(slotElementOf(element)),
                    info: { ...infoRef.current },
                    borderRadius: element.isConnected ? getComputedStyle(element).borderRadius : '0.5rem',
                    takenAt: now,
                });
                pruneStale(now);
            }
        };
    }, [uuid, enabled]);

    return ref;
}

/**
 * Points subcards drawn as part of another card (a unit's Shield tokens) at that card, so an
 * effect on the subcard can be played over its parent.
 */
export function useCardAnimationAliases(parentUuid: string | undefined, childUuids: string[], kind: CardAliasKind, enabled: boolean) {
    const childKey = childUuids.join(',');

    useLayoutEffect(() => {
        if (!enabled || !parentUuid || !childKey) {
            return;
        }

        const children = childKey.split(',');
        for (const child of children) {
            aliases.set(child, { parentUuid, kind });
        }

        return () => {
            const now = performance.now();
            for (const child of children) {
                const alias = aliases.get(child);
                if (alias?.parentUuid === parentUuid) {
                    alias.removedAt = now;
                }
            }
        };
    }, [parentUuid, childKey, kind, enabled]);
}

/** The live element a card is drawn in, if it is on the board. */
export function getLiveAnchor(uuid: string): { element: HTMLElement; info: ICardAnchorInfo } | null {
    const entry = anchors.get(uuid);
    if (!entry || !entry.element.isConnected || !entry.info.current) {
        return null;
    }
    return { element: entry.element, info: entry.info.current };
}

/** Where a card was drawn just before it left the board, if that was recent enough to still be on screen. */
export function getRecentSnapshot(uuid: string): ICardSnapshot | null {
    const snapshot = snapshots.get(uuid);
    if (!snapshot || performance.now() - snapshot.takenAt > STALE_AFTER_MS) {
        return null;
    }
    return snapshot;
}

/** The card a subcard is drawn on, if it is one the registry was told about. */
export function getAlias(uuid: string): { parentUuid: string; kind: CardAliasKind } | null {
    const alias = aliases.get(uuid);
    if (!alias || (alias.removedAt !== undefined && performance.now() - alias.removedAt > STALE_AFTER_MS)) {
        return null;
    }
    return { parentUuid: alias.parentUuid, kind: alias.kind };
}

export function measureAnchor(element: HTMLElement): IAnchorRect | null {
    return measureElement(element) ?? null;
}

// ----------------Held slots----------------//

const EMPTY_HELD: ReadonlyMap<string, IAnchorRect | undefined> = new Map();

/** uuid -> the cell size the unit had, for each defeated unit whose grid slot is being held open. */
const heldSlots = new Map<string, { slotRect?: IAnchorRect; fallbackTimer: number }>();
let heldView: ReadonlyMap<string, IAnchorRect | undefined> = EMPTY_HELD;
const heldListeners = new Set<() => void>();

function publishHeldSlots() {
    heldView = new Map([...heldSlots].map(([uuid, slot]) => [uuid, slot.slotRect]));
    heldListeners.forEach((listener) => listener());
}

/**
 * Keeps each defeated unit's place in its arena grid while its ghost plays there, so the units
 * beside it do not close the gap under the ghost.
 *
 * The layer calls this from a layout effect, so the grid re-renders with the slots restored
 * before the browser paints the frame in which the units left.
 */
export function holdSlots(units: { uuid: string; slotRect?: IAnchorRect }[]) {
    if (units.length === 0) {
        return;
    }
    for (const { uuid, slotRect } of units) {
        const existing = heldSlots.get(uuid);
        if (existing) {
            window.clearTimeout(existing.fallbackTimer);
        }
        heldSlots.set(uuid, { slotRect, fallbackTimer: window.setTimeout(() => releaseSlots([uuid]), MAX_HOLD_MS) });
    }
    publishHeldSlots();
}

/** Lets the grid close the gaps left by these units. The units that move to fill them slide there. */
export function releaseSlots(uuids: string[]) {
    const releasing = uuids.filter((uuid) => heldSlots.has(uuid));
    if (releasing.length === 0) {
        return;
    }
    captureSlideOrigins();
    for (const uuid of releasing) {
        window.clearTimeout(heldSlots.get(uuid)!.fallbackTimer);
        heldSlots.delete(uuid);
    }
    publishHeldSlots();
}

/** The units whose slots are held open, with the cell size each one had. */
export function useHeldSlots(): ReadonlyMap<string, IAnchorRect | undefined> {
    return useSyncExternalStore(
        (listener) => {
            heldListeners.add(listener);
            return () => {
                heldListeners.delete(listener);
            };
        },
        () => heldView,
        () => EMPTY_HELD,
    );
}

// ----------------Closing the gap----------------//

/** Where each unit's cell was just before held slots were released. */
let slideOrigins: Map<HTMLElement, IAnchorRect> | null = null;

function captureSlideOrigins() {
    slideOrigins = new Map();
    for (const entry of anchors.values()) {
        const slot = slotElementOf(entry.element);
        const rect = measureElement(slot);
        if (slot && rect) {
            slideOrigins.set(slot, rect);
        }
    }
}

/**
 * Slides every unit that moved when held slots were released from where it was to where it now
 * is. Call from a layout effect after the grid re-renders; it does nothing if no release is
 * pending, and only the first call after a release plays it.
 */
export function playPendingSlide() {
    const origins = slideOrigins;
    slideOrigins = null;
    if (!origins || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return;
    }

    for (const [slot, from] of origins) {
        const to = measureElement(slot);
        if (!to || typeof slot.animate !== 'function') {
            continue;
        }
        const dx = from.left - to.left;
        const dy = from.top - to.top;
        if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            continue;
        }
        slot.animate(
            [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
            { duration: SLIDE_DURATION_MS, easing: 'cubic-bezier(0.2, 0.8, 0.3, 1)', composite: 'add' },
        );
    }
}
