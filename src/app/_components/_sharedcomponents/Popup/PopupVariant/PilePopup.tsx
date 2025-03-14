import { usePopup } from '@/app/_contexts/Popup.context';
import { Box, Button, Grid2, IconButton, Typography } from '@mui/material';
import { useState } from 'react';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GameCard from '../../Cards/GameCard';
import GradientBorderButton from '../../_styledcomponents/GradientBorderButton';
import {
    buttonStyle,
    containerStyle,
    footerStyle,
    headerStyle,
    minimizeButtonStyle,
    titleStyle,
    subtitleStyle,
} from '../Popup.styles';
import { PilePopup, PopupButton } from '../Popup.types';
import { useGame } from '@/app/_contexts/Game.context';

interface ButtonProps {
    data: PilePopup;
}

export const gridContainerStyle = {
    maxHeight: '60vh',
    overflowY: 'auto',
    marginTop: '1rem',
    display: 'grid',
    gridTemplateColumns: {
        xs: 'repeat(auto-fit, minmax(4rem, 5rem))',
        lg: 'repeat(auto-fit, minmax(5rem, 6rem))',
        xl: 'repeat(auto-fit, minmax(5rem, 7rem))',
    },
    gap: '10px',
    width: '100%',
    justifyContent: 'center',
};

export const PilePopupModal = ({ data }: ButtonProps) => {
    const { closePopup } = usePopup();
    const { sendGameMessage } = useGame();

    const [isMinimized, setIsMinimized] = useState(false);

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                <Box
                    sx={gridContainerStyle}
                >
                    {data.cards.map((card, index) => (
                        <Box key={index}>
                            <GameCard card={card} />
                        </Box>
                    ))}
                </Box>

                {data.cards.length === 0 && <Typography>No cards to display</Typography>}

                <Box sx={footerStyle}>
                    { data.buttons !== null ? 
                        data.buttons.map((button: PopupButton, index: number) => (
                            <GradientBorderButton
                                key={`${button.uuid}:${index}`}
                                fillColor={button.selected ? '#666' : undefined}
                                onClickHandler={() => {
                                    sendGameMessage([button.command, button.arg, button.uuid]);
                                }}
                            >
                                {button.text}
                            </GradientBorderButton>
                        )) 
                        :
                        <Button onClick={() => closePopup(data.uuid)} sx={buttonStyle}>
                            Close
                        </Button>
                    }
                </Box>
            </>
        );
    };

    const handleMinimize = (e: React.MouseEvent<HTMLButtonElement>) => {
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
            <Typography sx={subtitleStyle} hidden={isMinimized}>{data.subtitle}</Typography>

            {renderPopupContent()}
        </Box>
    );
};