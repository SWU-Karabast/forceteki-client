'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography, IconButton, Tooltip } from '@mui/material';
import { PlayArrow, DeleteOutline } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { listReplays, deleteReplay, StoredReplayMeta } from '@/app/_utils/replayStorage';

function formatResult(result: string): string {
    return result.replace(/\bP1\b/g, 'Player 1').replace(/\bP2\b/g, 'Player 2');
}

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

    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        try {
            await deleteReplay(id);
            setReplays((prev) => prev.filter((r) => r.id !== id));
        } catch {
            // ignore — list just won't update
        }
    };

    if (!loaded || replays.length === 0) return null;

    return (
        <Box sx={{ mt: 1 }}>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 700, letterSpacing: '0.04em', mb: 1 }}>
                RECENT REPLAYS
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, maxHeight: 220, overflowY: 'auto' }}>
                {replays.map((r) => (
                    <Box
                        key={r.id}
                        onClick={() => router.push(`/Replay?id=${r.id}`)}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            px: 1.25,
                            py: 0.75,
                            borderRadius: '6px',
                            cursor: 'pointer',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            border: '1px solid rgba(255,255,255,0.08)',
                            '&:hover': { backgroundColor: 'rgba(0,186,255,0.1)', borderColor: 'rgba(0,186,255,0.3)' },
                        }}
                    >
                        <PlayArrow sx={{ color: 'var(--initiative-blue)', fontSize: '1.1rem' }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {r.player1} vs {r.player2}
                            </Typography>
                            {r.result && (
                                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)' }}>
                                    {formatResult(r.result)}
                                </Typography>
                            )}
                        </Box>
                        {formatSavedAt(r.savedAt) && (
                            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap' }}>
                                {formatSavedAt(r.savedAt)}
                            </Typography>
                        )}
                        <Tooltip title="Remove">
                            <IconButton size="small" onClick={(e) => handleDelete(e, r.id)} sx={{ color: 'rgba(255,255,255,0.35)', '&:hover': { color: '#f44336' } }}>
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
