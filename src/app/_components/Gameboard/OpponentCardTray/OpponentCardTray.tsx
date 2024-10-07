import React from "react";
import Grid from "@mui/material/Grid2";
import Resources from "../_subcomponents/PlayerOpponentRows/Resources/Resources";
import DeckDiscard from "../_subcomponents/PlayerOpponentRows/DeckDiscard/DeckDiscard";
import CardActionTray from "../_subcomponents/PlayerOpponentRows/CardActionTray/CardActionTray";

const OpponentCardTray: React.FC<OpponentCardTrayProps> = ({ participant }) => {
  return (
    <Grid container sx={{ height: "15%" }}>
      <Grid
        size={3}
        sx={{
          backgroundColor: "tomato",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-start",
          paddingLeft: "1.35%",
          paddingTop: "1.35%",
        }}
      >
        <Resources
          availableResources={2}
          totalResources={4}
          activePlayer={participant.type}
        />
      </Grid>
      <Grid
        size={6}
        sx={{
          height: "100%",
          backgroundColor: "lightblue",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CardActionTray
          activePlayer={participant.type}
          availableCards={participant.cards}
          // Opponent doesn't need to handle resource selection or playing cards
        />
      </Grid>
      <Grid
        size={3}
        sx={{
          backgroundColor: "lightcoral",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          paddingRight: "1.35%",
          paddingTop: "1.35%",
        }}
      >
        <DeckDiscard deckSize={participant.deckSize} />
      </Grid>
    </Grid>
  );
};

export default OpponentCardTray;
