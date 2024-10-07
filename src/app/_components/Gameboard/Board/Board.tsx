import React from "react";
import Grid from "@mui/material/Grid2";
import SpaceUnitsBoard from "../_subcomponents/BoardRow/SpaceUnitsBoard/SpaceUnitsBoard";
import GroundUnitsBoard from "../_subcomponents/BoardRow/GroundUnitsBoard/GroundUnitsBoard";
import LeaderBaseBoard from "../_subcomponents/BoardRow/LeaderBaseBoard/LeaderBaseBoard";

const Board: React.FC<BoardProps> = ({
  sidebarOpen,
  playedGroundCards,
  playedSpaceCards,
  participant,
}) => {
  return (
    <Grid container sx={{ height: "64.18%" }}>
      <Grid
        container
        size={5}
        sx={{
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <SpaceUnitsBoard
          sidebarOpen={sidebarOpen}
          playedSpaceCards={playedSpaceCards}
        />
      </Grid>
      <Grid container size={2}>
        <LeaderBaseBoard participant={participant} />
      </Grid>
      <Grid
        container
        size={5}
        sx={{
          justifyContent: "flex-start",
          alignItems: "center",
        }}
      >
        <GroundUnitsBoard
          sidebarOpen={sidebarOpen}
          playedGroundCards={playedGroundCards}
        />
      </Grid>
    </Grid>
  );
};

export default Board;
