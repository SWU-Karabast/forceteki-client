'use client';

/**
 * Plays the server's animation records over the board: a burst on every card that took damage,
 * a shatter on every unit that was defeated, and a pop on every Shield that absorbed a hit.
 *
 * Records arrive with the gamestate that already shows their result, so the board is never held
 * back waiting for an animation: the damage counter has moved and a defeated unit has left by the
 * time the effect starts. Effects are drawn over the board in a fixed layer that ignores pointer
 * input, and a defeated unit is redrawn there from where it last stood.
 *
 * Records that resolved together (one batch) play together; later batches follow at a short
 * stagger, so a defeat lands after the damage that caused it.
 *
 * A defeated unit's slot in its arena grid stays open while its ghost plays, so the survivors do
 * not slide in underneath it; when the update's effects have mostly played, every slot it held is
 * released at once and the survivors slide over together.
 */
import React, { useCallback, useLayoutEffect, useRef, useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useGame } from '@/app/_contexts/Game.context';
import type { AnimationRecord, IDefeatAnimationRecord } from './cardAnimationTypes';
import {
    capturePreCommitRects,
    clearPreCommitRects,
    getAlias,
    getLiveAnchor,
    getRecentSnapshot,
    holdSlots,
    measureAnchor,
    releaseSlots,
    type IAnchorRect,
    type ICardSnapshot,
} from './cardAnchorRegistry';
import { DAMAGE_BURST_DURATION_MS, DAMAGE_READ_TIME_MS, DamageBurst, shakeElement } from './DamageBurst';
import { DEFEAT_SHATTER_DURATION_MS, DefeatShatter } from './DefeatShatter';
import { SHIELD_BREAK_DURATION_MS, ShieldBreak } from './ShieldBreak';

/** Gap between consecutive batches in one update. */
const BATCH_STAGGER_MS = 360;

/** The whole stagger for one update never runs longer than this, however many batches it has. */
const MAX_STAGGER_SPAN_MS = 1400;

/** How long a defeated unit stands before it breaks when nothing in the same update damaged it. */
const DEFEAT_HOLD_MS = 160;

/** Upper bound on effects in flight, so a flood of records cannot pile up work on the main thread. */
const MAX_EFFECTS = 40;

/**
 * When, relative to each effect's start, the gaps left by defeated units may close. The shatter's
 * tiles are mostly gone by then, and a surviving unit's burst is fading, so its slide does not
 * drag a burst that is still being read.
 */
const SLOTS_CLOSE_AFTER_BREAK_MS = Math.round(DEFEAT_SHATTER_DURATION_MS * 0.65);
const SLOTS_CLOSE_AFTER_BREAK_REDUCED_MS = 420;
const SLOTS_CLOSE_AFTER_DAMAGE_MS = Math.round(DAMAGE_BURST_DURATION_MS * 0.78);
const SLOTS_CLOSE_AFTER_SHIELD_MS = Math.round(SHIELD_BREAK_DURATION_MS * 0.7);

type Effect =
    | { id: number; type: 'damage'; uuid: string; amount: number; delay: number }
    | { id: number; type: 'defeat'; uuid: string; snapshot: ICardSnapshot; breakDelay: number; damage?: { amount: number; delay: number } }
    | { id: number; type: 'shield'; parentUuid: string; delay: number };

/** Turns one update's records into effects, resolving each card against what is on screen now. */
function planEffects(records: AnimationRecord[], nextId: () => number): Effect[] {
    const batchIds = [...new Set(records.map((record) => record.batch))].sort((a, b) => a - b);
    const stagger = batchIds.length > 1 ? Math.min(BATCH_STAGGER_MS, MAX_STAGGER_SPAN_MS / (batchIds.length - 1)) : 0;
    const delayOf = (batch: number) => batchIds.indexOf(batch) * stagger;

    const defeats = new Map<string, IDefeatAnimationRecord>();
    for (const record of records) {
        if (record.kind === 'defeat') {
            defeats.set(record.cardId, record);
        }
    }

    const effects: Effect[] = [];

    // Damage on a card that this same update defeats plays over its ghost, which only exists
    // once the defeat is planned below.
    const damageOnDefeated = new Map<string, { amount: number; delay: number }>();
    for (const record of records) {
        if (record.kind !== 'damage') {
            continue;
        }

        const delay = delayOf(record.batch);
        if (defeats.has(record.cardId) && getRecentSnapshot(record.cardId)) {
            const previous = damageOnDefeated.get(record.cardId);
            damageOnDefeated.set(record.cardId, {
                amount: (previous?.amount ?? 0) + record.amount,
                delay: Math.min(previous?.delay ?? delay, delay),
            });
        } else if (getLiveAnchor(record.cardId)) {
            effects.push({ id: nextId(), type: 'damage', uuid: record.cardId, amount: record.amount, delay });
        }
    }

    for (const defeat of defeats.values()) {
        const snapshot = getRecentSnapshot(defeat.cardId);
        if (snapshot) {
            const damage = damageOnDefeated.get(defeat.cardId);
            const breakDelay = damage
                ? Math.max(delayOf(defeat.batch), damage.delay + DAMAGE_READ_TIME_MS)
                : delayOf(defeat.batch) + DEFEAT_HOLD_MS;
            effects.push({ id: nextId(), type: 'defeat', uuid: defeat.cardId, snapshot, breakDelay, damage });
            continue;
        }

        const alias = getAlias(defeat.cardId);
        if (alias?.kind === 'shield' && getLiveAnchor(alias.parentUuid)) {
            effects.push({ id: nextId(), type: 'shield', parentUuid: alias.parentUuid, delay: delayOf(defeat.batch) });
        }
    }

    return effects;
}

