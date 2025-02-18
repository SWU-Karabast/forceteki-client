
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
import { CardStyle } from '../../Cards/CardTypes';
import GameCard from '../../Cards/GameCard';

interface ButtonProps {
    data: SelectCardsPopup;
}

const styles = {
    selectableCardsContainer: {
        display: 'flex',
        gap: '.25rem',
        marginTop: '1rem',
        overflowX: 'auto',
    },
    selectionDot: {
        height: '1rem',
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        '::before': {
            content: '""',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: 'green',
        }
    },
    selectableCard: {
        alignItems: 'center', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: '1rem',
    },
    invalidCard: {
        filter: 'brightness(0.5)',
    }
}

export const SelectCardsPopupModal = ({ data }: ButtonProps) => {
    const { closePopup } = usePopup();
    const { sendGameMessage } = useGame();
    const [isMinimized, setIsMinimized] = useState(false);

    const selectingCards = data.cards.some((card) => card.selectionState === 'selectable' || card.selectionState === 'selected') && 
                           !data.cards.every((card) => card.selectionState === 'viewOnly') &&
                           !data.perCardButtons.length;

    const selectableCards = data.cards.filter((card) => card.selectionState !== 'invalid');
    const invalidCards = data.cards.filter((card) => card.selectionState === 'invalid');

    const renderPopupContent = () => {
        if (isMinimized) return null;
        return (
            <>
                {data.description && (
                    <Typography sx={textStyle}>{data.description}</Typography>
                )}
                <Box sx={styles.selectableCardsContainer}>
                    {selectableCards.map((card) => {
                        return (
                            <Box key={card.uuid} sx={{ ...styles.selectableCard, filter: card.selectionState === 'unselectable' ? 'brightness(0.75)' : '' }}>
                                <GameCard 
                                    key={card.uuid}
                                    cardStyle={CardStyle.Prompt}
                                    card={{ ...card, selectable: card.selectionState === 'selectable', selected: card.selectionState === 'selected' }}
                                    onClick={() => sendGameMessage(['menuButton', card.uuid, data.uuid])}
                                />
                                {selectingCards && (
                                    <Box
                                        sx={{
                                            ...styles.selectionDot,
                                            '&::before': {
                                                backgroundColor: card.selectionState === 'selected' ? 'var(--selection-blue)' : 'var(--selection-grey)',
                                            }
                                        }}
                                    />
                                )}
                                {renderButtons(card.uuid, data.perCardButtons, data.cards.length == 1)}
                            </Box>
                        )
                    })}
                    {invalidCards.map((card) => {
                        return (
                            <Box key={card.uuid} sx={styles.invalidCard}>
                                <GameCard key={card.uuid} disabled={true} cardStyle={CardStyle.Prompt} card={{ ...card, selectable: false, selected: false }} />
                            </Box>
                        )
                    })}
                </Box>
                <Box>
                    {data.buttons.map((button, index) => 
                        <Button
                            key={`${button.arg}:${index}`}
                            sx={perCardButtonStyle}
                            variant="contained"
                            onClick={() => {
                                sendGameMessage([button.command, button.arg, data.uuid]); closePopup(data.uuid)
                            }}
                        >
                            {button.text}
                        </Button>
                    )}
                </Box>
            </>
        );
    };

    const handleMinimize = (e: MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        setIsMinimized(!isMinimized);
    };

    const renderButtons = (cardUuid: string, buttons: PerCardButton[], last: boolean) => {
        return (
            <Box sx={{ gap: '1rem', flexDirection: 'column', display: 'flex' }}>
                {buttons.map((button, index) =>
                    <Button
                        key={`${button.arg}:${index}`}
                        sx={perCardButtonStyle}
                        variant="contained"
                        onClick={() => {
                            sendGameMessage([button.command, button.arg, cardUuid, data.uuid]); if (last) closePopup(data.uuid)
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