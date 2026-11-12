/**
 * The hit on a card that took damage: a red flash across the card, a jagged burst over the art
 * showing how much landed, and a spray of sparks. The card itself jolts when it is still on the
 * board.
 *
 * Drawn in the animation layer, not in the card, so it can sit over a card that has already been
 * defeated (the layer passes the defeated card's ghost rect) and is never clipped by the board.
 */
import React, { useId } from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';
import type { IAnchorRect } from './cardAnchorRegistry';

export const DAMAGE_BURST_DURATION_MS = 1150;

/** How long the number holds before a defeat that follows it may start, so it can be read. */
export const DAMAGE_READ_TIME_MS = 480;

const BURST_RED = '#DB131D';
const BURST_RIM = '#4A0006';

/**
 * A jagged burst, as a polygon on a 100-unit square. The uneven spike lengths keep it from
 * reading as a regular star, and they are fixed rather than random so every hit has the same
 * silhouette.
 */
const BURST_POINTS = (() => {
    const spikes = [47, 41, 49, 43, 46, 40, 48, 42, 45, 39, 49, 44];
    const valleyRadius = 31;
    const points: string[] = [];
    spikes.forEach((outer, i) => {
        const peak = (i / spikes.length) * Math.PI * 2 - Math.PI / 2;
        const valley = peak + Math.PI / spikes.length;
        points.push(`${50 + Math.cos(peak) * outer},${50 + Math.sin(peak) * outer}`);
        points.push(`${50 + Math.cos(valley) * valleyRadius},${50 + Math.sin(valley) * valleyRadius}`);
    });
    return points.join(' ');
})();

const SPARK_ANGLES = [8, 52, 96, 141, 187, 229, 274, 318];

const burstPop = keyframes`
    0%   { transform: translate(-50%, -50%) scale(0.3) rotate(-14deg); opacity: 0; }
    11%  { transform: translate(-50%, -50%) scale(1.22) rotate(4deg); opacity: 1; }
    21%  { transform: translate(-50%, -50%) scale(0.95) rotate(-1deg); }
    30%  { transform: translate(-50%, -50%) scale(1) rotate(0deg); }
    72%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -78%) scale(0.88); opacity: 0; }
`;

const burstFade = keyframes`
    0%   { transform: translate(-50%, -50%); opacity: 0; }
    15%  { opacity: 1; }
    75%  { opacity: 1; }
    100% { transform: translate(-50%, -50%); opacity: 0; }
`;

const cardFlash = keyframes`
    0%   { opacity: 0; }
    14%  { opacity: 1; }
    100% { opacity: 0; }
`;

const sparkFly = keyframes`
    0%   { transform: translate(-50%, -100%) rotate(var(--angle)) translateY(0) scaleY(0.4); opacity: 1; }
    60%  { opacity: 1; }
    100% { transform: translate(-50%, -100%) rotate(var(--angle)) translateY(calc(var(--reach) * -1)) scaleY(1); opacity: 0; }
`;

/** Jolts the card the way a struck object recoils. `composite: add` layers it over the card's own transform, such as the tilt of an exhausted unit. */
export function shakeElement(element: HTMLElement, amount: number) {
    if (typeof element.animate !== 'function') {
        return;
    }
    const magnitude = Math.min(7, 2 + amount * 0.7);
    element.animate(
        [
            { transform: 'translate(0, 0)' },
            { transform: `translate(${-magnitude}px, ${magnitude * 0.4}px)` },
            { transform: `translate(${magnitude * 0.8}px, ${-magnitude * 0.3}px)` },
            { transform: `translate(${-magnitude * 0.5}px, ${magnitude * 0.2}px)` },
            { transform: `translate(${magnitude * 0.25}px, 0)` },
            { transform: 'translate(0, 0)' },
        ],
        { duration: 340, easing: 'ease-out', composite: 'add' },
    );
}