/** ms after an update's effects start at which the gaps its defeated units left may close. */
function slotsCloseAfter(effects: Effect[], reducedMotion: boolean): number {
    let closeAt = 0;
    for (const effect of effects) {
        switch (effect.type) {
            case 'defeat':
                closeAt = Math.max(closeAt, effect.breakDelay + (reducedMotion ? SLOTS_CLOSE_AFTER_BREAK_REDUCED_MS : SLOTS_CLOSE_AFTER_BREAK_MS));
                break;
            case 'damage':
                closeAt = Math.max(closeAt, effect.delay + SLOTS_CLOSE_AFTER_DAMAGE_MS);
                break;
            case 'shield':
                closeAt = Math.max(closeAt, effect.delay + SLOTS_CLOSE_AFTER_SHIELD_MS);
                break;
        }
    }
    return closeAt;
}

/**
 * Measures every card on the board before React changes the DOM for an update that carries
 * animation records. A class component, because `getSnapshotBeforeUpdate` is the one point in a
 * commit at which the DOM still shows the previous update.
 */
class PreCommitMeasure extends React.Component<{ feed: unknown }> {
    public override getSnapshotBeforeUpdate(prevProps: Readonly<{ feed: unknown }>) {
        if (prevProps.feed !== this.props.feed) {
            capturePreCommitRects();
        }
        return null;
    }

    public override componentDidUpdate() {
        clearPreCommitRects();
    }

    public override render() {
        return null;
    }
}

