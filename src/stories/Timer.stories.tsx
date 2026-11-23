import React, { useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs';
import { Box, Button, GlobalStyles, Stack, Typography } from '@mui/material';
import Timer from '@/app/_components/_sharedcomponents/Timer/Timer';
import MainTimerLabel from '@/app/_components/_sharedcomponents/Timer/MainTimerLabel';
import { IMainTimeGrantAnimation, MAIN_TIME_GRANT_ANIMATION_MS, MAX_TURN_TIME } from '@/app/_components/_sharedcomponents/Timer/timerUtils';

type GrantStyle = 'label' | 'ring' | 'both';

interface MainTimeGrantPreviewProps {
    playerFromSeconds: number;
    playerGrantSeconds: number;
    opponentFromSeconds: number;
    opponentGrantSeconds: number;
    turnTimeRemainingSeconds: number;
}

const grantOf = (round: number, fromSeconds: number, seconds: number): IMainTimeGrantAnimation | null =>
    seconds > 0 ? { round, seconds, fromMs: fromSeconds * 1000, toMs: (fromSeconds + seconds) * 1000 } : null;

/** The game timer as a new round starts, showing the main time the end of the last round gave back, in each style. */
const MainTimeGrantPreview: React.FC<MainTimeGrantPreviewProps> = ({
    playerFromSeconds,
    playerGrantSeconds,
    opponentFromSeconds,
    opponentGrantSeconds,
    turnTimeRemainingSeconds,
}) => {
    const [round, setRound] = useState(1);
    const [showing, setShowing] = useState(true);

    // each grant is shown for as long as the game timer shows one, and the story drops it after that, as the game does
    useEffect(() => {
        if (!showing) {
            return;
        }
        const timeout = setTimeout(() => setShowing(false), MAIN_TIME_GRANT_ANIMATION_MS);
        return () => clearTimeout(timeout);
    }, [round, showing]);

    const replay = () => {
        setRound((current) => current + 1);
        setShowing(true);
    };

    const playerGrant = showing ? grantOf(round, playerFromSeconds, playerGrantSeconds) : null;
    const opponentGrant = showing ? grantOf(round, opponentFromSeconds, opponentGrantSeconds) : null;
    const turnTimeMs = turnTimeRemainingSeconds * 1000;

    return (
        <Stack spacing={3} alignItems="center">
            <Stack direction="row" spacing={6}>
                {(['label', 'ring', 'both'] as GrantStyle[]).map((style) => (
                    <Stack key={style} spacing={1} alignItems="center">
                        <Timer
                            activeTurn="player"
                            isTurnTime
                            isRunning={false}
                            maxTime={MAX_TURN_TIME}
                            timeRemaining={turnTimeMs}
                            setTimeRemaining={() => undefined}
                            grantOverlay={style === 'label' ? null : playerGrant}
                            tooltipTitle={style}
                        >
                            <MainTimerLabel
                                playerIsActive
                                playerIsTurnTime
                                playerTimeRemaining={(playerFromSeconds + playerGrantSeconds) * 1000}
                                opponentTimeRemaining={(opponentFromSeconds + opponentGrantSeconds) * 1000}
                                playerGrant={style === 'ring' ? null : playerGrant}
                                opponentGrant={style === 'ring' ? null : opponentGrant}
                            />
                        </Timer>
                        <Typography variant="body2" sx={{ color: 'white' }}>{style}</Typography>
                    </Stack>
                ))}
            </Stack>
            <Button variant="contained" onClick={replay}>Replay</Button>
        </Stack>
    );
};

const meta = {
    title: 'Game/Timer',
    component: MainTimeGrantPreview,
    parameters: {
        layout: 'centered',
    },
    decorators: [
        (Story) => (
            <Box sx={{ padding: 6, background: '#0b1622' }}>
                {/* the colours the timer uses, which the app's CssBaseline defines and the Storybook preview does not */}
                <GlobalStyles styles={{
                    ':root': {
                        '--initiative-blue': '#00BAFF',
                        '--initiative-red': '#FF3231',
                        '--selection-green': '#72F979',
                    },
                }} />
                <Story />
            </Box>
        ),
    ],
} satisfies Meta<typeof MainTimeGrantPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MainTimeGrantToBothPlayers: Story = {
    args: {
        playerFromSeconds: 64,
        playerGrantSeconds: 10,
        opponentFromSeconds: 112,
        opponentGrantSeconds: 8,
        turnTimeRemainingSeconds: 20,
    },
};

export const MainTimeGrantToOpponentOnly: Story = {
    args: {
        playerFromSeconds: 120,
        playerGrantSeconds: 0,
        opponentFromSeconds: 40,
        opponentGrantSeconds: 10,
        turnTimeRemainingSeconds: 20,
    },
};
