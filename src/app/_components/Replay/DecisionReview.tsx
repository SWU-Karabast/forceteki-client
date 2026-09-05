'use client';
import React, { useMemo } from 'react';
import { Box, Typography } from '@mui/material';
import { useReplay } from '@/app/_contexts/Replay.context';
import { decisionPoints, autoBookmarks, bookmarkLabel, type Bookmark } from '@/app/_utils/replayDecisions';
import SeekRow from './SeekRow';

const BOOKMARK_COLOR: Record<Bookmark['kind'], string> = {
    DEFEAT: '#ff6b6b',
    OVERWHELM: '#ff9f43',
    INITIATIVE: '#00baff',
    BIG_DAMAGE: '#ffc857',
    GAME_END: '#39d98a',
};

const Row: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
    <SeekRow
        onClick={onClick}
        sx={{
            display: 'flex', alignItems: 'baseline', gap: 1, px: 1, py: 0.75,
            borderRadius: '4px', '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        }}
    >
        {children}
    </SeekRow>
);

/** Decision points + key moments, rendered inline as a panel tab body. */
const DecisionReview: React.FC = () => {
    const { doc, nameOf, seekToSeq } = useReplay();
    const decisions = useMemo(() => decisionPoints(doc), [doc]);
    const bookmarks = useMemo(() => autoBookmarks(doc), [doc]);

    return (
        <Box sx={{ p: 1.5 }}>
            <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        Decision points ({decisions.length})
                    </Typography>
                    {decisions.length === 0 && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No recorded choices.</Typography>
                    )}
                    {decisions.map((d) => (
                        <Row key={d.seq} onClick={() => seekToSeq(d.seq)}>
                            <Typography component="span" sx={{ fontSize: '0.7rem', color: 'var(--initiative-blue)', fontWeight: 700, minWidth: 16 }}>
                                {d.p}
                            </Typography>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                                {d.prompt && (
                                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>{nameOf(d.prompt)}</Typography>
                                )}
                                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                                    {d.offered.map((o, i) => (
                                        <Box
                                            key={i}
                                            component="span"
                                            sx={{
                                                color: i === d.chose ? '#39d98a' : 'rgba(255,255,255,0.55)',
                                                fontWeight: i === d.chose ? 700 : 400,
                                            }}
                                        >
                                            {nameOf(o)}{i < d.offered.length - 1 ? ' · ' : ''}
                                        </Box>
                                    ))}
                                </Typography>
                            </Box>
                        </Row>
                    ))}
                </Box>
                <Box sx={{ flex: 1, minWidth: 260 }}>
                    <Typography variant="subtitle2" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        Key moments ({bookmarks.length})
                    </Typography>
                    {bookmarks.length === 0 && (
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>No swingy moments flagged.</Typography>
                    )}
                    {bookmarks.map((b, i) => (
                        <Row key={`${b.seq}-${i}`} onClick={() => seekToSeq(b.seq)}>
                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: BOOKMARK_COLOR[b.kind], mt: 0.6 }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>{bookmarkLabel(b, nameOf)}</Typography>
                        </Row>
                    ))}
                </Box>
            </Box>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.35)', display: 'block', mt: 2 }}>
                Click any row to jump to that moment. Chosen option in green.
            </Typography>
        </Box>
    );
};

export default DecisionReview;
