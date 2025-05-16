import { useGame } from '@/app/_contexts/Game.context';
import { Box, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GradientBorderButton from '@/app/_components/_sharedcomponents/_styledcomponents/GradientBorderButton';
import {
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { DefaultPopup, PopupButton } from '../Popup.types';

interface ButtonProps {
    data: DefaultPopup;
}

export const DefaultPopupModal = ({ data }: ButtonProps) => {
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <Typography sx={textStyle}>{data.description}</Typography>
                )}
                <Box sx={footerStyle}>
                    {data.buttons.map((button: PopupButton, index: number) => (
                        <GradientBorderButton
                            key={`${button.uuid}:${index}`}
                            fillColor={button.selected ? 'rgba(102, 229, 255, 0.2)' : undefined}
                            onClickHandler={() => {
                                sendGameMessage([button.command, button.arg, button.uuid]);
                            }}
                        >
                            {button.text}
                        </GradientBorderButton>
                    ))}
                </Box>
            </>
        );
    };

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    return (
        <Box sx={containerStyle}>
            <Box sx={headerStyle(isMinimized)}>
                <Typography sx={titleStyle}>{data.title}</Typography>
                <IconButton
                    sx={minimizeButtonStyle}
                    aria-label="minimize"
                    onClick={handleMinimize}
                >
                    {isMinimized ? <BiPlus /> : <BiMinus />}
                </IconButton>
            </Box>
            {renderPopupContent()}
        </Box>
    );
};