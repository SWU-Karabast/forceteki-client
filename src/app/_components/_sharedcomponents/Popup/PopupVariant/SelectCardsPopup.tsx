
import { Box, Button, IconButton, Typography } from '@mui/material';
import { MouseEvent, useState } from 'react';
import {
    containerStyle,
    headerStyle,
    minimizeButtonStyle,
    perCardButtonStyle,
    textStyle,
    titleStyle,
} from '../Popup.styles';
import { PerCardButton, SelectCardsPopup } from '../Popup.types';
import { usePopup } from '@/app/_contexts/Popup.context';
import { useGame } from '@/app/_contexts/Game.context';
import { BiMinus, BiPlus } from 'react-icons/bi';
import GameCard from '../../Cards/GameCard';

interface ButtonProps {
    data: SelectCardsPopup;
}

const cardListContainerStyle = {
    display: 'flex',
    gap: '.25rem',
    marginTop: '1rem',
    overflowX: 'auto',
};

const cardSelectorStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '.5rem',
};

export const SelectCardsPopupModal = ({ data }: ButtonProps) => {
    const { closePopup } = usePopup();
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <Typography sx={textStyle}>{data.description}</Typography>
                )}
                <Box sx={cardListContainerStyle}>
                    {data.cards.map((card) => {
                        return (
                            <Box key={card.uuid} sx={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <Box key={card.uuid} sx={cardSelectorStyle}>

                                    <GameCard key={card.uuid} card={{ ...card, selectable: false }} />
                                </Box>
                                {renderButtons(card.uuid, data.perCardButtons)}
                            </Box>
                        )
                    })}
                </Box>
            </>
        );
    };

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    const renderButtons = (cardUuid: string, buttons: PerCardButton[]) => {
        return (
            <Box sx={{ gap: '1rem', flexDirection: 'column', display: 'flex' }}>
                {buttons.map((button, index) =>
                    <Button
                        key={`${button.arg}:${index}`}
                        sx={perCardButtonStyle}
                        variant="contained"
                        onClick={() => {
                            sendGameMessage([button.command, button.arg, cardUuid, data.uuid]); closePopup(data.uuid)
                        }}
                    >
                        {button.text}
                    </Button>
                )}</Box>
        )
    }


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