interface IDamageBurstProps {
    rect: IAnchorRect;
    amount: number;
    borderRadius?: string;
    isBase?: boolean;
    reducedMotion: boolean;
}

export function DamageBurst({ rect, amount, borderRadius = '0.5rem', isBase = false, reducedMotion }: IDamageBurstProps) {
    // Bases are wide and carry their running total in the middle; a smaller burst over it reads
    // as the hit, then fades to reveal the new total.
    // Every burst on screen needs its own gradient id; useId's colons are not valid in url().
    const gradientId = `damageBurst${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
    const sizeFactor = (isBase ? 0.58 : 0.72) * (amount >= 5 ? 1.12 : 1);
    const size = Math.min(rect.width, rect.height) * sizeFactor;
    const label = `−${amount}`;
    const fontSize = size * (label.length > 2 ? 0.34 : 0.4);

    const styles = {
        root: {
            position: 'fixed',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            pointerEvents: 'none',
        },
        flash: {
            position: 'absolute',
            inset: 0,
            borderRadius,
            background: 'radial-gradient(circle at 50% 50%, rgba(255, 90, 60, 0.15) 0%, rgba(219, 19, 29, 0.5) 62%, rgba(110, 0, 8, 0.78) 100%)',
            boxShadow: `0 0 ${size * 0.25}px ${size * 0.06}px rgba(219, 19, 29, 0.55)`,
            animation: `${cardFlash} ${reducedMotion ? 600 : 480}ms ease-out forwards`,
        },
        burst: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${reducedMotion ? burstFade : burstPop} ${DAMAGE_BURST_DURATION_MS}ms cubic-bezier(0.2, 0.8, 0.3, 1) forwards`,
            filter: 'drop-shadow(0 3px 4px rgba(0, 0, 0, 0.55))',
            willChange: 'transform, opacity',
        },
        burstShape: {
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            overflow: 'visible',
        },
        number: {
            position: 'relative',
            fontFamily: 'var(--font-barlow), Arial, sans-serif',
            fontWeight: 800,
            fontSize,
            lineHeight: 1,
            color: '#FFFFFF',
            WebkitTextStroke: `${Math.max(1, size * 0.025)}px ${BURST_RIM}`,
            paintOrder: 'stroke fill',
            textShadow: `0 ${size * 0.02}px ${size * 0.04}px rgba(0, 0, 0, 0.6)`,
            fontVariantNumeric: 'tabular-nums',
            userSelect: 'none',
        },
        spark: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.max(2, size * 0.055),
            height: size * 0.24,
            borderRadius: '999px',
            transformOrigin: '50% 100%',
            background: 'linear-gradient(to top, rgba(255, 246, 208, 0) 0%, #FF8A3C 45%, #FFF6D0 100%)',
            '--reach': `${size * 0.78}px`,
            animation: `${sparkFly} 420ms cubic-bezier(0.1, 0.7, 0.3, 1) forwards`,
        },
    };

    return (
        <Box sx={styles.root} aria-hidden>
            <Box sx={styles.flash}/>
            {!reducedMotion && SPARK_ANGLES.map((angle) => (
                <Box key={angle} sx={[styles.spark, { '--angle': `${angle}deg` }]}/>
            ))}
            <Box sx={styles.burst}>
                <Box component="svg" viewBox="0 0 100 100" sx={styles.burstShape}>
                    <defs>
                        <radialGradient id={gradientId} cx="42%" cy="38%" r="65%">
                            <stop offset="0" stopColor="#FF4A3D"/>
                            <stop offset="0.55" stopColor={BURST_RED}/>
                            <stop offset="1" stopColor="#8E0710"/>
                        </radialGradient>
                    </defs>
                    <polygon
                        points={BURST_POINTS}
                        fill={`url(#${gradientId})`}
                        stroke={BURST_RIM}
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                    />
                </Box>
                <Box component="span" sx={styles.number}>{label}</Box>
            </Box>
        </Box>
    );
}