/** Measures a card that is still on the board once its delay has passed, so the effect lands where the card is then. */
function useDelayedAnchor(uuid: string, delay: number, durationMs: number, onDone: () => void, onStart?: (element: HTMLElement) => void) {
    const [target, setTarget] = useState<{ rect: IAnchorRect; borderRadius: string; isBase: boolean } | null>(null);

    useEffect(() => {
        const startTimer = window.setTimeout(() => {
            const anchor = getLiveAnchor(uuid);
            const rect = anchor && measureAnchor(anchor.element);
            if (!anchor || !rect) {
                onDone();
                return;
            }
            onStart?.(anchor.element);
            setTarget({ rect, borderRadius: getComputedStyle(anchor.element).borderRadius, isBase: anchor.info.shape === 'base' });
        }, delay);
        const doneTimer = window.setTimeout(onDone, delay + durationMs + 60);

        return () => {
            window.clearTimeout(startTimer);
            window.clearTimeout(doneTimer);
        };
        // The timers belong to this mount; the callbacks are recreated by the parent on every render.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid, delay, durationMs]);

    return target;
}

interface IEffectProps<T extends Effect['type']> {
    effect: Extract<Effect, { type: T }>;
    reducedMotion: boolean;
    onDone: (id: number) => void;
}

function LiveDamageEffect({ effect, reducedMotion, onDone }: IEffectProps<'damage'>) {
    const target = useDelayedAnchor(
        effect.uuid,
        effect.delay,
        DAMAGE_BURST_DURATION_MS,
        () => onDone(effect.id),
        reducedMotion ? undefined : (element) => shakeElement(element, effect.amount),
    );
    if (!target) {
        return null;
    }
    return (
        <DamageBurst
            rect={target.rect}
            amount={effect.amount}
            borderRadius={target.borderRadius}
            isBase={target.isBase}
            reducedMotion={reducedMotion}
        />
    );
}

function ShieldEffect({ effect, reducedMotion, onDone }: IEffectProps<'shield'>) {
    const target = useDelayedAnchor(
        effect.parentUuid,
        effect.delay,
        SHIELD_BREAK_DURATION_MS,
        () => onDone(effect.id),
        reducedMotion ? undefined : (element) => shakeElement(element, 1),
    );
    if (!target) {
        return null;
    }
    return <ShieldBreak rect={target.rect} borderRadius={target.borderRadius} reducedMotion={reducedMotion}/>;
}

function DefeatEffect({ effect, reducedMotion, onDone }: IEffectProps<'defeat'>) {
    const { snapshot, damage } = effect;
    const [showDamage, setShowDamage] = useState(damage?.delay === 0);

    useEffect(() => {
        if (!damage || damage.delay === 0) {
            return;
        }
        const timer = window.setTimeout(() => setShowDamage(true), damage.delay);
        return () => window.clearTimeout(timer);
    }, [damage]);

    return (
        <>
            <DefeatShatter
                snapshot={snapshot}
                breakDelay={effect.breakDelay}
                reducedMotion={reducedMotion}
                onDone={() => onDone(effect.id)}
            />
            {damage && showDamage && (
                <DamageBurst
                    rect={snapshot.rect}
                    amount={damage.amount}
                    borderRadius={snapshot.borderRadius}
                    reducedMotion={reducedMotion}
                />
            )}
        </>
    );
}

export default function CardAnimationLayer() {
    const { animationFeed } = useGame();
    const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)', { noSsr: true });
    const [effects, setEffects] = useState<Effect[]>([]);

    // Entries already in the feed when the layer mounts (coming back to the board from
    // elsewhere) are history, not news.
    const lastKeyRef = useRef(animationFeed.length > 0 ? animationFeed[animationFeed.length - 1].key : -1);
    const nextIdRef = useRef(0);
    const reducedMotionRef = useRef(reducedMotion);
    reducedMotionRef.current = reducedMotion;

    // Slots this layer is holding open, and the timers that will release them.
    const heldByLayerRef = useRef(new Set<string>());
    const releaseTimersRef = useRef(new Set<number>());

    // A layout effect, so a defeated unit's ghost is drawn in the same frame the unit leaves
    // the board rather than one frame later, which would read as a flicker.
    useLayoutEffect(() => {
        const fresh = animationFeed.filter((entry) => entry.key > lastKeyRef.current);
        if (fresh.length === 0) {
            return;
        }
        lastKeyRef.current = fresh[fresh.length - 1].key;

        const planned = planEffects(fresh.map((entry) => entry.record), () => nextIdRef.current++);
        if (planned.length === 0) {
            return;
        }
        setEffects((prev) => [...prev, ...planned].slice(-MAX_EFFECTS));

        const defeatedUnits = planned.flatMap((effect) =>
            effect.type === 'defeat' && effect.snapshot.slotRect ? [{ uuid: effect.uuid, slotRect: effect.snapshot.slotRect }] : []
        );
        if (defeatedUnits.length > 0) {
            const uuids = defeatedUnits.map((unit) => unit.uuid);
            holdSlots(defeatedUnits);
            uuids.forEach((uuid) => heldByLayerRef.current.add(uuid));

            const timer = window.setTimeout(() => {
                releaseTimersRef.current.delete(timer);
                uuids.forEach((uuid) => heldByLayerRef.current.delete(uuid));
                releaseSlots(uuids);
            }, slotsCloseAfter(planned, reducedMotionRef.current));
            releaseTimersRef.current.add(timer);
        }
    }, [animationFeed]);

    // Leaving the board must not leave holes in it for the next visit.
    useEffect(() => {
        const heldByLayer = heldByLayerRef.current;
        const releaseTimers = releaseTimersRef.current;
        return () => {
            releaseTimers.forEach((timer) => window.clearTimeout(timer));
            releaseTimers.clear();
            releaseSlots([...heldByLayer]);
            heldByLayer.clear();
        };
    }, []);

    const removeEffect = useCallback((id: number) => {
        setEffects((prev) => prev.filter((effect) => effect.id !== id));
    }, []);

    return (
        <Box sx={styles.layer} aria-hidden>
            <PreCommitMeasure feed={animationFeed}/>
            {effects.map((effect) => {
                switch (effect.type) {
                    case 'damage':
                        return <LiveDamageEffect key={effect.id} effect={effect} reducedMotion={reducedMotion} onDone={removeEffect}/>;
                    case 'defeat':
                        return <DefeatEffect key={effect.id} effect={effect} reducedMotion={reducedMotion} onDone={removeEffect}/>;
                    case 'shield':
                        return <ShieldEffect key={effect.id} effect={effect} reducedMotion={reducedMotion} onDone={removeEffect}/>;
                }
            })}
        </Box>
    );
}

// ----------------Styles----------------//

const styles = {
    layer: {
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',

        // Over the board and trays, under popups (which start at 10) so a prompt is never covered.
        zIndex: 9,
    },
};
