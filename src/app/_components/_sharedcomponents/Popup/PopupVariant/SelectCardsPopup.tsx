import { Box, Button, Typography } from "@mui/material";
import { useState } from "react";
import { ICardData } from "../../Cards/CardTypes";
import GameCard from "../../Cards/GameCard/GameCard";
import {
  buttonStyle,
  cardButtonStyle,
  containerStyle,
  footerStyle,
  selectedCardBorderStyle,
  selectedIndicatorStyle,
  titleStyle,
} from "../Popup.styles";
import { SelectCardsPopup } from "../Popup.types";

const cardListContainerStyle = {
  display: "flex",
  gap: ".25rem",
  marginTop: "1rem",
  overflowX: "auto",
};

const cardSelectorStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: ".5rem",
};

interface ButtonProps {
  data: SelectCardsPopup;
}

export const SelectCardsPopupModal = ({ data }: ButtonProps) => {
  const [selectedCards, setSelectedCards] = useState<ICardData[]>([]);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);

  const handleCardClick = (index: number, card: ICardData) => {
    if (!selectedIndexes.includes(index)) {
      setSelectedIndexes([...selectedIndexes, index]);
      setSelectedCards([...selectedCards, card]);
    } else {
      setSelectedIndexes(selectedIndexes.filter((i) => i !== index));
      setSelectedCards(selectedCards.filter((c) => c.uuid !== card.uuid));
    }
  };

  const isSelectedCard = (index: number) => selectedIndexes.includes(index);
  const isButtonDisabled = () =>
    selectedCards.length === 0 ||
    (data.maxNumber !== undefined && data.maxNumber > selectedCards.length);

  return (
    <Box sx={containerStyle}>
      <Typography sx={titleStyle}>{data.title}</Typography>
      <Box sx={cardListContainerStyle}>
        {data.cards.map((card, index) => (
          <Box sx={cardSelectorStyle}>
            <Button
              sx={cardButtonStyle}
              onClick={() => handleCardClick(index, card)}
              variant="text"
            >
              <Box
                sx={selectedCardBorderStyle(isSelectedCard(index))}
                key={`card-${index}-${card.uuid}`}
              >
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
          onClick={() => data.onConfirm(selectedCards)}
          sx={buttonStyle}
          variant="contained"
        >
          Confirm
        </Button>
      </Box>
    </Box>
  );
};
