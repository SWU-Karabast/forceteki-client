'use client';
import React, { useState } from 'react';
import { Box, Collapse, Typography } from '@mui/material';
import { AutoAwesomeOutlined, ExpandMore } from '@mui/icons-material';
import { displayText } from '@/lib/swupgn';
import { useReplay } from '@/app/_contexts/Replay.context';

/**
 * The lasting effects in force at this frame, and the limited abilities already spent (spec §11:
 * `effects`, `abilityUses`; writer revision 6). Each line is worded as the story words it.
 *
 * Shown only when there is something in force. A file from before revision 6 records neither
 * (`null` from the context), and absent is "not recorded", so it never reads as "no effects";
 * an empty list at a frame of a newer file shows nothing either, to keep the panel quiet.
 * Every line carries file text (a card name, an effect's `untilText`), so it is rendered as
 * plain React text through displayText, never as HTML (§23).
 */
const ActiveEffects: React.FC = () => {
    const { activeEffects, spentAbilities } = useReplay();
    const [open, setOpen] = useState(true);
    const effects = activeEffects ?? [];
    const spent = spentAbilities ?? [];
    const count = effects.length + spent.length;
    if (count === 0) return null;

    return (
        <Box sx={styles.root}>
            <Box component="button" type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} sx={styles.toggle}>
                <AutoAwesomeOutlined sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={styles.title}>
                    {effects.length > 0 && `${effects.length} active effect${effects.length === 1 ? '' : 's'}`}
                    {effects.length > 0 && spent.length > 0 && ' · '}
                    {spent.length > 0 && `${spent.length} spent abilit${spent.length === 1 ? 'y' : 'ies'}`}
                </Typography>
                <ExpandMore sx={styles.expandIcon(open)} />
            </Box>
            <Collapse in={open}>
                <Box component="ul" sx={styles.list}>
                    {effects.map((fx) => (
                        <Typography key={fx.id} component="li" variant="caption" sx={styles.row}>{displayText(fx.text)}</Typography>
                    ))}
                    {spent.map((u) => (
                        <Typography key={u.key} component="li" variant="caption" sx={styles.spentRow}>
                            Player {u.seat} · {displayText(u.text)}
                        </Typography>
                    ))}
                </Box>
            </Collapse>
        </Box>
    );
};

export default ActiveEffects;

// ----------------Styles----------------//
const styles = {
    root: {
        px: 1.5,
        py: 0.5,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
    },
    toggle: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        width: '100%',
        p: 0,
        border: 0,
        background: 'none',
        cursor: 'pointer',
        color: 'rgba(200,180,255,0.85)',
        textAlign: 'left',
        '&:hover': { filter: 'brightness(1.15)' },
        '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: 2 },
    },
    title: {
        flex: 1,
    },
    expandIcon: (open: boolean) => ({
        fontSize: 16,
        transition: 'transform 0.15s',
        transform: open ? 'rotate(180deg)' : 'none',
    }),
    list: {
        m: 0,
        mt: 0.25,
        pl: 1.5,
        maxHeight: 140,
        overflowY: 'auto',
    },
    row: {
        display: 'list-item',
        color: 'rgba(255,255,255,0.75)',
    },
    spentRow: {
        display: 'list-item',
        color: 'rgba(255,255,255,0.5)',
    },
};
