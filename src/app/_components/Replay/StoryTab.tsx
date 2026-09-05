'use client';
import React, { useMemo, useRef, useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { render } from '@/lib/swupgn';
import { useReplay } from '@/app/_contexts/Replay.context';
import { storySeekIndex, storyLineTargets, roundOf } from '@/app/_utils/storySeek';

/**
 * The game as prose, straight from the file's `%%% STORY` section.
 *
 * The writer ships a complete narrative — real card names, a board summary at every round,
 * and consequences indented under the action that caused them — which is more readable than
 * anything derived from the raw event list.
 *
 * It is NOT parsed. Its wording is advisory and may change between writer versions; only
 * `%%% EVENTS` is the truth. What IS stable is the shape: a numbered line is a player
 * action, an indented `↳` line is a consequence of the line above it, a banner opens a
 * round. That is enough to make the numbered lines clickable, and nothing here breaks if
 * the prose changes — an unrecognised line just renders as text.
 */

const StoryTab: React.FC = () => {
    const { doc, events, currentIndex, seekTo } = useReplay();

    // A pre-1.0 file has no STORY section; render our own so the tab is never empty.
    const lines = useMemo(
        () => (doc.story?.length ? doc.story : render(doc).split('\n')),
        [doc],
    );

    // Frame per story line, keyed the way the story numbers its actions (spec §16): built from
    // EVENTS (the truth), never from the prose.
    const targets = useMemo(() => storyLineTargets(lines, storySeekIndex(events)), [lines, events]);

    const currentRound = useMemo(() => {
        for (let i = currentIndex; i >= 0; i--) {
            const e = events[i];
            if (e?.t === 'ROUND_START') return e.round;
        }
        return 0;
    }, [events, currentIndex]);

    const activeRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        activeRef.current?.scrollIntoView({ block: 'nearest' });
    }, [currentRound]);

    return (
        <Box sx={{ p: 1.5 }}>
            <Box
                component="pre"
                aria-label="Game story"
                sx={{
                    m: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    fontSize: '0.72rem', lineHeight: 1.5, whiteSpace: 'pre',
                    overflowX: 'auto', color: 'rgba(255,255,255,0.8)',
                }}
            >
                {lines.map((line, i) => {
                    const r = roundOf(line);
                    const target = targets[i];
                    const isCurrentRound = r != null && r === currentRound;

                    if (target == null) {
                        return <Box key={i} component="div" sx={{ color: line.trimStart().startsWith('↳') ? 'rgba(255,255,255,0.5)' : undefined }}>{line || ' '}</Box>;
                    }
                    return (
                        <Box
                            key={i}
                            ref={isCurrentRound ? activeRef : undefined}
                            component="div"
                            role="button"
                            tabIndex={0}
                            onClick={() => seekTo(target)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); seekTo(target); } }}
                            sx={{
                                cursor: 'pointer', borderRadius: '3px',
                                backgroundColor: target === currentIndex ? 'rgba(255,255,255,0.12)' : 'transparent',
                                '&:hover': { backgroundColor: 'rgba(255,255,255,0.07)' },
                                '&:focus-visible': { outline: '2px solid var(--selection-blue)', outlineOffset: '-2px' },
                            }}
                        >
                            {line || ' '}
                        </Box>
                    );
                })}
            </Box>
            {!doc.story?.length && (
                <Typography variant="caption" sx={{ color: 'rgba(255,200,87,0.9)', display: 'block', mt: 1.5 }}>
                    This replay predates the story section — showing a narrative rebuilt from the events.
                </Typography>
            )}
        </Box>
    );
};

export default StoryTab;
