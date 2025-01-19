import { Box, Button, Typography } from '@mui/material';
import { useState } from 'react';
import { ICardData } from '../../Cards/CardTypes';
import GameCard from '../../Cards/GameCard';
import {
    buttonStyle,
    cardButtonStyle,
    containerStyle,
    footerStyle,
    selectedCardBorderStyle,
    selectedIndicatorStyle,
    titleStyle,
} from '../Popup.styles';
import { SelectCardsPopup } from '../Popup.types';

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

interface ButtonProps {
    data: SelectCardsPopup;
}

export const SelectCardsPopupModal = ({ data }: ButtonProps) => {
    const [selectedCards, setSelectedCards] = useState<
        Record<number, ICardData[]>
    >([]);

    const handleCardClick = (index: number, card: ICardData) => {
        if (!selectedCards[index]) {
            setSelectedCards((prev) => ({
                ...prev,
                [index]: [card],
            }));
        } else {
            setSelectedCards((prev) => ({
                ...prev,
                [index]: [...prev[index], card],
            }));
        }
    };

    const isSelectedCard = (index: number) => selectedCards[index] !== undefined;
    const isButtonDisabled = () =>
        Object.keys(selectedCards).length === 0 ||
    (data.maxNumber !== undefined && data.maxNumber > Object.keys(selectedCards).length);

    // sort and not filter cards by selectable true first
    const sortCards = (cards: ICardData[]) =>
        cards.sort((a, b) => Number(b.selectable) - Number(a.selectable));

    return (
        <Box sx={containerStyle}>
            <Typography sx={titleStyle}>{data.title}</Typography>
            <Box sx={cardListContainerStyle}>
                {sortCards(data.cards).map((card, index) => (
                    <Box key={`card-${index}-${card.uuid}`} sx={cardSelectorStyle}>
                        <Button
                            sx={cardButtonStyle}
                            onClick={() => handleCardClick(index, card)}
                            variant="text"
                        >
                            <Box sx={selectedCardBorderStyle(isSelectedCard(index))}>
                                <GameCard card={card} />
                            </Box>
                        </Button>
                        <Box sx={selectedIndicatorStyle(isSelectedCard(index))} />
                    </Box>
                ))}
            </Box>
            <Box sx={footerStyle}>
                <Button
                    disabled={isButtonDisabled()}
                    onClick={() => data.onConfirm(Object.values(selectedCards).flat())}
                    sx={buttonStyle}
                    variant="contained"
                >
                    Confirm
                </Button>
            </Box>
        </Box>
    );
};