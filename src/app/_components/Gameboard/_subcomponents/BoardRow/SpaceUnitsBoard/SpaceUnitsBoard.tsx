import React from "react";
import { Paper } from "@mui/material";
import FaceCard from "../../Cards/FaceCard/FaceCard";
import Grid from "@mui/material/Grid2";

const SpaceUnitsBoard: React.FC<SpaceUnitsBoardProps> = ({
  sidebarOpen,
  playedSpaceCards,
}) => {
  return (
    <Paper
      elevation={16}
      sx={{
        borderRadius: "1.5em",
        height: "60vh",
        width: sidebarOpen ? "32vw" : "36vw",
        marginRight: ".3vw",
        padding: "1vh",
        backgroundImage: "url(/space-board.jpeg)",
        backgroundPositionX: "50%",
        backgroundSize: sidebarOpen ? "200%" : "180%",
      }}
    >
      <Grid container direction="column" sx={{ height: "100%" }}>
        {/* Opponent's Space Units */}
        <Grid
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-start",
            gap: "0.5vw",
            flexWrap: "nowrap",
            overflowX: "auto",
          }}
        >
          {playedSpaceCards.opponent.map((card) => (
            <FaceCard
              key={card.id}
              name={card.name}
              unitType={card.unitType}
              selected={card.selected}
              handleSelect={card.handleSelect}
              disabled
            />
          ))}
        </Grid>

        {/* Player's Space Units */}
        <Grid
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "flex-end",
            gap: "0.5vw",
            flexWrap: "nowrap",
            overflowX: "auto",
            marginTop: "1vh",
          }}
        >
          {playedSpaceCards.player.map((card) => (
            <FaceCard
              key={card.id}
              name={card.name}
              unitType={card.unitType}
              selected={card.selected}
              handleSelect={card.handleSelect}
              disabled
            />
          ))}
        </Grid>
      </Grid>
    </Paper>
  );
};

export default SpaceUnitsBoard;
