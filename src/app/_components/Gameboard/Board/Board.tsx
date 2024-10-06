import React from "react";
import Grid from "@mui/material/Grid2";

const Board: React.FC<BoardProps> = ({ spacing }) => {
  return (
    <Grid container columnSpacing={spacing} sx={{ height: "64.18%" }}>
      <Grid size={5} sx={{ backgroundColor: "lightyellow" }}></Grid>
      <Grid size={2} sx={{ backgroundColor: "lightpink" }}></Grid>
      <Grid size={5} sx={{ backgroundColor: "lightgray" }}></Grid>
    </Grid>
  );
};

export default Board;
