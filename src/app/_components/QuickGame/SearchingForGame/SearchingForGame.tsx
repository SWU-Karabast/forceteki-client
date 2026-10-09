import React, { useEffect, useRef } from 'react';
import { Box, Card, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { MatchmakingPreference, MatchmakingPreferenceLabels } from '@/app/_constants/constants';
import MatchLoader from './MatchLoader';

const preferenceOrder: Record<MatchmakingPreference, readonly MatchmakingPreference[]> = {
    [MatchmakingPreference.CompetitiveTesting]: [
        MatchmakingPreference.CompetitiveTesting,
        MatchmakingPreference.NoPreference,
        MatchmakingPreference.CasualBrewing,
    ],
    [MatchmakingPreference.CasualBrewing]: [
        MatchmakingPreference.CasualBrewing,
        MatchmakingPreference.NoPreference,
        MatchmakingPreference.CompetitiveTesting,
    ],
    [MatchmakingPreference.NoPreference]: [
        MatchmakingPreference.NoPreference,
        MatchmakingPreference.CompetitiveTesting,
        MatchmakingPreference.CasualBrewing,
    ],
};

const styles = {
    searchBox: {
        width: '35rem',
        maxWidth: 'calc(100% - 2rem)',
        minHeight: '15rem',
        backgroundColor: '#000000',
        border: '3px solid #2F2F2F',
        borderRadius: '15px',
        padding: '30px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2,
        gap: '1rem',
    },
    connectingText: {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '700',
        fontSize: '2.0em',
        textAlign: 'center',
    },
    subtext: {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '400',
        fontSize: '1.5em',
        textAlign: 'center',
    },
    preferencePanel: {
        width: '100%',
        maxWidth: '25rem',
        boxSizing: 'border-box',
        backgroundColor: '#101014',
        border: '1px solid #2F2F2F',
        borderRadius: '10px',
        padding: '1rem 1.25rem',
    },
    preferenceHeading: {
        fontWeight: 600,
        marginBottom: '0.75rem',
    },
    preferenceList: {
        listStyle: 'none',
        margin: 0,
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
    },
    preferenceRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    preferenceIcon: {
        width: '1.25rem',
        display: 'flex',
        justifyContent: 'center',
        flexShrink: 0,
    },
    preferenceLabel: {
        marginBottom: 0,
        flex: 1,
    },
    includedIcon: {
        color: 'var(--selection-green)',
        fontSize: '0.75rem',
    },
    excludedIcon: {
        color: 'var(--initiative-red)',
        fontSize: '1.25rem',
    },
    preferenceStatus: {
        color: '#aaa',
        whiteSpace: 'nowrap',
    },
    preferenceHint: {
        color: '#aaa',
        marginTop: '1rem',
    },
};

const SearchingForGame: React.FC = () => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectingRef = useRef(false);
    const { lastQueueHeartbeat, createNewSocket, queueMatchmakingStatus } = useGame();
    const router = useRouter();
    const lastQueueHeartbeatState = useRef<number>(0);
    const { user, anonymousUserId } = useUser();

    useEffect(() => {
        timerRef.current = setInterval(() => {
            const secondsSinceLastHeartbeat = Math.floor((Date.now() - lastQueueHeartbeatState.current) / 1000);

            if (secondsSinceLastHeartbeat > 15) {
                alert(`Connection lost. Please try again.\nUser ID: ${user?.id || anonymousUserId}`);
                router.push('/');
                return;
            }

            if (secondsSinceLastHeartbeat >= 5 && !reconnectingRef.current) {
                reconnectingRef.current = true;
                createNewSocket();

                setTimeout(() => {
                    reconnectingRef.current = false;
                }, 2000);
            }
        }, 1000);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    useEffect(() => {
        lastQueueHeartbeatState.current = lastQueueHeartbeat;
    }, [lastQueueHeartbeat]);

    return (
        <Card sx={styles.searchBox}>
            <MatchLoader sx={{ width: '80px', height: '80px' }} />
            <Box>
                <Typography sx={styles.connectingText}>
                    Connecting
                </Typography>
                <Typography sx={styles.subtext}>
                    Looking for an opponent
                </Typography>
            </Box>
            {queueMatchmakingStatus && (
                <Box component="section" aria-labelledby="matching-preferences-heading" sx={styles.preferencePanel}>
                    <Typography id="matching-preferences-heading" variant="body1" sx={styles.preferenceHeading}>
                        Currently matching
                    </Typography>
                    <Box component="ul" aria-live="polite" sx={styles.preferenceList}>
                        {preferenceOrder[queueMatchmakingStatus.preference].map((preference) => {
                            const included = queueMatchmakingStatus.allowedOpponentPreferences.includes(preference);
                            return (
                                <Box component="li" key={preference} sx={styles.preferenceRow}>
                                    <Box sx={styles.preferenceIcon}>
                                        {included ? (
                                            <FiberManualRecordIcon aria-hidden="true" sx={styles.includedIcon} />
                                        ) : (
                                            <CloseIcon aria-hidden="true" sx={styles.excludedIcon} />
                                        )}
                                    </Box>
                                    <Typography variant="body1" sx={styles.preferenceLabel}>
                                        {MatchmakingPreferenceLabels[preference]}
                                    </Typography>
                                    <Typography variant="body2" sx={styles.preferenceStatus}>
                                        {included ? 'Matching' : 'Not yet'}
                                    </Typography>
                                </Box>
                            );
                        })}
                    </Box>
                    <Typography variant="body2" sx={styles.preferenceHint}>
                        Your opponent&apos;s preferences also apply.
                    </Typography>
                </Box>
            )}
        </Card>
    );
};

export default SearchingForGame;