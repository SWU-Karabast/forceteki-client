import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useEffect, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { DiscloseMockDelayPopup } from '../Popup.types';
import RichText from '../../RichText/RichText';
import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';

interface Props {
    data: DiscloseMockDelayPopup;
}

export const DiscloseMockDelayPopupModal = ({ data }: Props) => {
    const { sendGameMessage } = useGame();
    const { closePopup } = usePopup();
    const [isMinimized, setIsMinimized] = useState(false);

    const handlePass = () => {
        closePopup(data.uuid);
        if (data.buttons[0]) {
            const btn = data.buttons[0];
            sendGameMessage([btn.command, btn.arg, btn.uuid]);
        }
    };

    // Auto-pass after delayMs; player may click early
    useEffect(() => {
        const timer = setTimeout(() => {
            handlePass();
        }, data.delayMs);
        return () => clearTimeout(timer);
    }, [data.uuid, data.delayMs]);

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <RichText text={data.title} sx={titleStyle} component={Typography} />
                <IconButton
                    sx={minimizeButtonStyle}
                    aria-label="minimize"
                    onClick={handleMinimize}
                >
                    {isMinimized ? <BiPlus /> : <BiMinus />}
                </IconButton>
            </Box>
            {!isMinimized && (
                <RichText
                    text="Good job, Phil Ivey — they bought your bluff!"
                    sx={{ ...textStyle, marginTop: '1rem', fontSize: '1rem' }}
                    component={Typography}
                />
            )}
        </Box>
    );
};
