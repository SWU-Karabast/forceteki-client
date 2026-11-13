/**
 * A defeated card breaking apart where it stood.
 *
 * By the time the defeat arrives the card is already gone from the board, so this redraws it from
 * the snapshot its anchor left on unmount: first whole, so the hit that defeated it can play over
 * it, then cracking into tiles that scatter, fall and burn out.
 */
import React, { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import { keyframes } from '@mui/system';
import type { ICardSnapshot } from './cardAnchorRegistry';

export const DEFEAT_SHATTER_DURATION_MS = 820;

const GRID = 4;

const tileScatter = keyframes`
    0%   { transform: translate(0, 0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1); }
    16%  { transform: translate(calc(var(--dx) * 0.12), calc(var(--dy) * 0.12)) rotate(calc(var(--rot) * 0.15)) scale(1); filter: brightness(1.9) saturate(0.5); }
    100% { transform: translate(var(--dx), calc(var(--dy) + var(--fall))) rotate(var(--rot)) scale(0.55); opacity: 0; filter: brightness(0.5) grayscale(1); }
`;

const bloom = keyframes`
    0%   { transform: translate(-50%, -50%) scale(0.35); opacity: 0; }
    18%  { opacity: 0.95; }
    100% { transform: translate(-50%, -50%) scale(1.55); opacity: 0; }
`;

const ghostCrack = keyframes`
    0%   { filter: brightness(1); }
    100% { filter: brightness(1.6) saturate(0.6); }
`;

const ghostFade = keyframes`
    0%   { opacity: 1; }
    100% { opacity: 0; }
`;

interface ITile {
    key: string;
    col: number;
    row: number;
    dx: number;
    dy: number;
    rot: number;
    delay: number;
}

/** Each tile flies away from the card's centre, with some spread so the break looks uneven. */
function buildTiles(width: number, height: number): ITile[] {
    const tiles: ITile[] = [];
    const reach = Math.max(width, height) * 0.55;
    for (let row = 0; row < GRID; row++) {
        for (let col = 0; col < GRID; col++) {
            const cx = (col + 0.5) / GRID - 0.5;
            const cy = (row + 0.5) / GRID - 0.5;
            const angle = Math.atan2(cy, cx) + (Math.random() - 0.5) * 0.7;
            const distance = reach * (0.55 + Math.random() * 0.6);
            tiles.push({
                key: `${row}-${col}`,
                col,
                row,
                dx: Math.cos(angle) * distance,
                dy: Math.sin(angle) * distance,
                rot: (Math.random() - 0.5) * 110,
                delay: Math.random() * 70,
            });
        }
    }
    return tiles;
}

interface IDefeatShatterProps {
    snapshot: ICardSnapshot;

    /** ms after mount at which the card breaks. Until then it is drawn whole. */
    breakDelay: number;
    reducedMotion: boolean;
    onDone: () => void;
}

export function DefeatShatter({ snapshot, breakDelay, reducedMotion, onDone }: IDefeatShatterProps) {
    const { rect, info, borderRadius } = snapshot;
    const [broken, setBroken] = useState(breakDelay <= 0);
    const tiles = useMemo(() => buildTiles(rect.width, rect.height), [rect.width, rect.height]);

    useEffect(() => {
        const breakTimer = window.setTimeout(() => setBroken(true), breakDelay);
        const doneTimer = window.setTimeout(onDone, breakDelay + DEFEAT_SHATTER_DURATION_MS + 120);
        return () => {
            window.clearTimeout(breakTimer);
            window.clearTimeout(doneTimer);
        };
        // onDone is recreated by the parent on every render; the timers belong to this mount only.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [breakDelay]);

    const tileWidth = rect.width / GRID;
    const tileHeight = rect.height / GRID;
    const image = `url("${info.imageUrl}")`;

    const styles = {
        root: {
            position: 'fixed',
            left: rect.left,
            top: rect.top,
            width: rect.width,
            height: rect.height,
            pointerEvents: 'none',
        },
        whole: {
            position: 'absolute',
            inset: 0,
            borderRadius,
            backgroundColor: 'black',
            backgroundImage: image,
            backgroundSize: '100% 100%',
            boxShadow: '0 0 0 2px rgba(0, 0, 0, 0.6)',
            animation: broken && reducedMotion
                ? `${ghostFade} 420ms ease-in forwards`
                : `${ghostCrack} ${Math.max(breakDelay, 1)}ms ease-in forwards`,
        },
        tile: {
            position: 'absolute',
            width: tileWidth + 0.5,
            height: tileHeight + 0.5,
            backgroundImage: image,
            backgroundSize: `${rect.width}px ${rect.height}px`,
            backgroundColor: 'black',
            animation: `${tileScatter} ${DEFEAT_SHATTER_DURATION_MS}ms cubic-bezier(0.15, 0.65, 0.4, 1) forwards`,
            '--fall': `${rect.height * 0.35}px`,
            willChange: 'transform, opacity',
        },
        bloom: {
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: Math.max(rect.width, rect.height) * 1.1,
            aspectRatio: '1',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 244, 214, 0.95) 0%, rgba(255, 128, 48, 0.75) 28%, rgba(219, 19, 29, 0.35) 55%, rgba(219, 19, 29, 0) 72%)',
            mixBlendMode: 'screen',
            animation: `${bloom} 520ms ease-out forwards`,
        },
    };

    if (!broken || reducedMotion) {
        return (
            <Box sx={styles.root} aria-hidden>
                <Box sx={styles.whole}/>
            </Box>
        );
    }

    const cornerRadius = (row: number, col: number) => {
        const top = row === 0;
        const bottom = row === GRID - 1;
        const left = col === 0;
        const right = col === GRID - 1;
        return [
            top && left ? borderRadius : '0',
            top && right ? borderRadius : '0',
            bottom && right ? borderRadius : '0',
            bottom && left ? borderRadius : '0',
        ].join(' ');
    };

    return (
        <Box sx={styles.root} aria-hidden>
            {tiles.map((tile) => (
                <Box
                    key={tile.key}
                    sx={[styles.tile, {
                        left: tile.col * tileWidth,
                        top: tile.row * tileHeight,
                        backgroundPosition: `${-tile.col * tileWidth}px ${-tile.row * tileHeight}px`,
                        borderRadius: cornerRadius(tile.row, tile.col),
                        animationDelay: `${tile.delay}ms`,
                        '--dx': `${tile.dx}px`,
                        '--dy': `${tile.dy}px`,
                        '--rot': `${tile.rot}deg`,
                    }]}
                />
            ))}
            <Box sx={styles.bloom}/>
        </Box>
    );
}
