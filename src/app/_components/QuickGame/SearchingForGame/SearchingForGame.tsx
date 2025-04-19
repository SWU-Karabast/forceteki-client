import React, { useEffect, useRef, useState } from 'react';
import { Box, Card, Typography } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';

const SearchingForGame: React.FC = () => {
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const { lastQueueHeartbeat } = useGame();
    const router = useRouter();
    const lastQueueHeartbeatState = useRef<number>(0);
    const { user, anonymousUserId } = useUser();

    const checkTimeout = () => {
        timerRef.current = setTimeout(() => {
            const secondsSinceLastHeartbeat = Math.floor((Date.now() - lastQueueHeartbeatState.current) / 1000);

            if (secondsSinceLastHeartbeat > 3) {
                alert(`Connection lost. Please try again.\nUser ID: ${user?.id || anonymousUserId}`);
                router.push('/');
            } else {
                checkTimeout();
            }
        }, 1000);
    }

    useEffect(() => {
        checkTimeout();

        // Cleanup the timer when the component unmounts
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        lastQueueHeartbeatState.current = lastQueueHeartbeat;
    }, [lastQueueHeartbeat]);
    
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

    return (
        <Card sx={styles.searchBox}>
            <Box>
                <video
                    autoPlay
                    loop
                    muted
                    style={{ width: '80px', height: '80px' }} // Adjust sizing/styling as needed
                >
                    <source src="/loader.mp4" type="video/mp4"/>
                    {/* Fallback text if video is not supported */}
                    Your browser does not support the video tag.
                </video>
            </Box>
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