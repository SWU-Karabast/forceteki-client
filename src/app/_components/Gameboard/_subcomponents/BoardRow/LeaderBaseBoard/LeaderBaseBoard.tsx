import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderBase from "../LeaderBase/LeaderBase";

const LeaderBaseBoard: React.FC<LeaderBaseBoardProps> = ({ participant }) => {
  return (
    <Grid
      container
      direction="column"
      sx={{
        height: "100%",
        width: "100%",
        justifyContent: "space-between",
      }}
    >
      {/* Opponent's row */}
      <Grid sx={{ flexGrow: 1, width: "100%" }}>
        <LeaderBase participant={participant} />
      </Grid>
      {/* Player's row */}
      <Grid sx={{ flexGrow: 1, width: "100%" }}>
        <LeaderBase participant={participant} />
      </Grid>
    </Grid>
  );
};

export default LeaderBaseBoard;
