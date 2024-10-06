// DeckDiscard.tsx

import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import BackCard from "../BackCard/BackCard";

const DeckDiscard: React.FC<DeckDiscardProps> = ({ deckSize }) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        gap: "1vw",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Discard */}
      <Card
        sx={{
          backgroundColor: "rgba(20, 20, 20, 0.8)",
          width: "9vh",
          height: "9vh",
          display: "flex",
          borderRadius: "5px",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CardContent
          sx={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontFamily: "var(--font-barlow), sans-serif",
              fontWeight: "800",
              fontSize: "2vh",
              color: "white",
            }}
          >
            Discard
          </Typography>
        </CardContent>
      </Card>

      {/* Deck Pile */}
      <BackCard deckSize={deckSize} />
    </Box>
  );
};

export default DeckDiscard;
