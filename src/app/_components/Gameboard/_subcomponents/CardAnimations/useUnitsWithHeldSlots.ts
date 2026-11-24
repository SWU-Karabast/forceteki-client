import { useLayoutEffect, useRef } from 'react';
import { playPendingSlide, useHeldSlots, type IAnchorRect } from './cardAnchorRegistry';

export type UnitSlot<T> =
    | { kind: 'unit'; uuid: string; card: T }
    | { kind: 'held'; uuid: string; slotRect?: IAnchorRect };

/** Renders after which a unit that has left the grid is forgotten. A held slot is restored on the very next render, so this only bounds memory. */
const FORGET_AFTER_RENDERS = 8;

/**
 * The units of one arena grid, with an empty slot kept in place of each defeated unit whose
 * ghost is still playing. The grid draws the empty slots invisibly, so the units beside them stay
 * put until the slot is released, then slide over.
 *
 * A defeated unit has already left `units` by the time its slot is held, so the hook remembers
 * where each unit sat in this grid and puts the empty slot back at that index.
 */
export function useUnitsWithHeldSlots<T extends { uuid: string }>(units: T[]): UnitSlot<T>[] {
    const held = useHeldSlots();
    const lastIndexRef = useRef(new Map<string, { index: number; render: number }>());
    const renderCountRef = useRef(0);
    const lastIndex = lastIndexRef.current;

    const slots: UnitSlot<T>[] = units.map((card) => ({ kind: 'unit', uuid: card.uuid, card }));
    const present = new Set(units.map((card) => card.uuid));
    const missing = [...held.keys()]
        .filter((uuid) => !present.has(uuid) && lastIndex.has(uuid))
        .sort((a, b) => lastIndex.get(a)!.index - lastIndex.get(b)!.index);
    for (const uuid of missing) {
        const index = Math.min(lastIndex.get(uuid)!.index, slots.length);
        slots.splice(index, 0, { kind: 'held', uuid, slotRect: held.get(uuid) });
    }

    // Recorded after every render, so a unit that has just left still has the index it was drawn at.
    useLayoutEffect(() => {
        const render = ++renderCountRef.current;
        slots.forEach((slot, index) => lastIndex.set(slot.uuid, { index, render }));
        for (const [uuid, entry] of lastIndex) {
            if (render - entry.render > FORGET_AFTER_RENDERS) {
                lastIndex.delete(uuid);
            }
        }
    });

    // Runs after the grid has re-rendered without the released slots.
    useLayoutEffect(() => {
        playPendingSlide();
    }, [held]);

    return slots;
}
