'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, DeleteOutline } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { listReplays, deleteReplay, StoredReplayMeta } from '@/app/_utils/replayStorage';
import { formatResult } from '@/app/_utils/replayMoves';
import SeekRow from './SeekRow';
import { displayText } from '@/lib/swupgn';

function formatSavedAt(ts: number): string {
    if (!ts) return '';
    try {
        return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
        return '';
    }
}

const RecentReplays: React.FC = () => {
    const router = useRouter();
    const [replays, setReplays] = useState<StoredReplayMeta[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        listReplays()
            .then(setReplays)
            .catch(() => setReplays([]))
            .finally(() => setLoaded(true));
    }, []);

    const handleDelete = async (id: string) => {
        try {
            await deleteReplay(id);
            setReplays((prev) => prev.filter((r) => r.id !== id));
        } catch {
            // ignore — list just won't update
        }
    };

    if (!loaded || replays.length === 0) return null;

    return (
        <Box sx={styles.container}>
            <Typography variant="body2" sx={styles.heading}>
                RECENT REPLAYS
            </Typography>
            <Box sx={styles.list}>
                {replays.map((r) => (
                    // Two sibling controls in one row: the open control covers the title and
                    // meta, and Remove sits beside it rather than inside it, so neither button
                    // is nested in the other.
                    <Box
                        key={r.id}
                        sx={styles.item}
                    >
                        <SeekRow
                            onClick={() => router.push(`/Replay?id=${encodeURIComponent(r.id)}`)}
                            label={`Open replay ${displayText(r.player1)} vs ${displayText(r.player2)}`}
                            sx={styles.openRow}
                        >
                            <PlayArrow sx={styles.playIcon} />
                            <Box sx={styles.details}>
                                <Typography variant="body2" sx={styles.title}>
                                    {displayText(r.player1)} vs {displayText(r.player2)}
                                </Typography>
                                {r.result && (
                                    <Typography variant="caption" sx={styles.result}>
                                        {formatResult(r.result)}
                                    </Typography>
                                )}
                            </Box>
                            {formatSavedAt(r.savedAt) && (
                                <Typography variant="caption" sx={styles.savedAt}>
                                    {formatSavedAt(r.savedAt)}
                                </Typography>
                            )}
                        </SeekRow>
                        <Tooltip title="Remove">
                            <IconButton size="small" aria-label={`Remove replay ${displayText(r.player1)} vs ${displayText(r.player2)}`} onClick={() => handleDelete(r.id)} sx={styles.removeButton}>
                                <DeleteOutline fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </Box>
                ))}
            </Box>
        </Box>
    );
};

export default RecentReplays;

// ----------------Styles----------------//
const styles = {
    container: {
        mt: 1,
    },
    heading: {
        color: 'rgba(255,255,255,0.5)',
        fontWeight: 700,
        letterSpacing: '0.04em',
        mb: 1,
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: 0.5,
        maxHeight: 220,
        overflowY: 'auto',
    },
    item: {
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        pr: 1.25,
        borderRadius: '6px',
        backgroundColor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        '&:hover': { backgroundColor: 'rgba(0,186,255,0.1)', borderColor: 'rgba(0,186,255,0.3)' },
    },
    openRow: {
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        pl: 1.25,
        pr: 0.5,
        py: 0.75,
        borderRadius: '6px',
    },
    playIcon: {
        color: 'var(--initiative-blue)',
        fontSize: '1.1rem',
    },
    details: {
        flex: 1,
        minWidth: 0,
    },
    title: {
        color: 'white',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
    result: {
        color: 'rgba(255,255,255,0.45)',
    },
    savedAt: {
        color: 'rgba(255,255,255,0.35)',
        whiteSpace: 'nowrap',
    },
    removeButton: {
        color: 'rgba(255,255,255,0.35)',
        '&:hover': { color: '#f44336' },
    },
};
