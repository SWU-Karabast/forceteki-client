import React from "react";
import { Box } from "@mui/material";
import FaceCard from "../../Cards/FaceCard/FaceCard";

interface CardAreaProps {
  cards: FaceCardProps[];
}

const CardArea: React.FC<CardAreaProps> = ({ cards }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        justifyContent: "center",
      }}
    >
      {cards.map((card) => (
        <FaceCard
          key={card.id}
          selected={false} // Selection logic can be added if needed
          handleSelect={() => {}} // No action on select within ResourcesOverlay
          disabled={true} // Disable interactions in ResourcesOverlay
        />
      ))}
    </Box>
  );
};

export default CardArea;
