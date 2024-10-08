"use client";
import { Typography, Paper } from "@mui/material";
import Grid from "@mui/material/Grid2";

const Lobby = () => {
  return (
    <Grid container sx={{ height: "100vh", backgroundColor: "red" }}>
      <Grid size={3}>
        <Paper sx={{ backgroundColor: "lightpink", height: "100%" }}>
          <Typography>HELLO</Typography>
        </Paper>
      </Grid>
      <Grid size={3}></Grid>
      <Grid size={6}>
        <Paper sx={{ backgroundColor: "green", height: "100%" }}>
          <Typography>HELLO</Typography>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default Lobby;
