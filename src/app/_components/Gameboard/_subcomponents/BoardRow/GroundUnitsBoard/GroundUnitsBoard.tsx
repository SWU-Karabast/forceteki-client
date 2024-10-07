import React from "react";
import { Paper } from "@mui/material";
import Grid from "@mui/material/Grid2";
import FaceCard from "../../Cards/FaceCard/FaceCard";

const GroundUnitsBoard: React.FC<GroundUnitsBoardProps> = ({
  sidebarOpen,
  playedGroundCards,
}) => {
  return (
    <Paper
      sx={{
        borderRadius: "1.5em",
        height: "60vh",
        width: sidebarOpen ? "32vw" : "36vw",
        marginLeft: ".3vw",
        padding: "1vh",
        backgroundImage: "url(/ground-board.png)",
        backgroundPositionX: "45%",
        backgroundPositionY: sidebarOpen ? "80%" : "90%",
        backgroundSize: "200%",
      }}
    >
      <Grid container direction="column" sx={{ height: "100%" }}>
        {/* Opponent's Ground Units */}
        <Grid
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-start",
            gap: "0.5vw",
            flexWrap: "nowrap",
            overflowX: "auto",
          }}
        >
          {playedGroundCards.opponent.map((card) => (
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

        {/* Player's Ground Units */}
        <Grid
          sx={{
            flexGrow: 1,
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "flex-end",
            gap: "0.5vw",
            flexWrap: "nowrap",
            overflowX: "auto",
            marginTop: "1vh",
          }}
        >
          {playedGroundCards.player.map((card) => (
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

export default GroundUnitsBoard;
