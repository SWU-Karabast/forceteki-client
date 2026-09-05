'use client';
import React, { useMemo, useState } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { VisibilityOffOutlined, VisibilityOutlined } from '@mui/icons-material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { deckByFrame } from '@/app/_utils/deckTracker';
import { useCardCostMap } from '@/app/_utils/swupgnCardCosts';
import { baseId, type Seat } from '@/lib/swupgn';

/**
 * What is left in each deck at this moment, in draw order.
 *
 * The file publishes the starting deck order, so the remaining deck is exact — including
 * what comes next. Upcoming cards are hidden behind a toggle: knowing the next draw is the
 * point when you are studying a decision, and a spoiler when you are just watching.
 */
const PEEK = 5;

const SeatDeck: React.FC<{ seat: Seat; name: string; reveal: boolean }> = ({ seat, name, reveal }) => {
    const { doc, events, currentIndex, nameOf } = useReplay();
    const costs = useCardCostMap();
    const byFrame = useMemo(() => deckByFrame(doc, events), [doc, events]);
    const state = byFrame[currentIndex]?.[seat];
    if (!state) return null;

    const { remaining } = state;
    const counts = new Map<string, number>();
    for (const id of remaining) {
        const b = baseId(id);
        counts.set(b, (counts.get(b) ?? 0) + 1);
    }
    const rows = [...counts].sort((a, b) => nameOf(a[0]).localeCompare(nameOf(b[0])));

    return (
        <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700 }}>{name}</Typography>
            <Typography variant="caption" sx={{ color: 'var(--initiative-blue)', fontWeight: 700 }}>
                {remaining.length} card{remaining.length === 1 ? '' : 's'} left
            </Typography>

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 1, fontWeight: 600 }}>
                Next {Math.min(PEEK, remaining.length)}
            </Typography>
            {remaining.slice(0, PEEK).map((id, i) => (
                <Typography key={`${id}-${i}`} variant="caption" sx={{
                    display: 'block', color: reveal ? 'rgba(255,255,255,0.85)' : 'transparent',
                    textShadow: reveal ? 'none' : '0 0 7px rgba(255,255,255,0.55)',
                    userSelect: reveal ? 'auto' : 'none',
                }}>
                    {i + 1}. {nameOf(id)}
                </Typography>
            ))}
            {remaining.length === 0 && (
                <Typography variant="caption" sx={{ color: 'rgba(255,120,120,0.9)', display: 'block' }}>
                    Deck empty
                </Typography>
            )}

            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block', mt: 1.5, fontWeight: 600 }}>
                Still in deck
            </Typography>
            {rows.map(([id, n]) => (
                <Box key={id} sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {n > 1 ? `${n}× ` : ''}{nameOf(id)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)' }}>
                        {costs[id] != null ? costs[id] : ''}
                    </Typography>
                </Box>
            ))}
        </Box>
    );
};

const DeckTab: React.FC = () => {
    const { header, doc } = useReplay();
    const [reveal, setReveal] = useState(false);
    const hasOrder = useMemo(
        () => doc.setup.some((r) => (r as { t?: string })?.t === 'INIT'),
        [doc],
    );

    if (!hasOrder) {
        return (
            <Box sx={{ p: 1.5 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,200,87,0.9)' }}>
                    This replay carries no starting deck order, so the remaining deck can&apos;t be reconstructed.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 1.5 }}>
            <Box
                role="button"
                tabIndex={0}
                aria-pressed={reveal}
                aria-label={reveal ? 'Hide upcoming draws' : 'Reveal upcoming draws'}
                onClick={() => setReveal((r) => !r)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setReveal((r) => !r); } }}
                sx={{
                    display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer', mb: 1.5,
                    color: reveal ? 'var(--initiative-blue)' : 'rgba(255,255,255,0.6)',
                    '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 },
                }}
            >
                <Tooltip title="The file publishes the full starting deck order, so upcoming draws are exact">
                    {reveal ? <VisibilityOutlined sx={{ fontSize: 16 }} /> : <VisibilityOffOutlined sx={{ fontSize: 16 }} />}
                </Tooltip>
                <Typography variant="caption">{reveal ? 'Upcoming draws shown' : 'Reveal upcoming draws'}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 3 }}>
                <SeatDeck seat={1} name={header.p1 || 'Player 1'} reveal={reveal} />
                <SeatDeck seat={2} name={header.p2 || 'Player 2'} reveal={reveal} />
            </Box>
        </Box>
    );
};

export default DeckTab;
