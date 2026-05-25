'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import TutorialPopup from '@/app/_components/_sharedcomponents/HomePagePlayMode/TutorialPopup';

interface ITimerTutorialPopupProps {
    open: boolean;
    onClose: () => void;
}

const TimerTutorialPopup: React.FC<ITimerTutorialPopupProps> = ({ open, onClose }) => {
    const styles = {
        body: {
            color: '#B4DCEB',
            fontSize: '0.95rem',
            lineHeight: 1.5,
        },
        emphasized: {
            color: '#fff',
            fontWeight: 'bold',
        },
        paragraph: {
            color: '#B4DCEB',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            marginBottom: '12px',
        },
        bulletList: {
            color: '#B4DCEB',
            fontSize: '0.95rem',
            lineHeight: 1.5,
            pl: '20px',
            mb: '12px',
            '& li::marker': { color: '#B4DCEB' },
        },
        imageWrapper: {
            mt: '16px',
            display: 'flex',
            justifyContent: 'center',
        },
        imageContainer: {
            position: 'relative',
            width: 'clamp(240px, 60vw, 480px)',
            height: 'clamp(135px, 34vw, 270px)',
            borderRadius: '8px',
            overflow: 'hidden',
        },
        discordLink: {
            color: 'lightblue',
        },
    } as const;

    return (
        <TutorialPopup
            open={open}
            onClose={onClose}
            titleId="timer-tutorial-dialog-title"
            title="Game Timer Rules"
        >
            <Box sx={styles.body}>
                <Typography component="p" sx={styles.paragraph}>
                    Each player has <Box component="span" sx={styles.emphasized}>20 seconds per action</Box> backed
                    by a <Box component="span" sx={styles.emphasized}>2 minute time bank</Box>. When a player&apos;s
                    20 seconds runs out, their timer begins drawing from their bank. The bank does not refill — if a
                    player&apos;s bank runs out, that player concedes the game.
                </Typography>

                <Typography component="p" sx={styles.paragraph}>
                    Note that this only applies to <Box component="span" sx={styles.emphasized}>public games</Box>.
                    Private games do not have a timer.
                </Typography>
            </Box>

            <Box sx={styles.imageWrapper}>
                <Box sx={styles.imageContainer}>
                    <Image
                        src="/timerexplainer.png"
                        alt="Updated Game Timers"
                        fill
                        style={{ objectFit: 'contain' }}
                    />
                </Box>
            </Box>
        </TutorialPopup>
    );
};

export default TimerTutorialPopup;
