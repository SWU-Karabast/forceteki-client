import React from "react";
import Grid from "@mui/material/Grid2";
import SpaceUnitsBoard from "../_subcomponents/BoardRow/SpaceUnitsBoard/SpaceUnitsBoard";
import GroundUnitsBoard from "../_subcomponents/BoardRow/GroundUnitsBoard/GroundUnitsBoard";

const Board: React.FC<BoardProps> = ({
  sidebarOpen,
  playedGroundCards,
  playedSpaceCards,
}) => {
  return (
    <Grid container sx={{ height: "64.18%" }}>
      <Grid
        container
        size={5}
        sx={{
          backgroundColor: "lightyellow",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <SpaceUnitsBoard
          sidebarOpen={sidebarOpen}
          playedSpaceCards={playedSpaceCards}
        />
      </Grid>
      <Grid size={2} sx={{ backgroundColor: "lightpink" }}></Grid>
      <Grid
        container
        size={5}
        sx={{
          backgroundColor: "lightgray",
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
