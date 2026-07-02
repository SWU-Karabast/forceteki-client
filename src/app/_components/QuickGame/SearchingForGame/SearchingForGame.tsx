import React, { useEffect, useRef } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import MatchLoader from './MatchLoader';
import { useErrorRecovery } from '@/app/_contexts/ErrorRecovery.context';
const styles = {
    searchBox: {
        width: '35rem',
        height: '15rem',
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
    }
};

const SearchingForGame: React.FC = () => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const reconnectingRef = useRef(false);
    const { lastQueueHeartbeat, createNewSocket } = useGame();
    const router = useRouter();
    const lastQueueHeartbeatState = useRef<number>(0);
    const connectionLostRef = useRef(false);
    const { user, anonymousUserId } = useUser();
    const { showError } = useErrorRecovery();

    useEffect(() => {
        timerRef.current = setInterval(() => {
            const secondsSinceLastHeartbeat = Math.floor((Date.now() - lastQueueHeartbeatState.current) / 1000);

            if (secondsSinceLastHeartbeat > 15 && !connectionLostRef.current) {
                connectionLostRef.current = true;
                showError({
                    title: 'Connection lost',
                    message: `Connection lost. Please try again.\nUser ID: ${user?.id || anonymousUserId}`,
                    actions: [
                        {
                            label: 'Reconnect',
                            onClick: () => {
                                connectionLostRef.current = false;
                                createNewSocket();
                            },
                            variant: 'warning',
                        },
                        { label: 'Home', onClick: () => router.push('/') },
                    ],
                });
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
    }, [anonymousUserId, createNewSocket, router, showError, user?.id]);

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
        </Card>
    );
};

export default SearchingForGame;
