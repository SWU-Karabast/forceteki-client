import React from "react";
import Grid from "@mui/material/Grid2";
import { Paper } from "@mui/material";
import SpaceUnitsBoard from "../_subcomponents/BoardRow/SpaceUnitsBoard.tsx/SpaceUnitsBoard";
import GroundUnitsBoard from "../_subcomponents/BoardRow/GroundUnitsBoard.tsx/GroundUnitsBoard";

const Board: React.FC<BoardProps> = ({ spacing, sidebarOpen }) => {
  return (
    <Grid container columnSpacing={spacing} sx={{ height: "64.18%" }}>
      <Grid
        container
        size={5}
        sx={{
          backgroundColor: "lightyellow",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <SpaceUnitsBoard sidebarOpen={sidebarOpen} />
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
        <GroundUnitsBoard sidebarOpen={sidebarOpen} />
      </Grid>
    </Grid>
  );
};

export default Board;
