'use client';
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { decisionPoints, autoBookmarks, bookmarkLabel, type Bookmark } from '@/app/_utils/replayDecisions';
import SeekRow from './SeekRow';
import type { IDecisionRowProps } from './ReplayTypes';

const BOOKMARK_COLOR: Record<Bookmark['kind'], string> = {
    DEFEAT: '#ff6b6b',
    OVERWHELM: '#ff9f43',
    INITIATIVE: '#00baff',
    BIG_DAMAGE: '#ffc857',
    GAME_END: '#39d98a',
};

const Row: React.FC<IDecisionRowProps> = ({ onClick, children }) => (
    <SeekRow
        onClick={onClick}
        sx={styles.row}
    >
        {children}
    </SeekRow>
);

/** Decision points + key moments, rendered inline as a panel tab body. */
const DecisionReview: React.FC = () => {
    const { doc, nameAtSeq, seekToSeq } = useReplay();
    const decisions = useMemo(() => decisionPoints(doc), [doc]);
    const bookmarks = useMemo(() => autoBookmarks(doc), [doc]);

    return (
        <Box sx={styles.container}>
            <Box sx={styles.columns}>
                <Box sx={styles.column}>
                    <Typography variant="subtitle2" sx={styles.heading}>
                        Decision points ({decisions.length})
                    </Typography>
                    {decisions.length === 0 && (
                        <Typography variant="caption" sx={styles.empty}>No recorded choices.</Typography>
                    )}
                    {decisions.map((d) => (
                        <Row key={d.seq} onClick={() => seekToSeq(d.seq)}>
                            <Typography component="span" sx={styles.player}>
                                {d.p}
                            </Typography>
                            <Box sx={styles.decisionBody}>
                                {d.prompt && (
                                    <Typography variant="caption" sx={styles.prompt}>{nameAtSeq(d.prompt, d.seq)}</Typography>
                                )}
                                <Typography variant="body2" sx={styles.rowText}>
                                    {d.offered.map((o, i) => (
                                        <Box
                                            key={i}
                                            component="span"
                                            sx={styles.option(i === d.chose)}
                                        >
                                            {nameAtSeq(o, d.seq)}{i < d.offered.length - 1 ? ' · ' : ''}
                                        </Box>
                                    ))}
                                </Typography>
                            </Box>
                        </Row>
                    ))}
                </Box>
                <Box sx={styles.column}>
                    <Typography variant="subtitle2" sx={styles.heading}>
                        Key moments ({bookmarks.length})
                    </Typography>
                    {bookmarks.length === 0 && (
                        <Typography variant="caption" sx={styles.empty}>No swingy moments flagged.</Typography>
                    )}
                    {bookmarks.map((b, i) => (
                        <Row key={`${b.seq}-${i}`} onClick={() => seekToSeq(b.seq)}>
                            <Box component="span" sx={styles.bookmarkDot(b.kind)} />
                            <Typography variant="body2" sx={styles.rowText}>{bookmarkLabel(b, (id) => nameAtSeq(id, b.seq))}</Typography>
                        </Row>
                    ))}
                </Box>
            </Box>
            <Typography variant="caption" sx={styles.footnote}>
                Click any row to jump to that moment. Chosen option in green.
            </Typography>
        </Box>
    );
};

export default DecisionReview;

// ----------------Styles----------------//
const styles = {
    container: {
        p: 1.5,
    },
    row: {
        display: 'flex', alignItems: 'baseline', gap: 1, px: 1, py: 0.75,
        borderRadius: '4px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
    },
    columns: {
        display: 'flex',
        gap: 3,
        flexWrap: 'wrap',
    },
    column: {
        flex: 1,
        minWidth: 260,
    },
    heading: {
        color: 'white',
        fontWeight: 700,
        mb: 1,
    },
    empty: {
        color: 'rgba(255,255,255,0.4)',
    },
    player: {
        fontSize: { xs: 'max(11px, 0.7rem)', md: '0.7rem' },
        color: 'var(--initiative-blue)',
        fontWeight: 700,
        minWidth: 16,
    },
    decisionBody: {
        flex: 1,
        minWidth: 0,
    },
    prompt: {
        color: 'rgba(255,255,255,0.5)',
        display: 'block',
    },
    rowText: {
        color: 'rgba(255,255,255,0.85)',
    },
    option: (chosen: boolean) => ({
        color: chosen ? '#39d98a' : 'rgba(255,255,255,0.55)',
        fontWeight: chosen ? 700 : 400,
    }),
    bookmarkDot: (kind: Bookmark['kind']) => ({
        width: 8,
        height: 8,
        borderRadius: '50%',
        backgroundColor: BOOKMARK_COLOR[kind],
        mt: 0.6,
    }),
    footnote: {
        color: 'rgba(255,255,255,0.35)',
        display: 'block',
        mt: 2,
    },
};
