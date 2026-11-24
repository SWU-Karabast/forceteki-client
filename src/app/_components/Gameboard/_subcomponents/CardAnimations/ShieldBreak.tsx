/**
 * A Shield token popping. The server sends no damage record when a shield absorbs a hit, only
 * the shield's defeat, so without this the attack would land with no visible effect at all.
 *
 * The shield glyph splits down the middle and the halves fall away, under a cyan ring and a
 * flash across the card it protected.
 */
import React from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';
import ShieldIcon from '@/assets/token-icons/shield.svg';
import type { IAnchorRect } from './cardAnchorRegistry';

export const SHIELD_BREAK_DURATION_MS = 760;

const SHIELD_CYAN = '#00A6EC';

const iconPop = keyframes`
    0%   { transform: translate(-50%, -50%) scale(0.5); opacity: 0; }
    22%  { transform: translate(-50%, -50%) scale(1.15); opacity: 1; }
    34%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
    100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
`;

const halfFall = keyframes`
    0%, 36% { transform: translate(0, 0) rotate(0deg); opacity: 1; }
    100%    { transform: translate(var(--drift), 42%) rotate(var(--tilt)); opacity: 0; }
`;

const ring = keyframes`
    0%, 30% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
    40%     { opacity: 0.95; }
    100%    { transform: translate(-50%, -50%) scale(1.9); opacity: 0; }
`;

const flash = keyframes`
    0%, 30% { opacity: 0; }
    42%     { opacity: 1; }
    100%    { opacity: 0; }
`;

const fade = keyframes`
    0%   { opacity: 0; }
    25%  { opacity: 1; }
    100% { opacity: 0; }
`;

interface IShieldBreakProps {
    rect: IAnchorRect;
    borderRadius?: string;
    reducedMotion: boolean;
}

export function ShieldBreak({ rect, borderRadius = '0.5rem', reducedMotion }: IShieldBreakProps) {
    const size = Math.min(rect.width, rect.height) * 0.5;

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
            background: 'radial-gradient(circle at 50% 50%, rgba(0, 166, 236, 0.05) 0%, rgba(0, 166, 236, 0.35) 65%, rgba(0, 90, 140, 0.6) 100%)',
            animation: `${reducedMotion ? fade : flash} ${SHIELD_BREAK_DURATION_MS}ms ease-out forwards`,
        },
        icon: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size,
            height: size,
            animation: `${reducedMotion ? fade : iconPop} ${SHIELD_BREAK_DURATION_MS}ms ease-out forwards`,
            filter: `drop-shadow(0 0 ${size * 0.12}px ${SHIELD_CYAN}) drop-shadow(0 2px 3px rgba(0, 0, 0, 0.6))`,
        },
        half: {
            position: 'absolute',
            inset: 0,
            color: '#FFFFFF',
            animation: reducedMotion ? 'none' : `${halfFall} ${SHIELD_BREAK_DURATION_MS}ms cubic-bezier(0.5, 0, 0.75, 0.6) forwards`,
        },
        glyph: {
            position: 'absolute',
            inset: '18%',
            '& > svg': { width: '100%', height: '100%', display: 'block' },
        },
        plate: {
            position: 'absolute',
            inset: '6%',
            borderRadius: '30%',
            backgroundColor: SHIELD_CYAN,
        },
        ring: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: size * 1.2,
            height: size * 1.2,
            borderRadius: '50%',
            border: `${Math.max(2, size * 0.06)}px solid ${SHIELD_CYAN}`,
            boxShadow: `0 0 ${size * 0.2}px ${SHIELD_CYAN}, inset 0 0 ${size * 0.15}px ${SHIELD_CYAN}`,
            animation: `${ring} ${SHIELD_BREAK_DURATION_MS}ms ease-out forwards`,
        },
    };

    // The two halves are the same plate clipped to its left and right sides, so the glyph
    // stays whole until they separate.
    const halves = [
        { key: 'left', clip: 'inset(0 50% 0 0)', drift: '-26%', tilt: '-24deg' },
        { key: 'right', clip: 'inset(0 0 0 50%)', drift: '26%', tilt: '24deg' },
    ];

    return (
        <Box sx={styles.root} aria-hidden>
            <Box sx={styles.flash}/>
            {!reducedMotion && <Box sx={styles.ring}/>}
            <Box sx={styles.icon}>
                {halves.map((half) => (
                    <Box key={half.key} sx={[styles.half, { clipPath: half.clip, '--drift': half.drift, '--tilt': half.tilt }]}>
                        <Box sx={styles.plate}/>
                        <Box sx={styles.glyph}>
                            <ShieldIcon/>
                        </Box>
                    </Box>
                ))}
            </Box>
        </Box>
    );
}
