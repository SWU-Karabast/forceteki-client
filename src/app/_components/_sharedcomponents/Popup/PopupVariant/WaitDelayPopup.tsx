import { useGame } from '@/app/_contexts/Game.context';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { WaitDelayPopup } from '../Popup.types';
import RichText from '../../RichText/RichText';

interface WaitDelayProps {
    data: WaitDelayPopup;
}

const MIN_DELAY_MS = 1000;
const MAX_DELAY_MS = 3000;
// How often the progress bar refreshes; small enough to look smooth.
const TICK_MS = 50;

export const WaitDelayPopupModal = ({ data }: WaitDelayProps) => {
    const { sendGameMessage } = useGame();
    // Guards against double-resolving if the timer fires and the player also clicks Skip.
    const hasResolvedRef = useRef(false);
    const skipButton = data.buttons[0];

    // Randomized wait so an opponent can't infer anything from the pause length. Chosen once on mount.
    const [delay] = useState(() => MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS));
    // 0 -> 100 as the pause elapses, driving the progress bar.
    const [progress, setProgress] = useState(0);

    const resolve = () => {
        if (hasResolvedRef.current || !skipButton) return;
        hasResolvedRef.current = true;
        sendGameMessage([skipButton.command, skipButton.arg, skipButton.uuid]);
    };

    useEffect(() => {
        const start = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - start;
            setProgress(Math.min(100, (elapsed / delay) * 100));
            if (elapsed >= delay) {
                clearInterval(interval);
                resolve();
            }
        }, TICK_MS);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(false)}>
                <RichText text={data.title} sx={titleStyle} component={Typography} />
            </Box>
            {data.description && (
                <RichText text={data.description} sx={textStyle} component={Typography} />
            )}
            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    width: '80%',
                    height: 8,
                    borderRadius: 4,
                    my: 2,
                    backgroundColor: 'rgba(255, 255, 255, 0.15)',
                    '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                        transition: `transform ${TICK_MS}ms linear`,
                    },
                }}
            />
            <Box sx={footerStyle}>
                <GradientBorderButton onClick={resolve}>
                    <RichText text={skipButton?.text ?? 'Skip'} />
                </GradientBorderButton>
            </Box>
        </Box>
    );
};
