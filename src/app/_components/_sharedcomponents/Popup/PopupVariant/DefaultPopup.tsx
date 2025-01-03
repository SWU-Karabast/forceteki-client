import { useGame } from '@/app/_contexts/Game.context';
import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Button, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import {
    buttonStyle,
    containerStyle,
    footerStyle,
    headerStyle,
    minimalButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { DefaultPopup, PopupButton } from '../Popup.types';

interface ButtonProps {
    data: DefaultPopup;
}

export const DefaultPopupModal = ({ data }: ButtonProps) => {
    const { sendGameMessage } = useGame();
    const { closePopup } = usePopup();
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
                        <Button
                            key={`${button.uuid}:${index}`}
                            sx={buttonStyle}
                            variant="contained"
                            onClick={() => {
                                sendGameMessage([button.command, button.arg, button.uuid]);
                                closePopup(data.uuid);
                            }}
                        >
                            {button.text}
                        </Button>
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
                    sx={minimalButtonStyle}
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