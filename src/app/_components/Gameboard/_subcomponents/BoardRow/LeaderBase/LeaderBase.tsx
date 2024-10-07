import React from "react";
import Grid from "@mui/material/Grid2";
import LeaderCard from "../../Cards/LeaderCard/LeaderCard";
import BaseCard from "../../Cards/BaseCard/BaseCard";

const LeaderBase: React.FC<LeaderBaseProps> = ({ participant }) => {
  return (
    <Grid
      container
      direction="column"
      sx={{
        flexGrow: 1,
        justifyContent:
          participant.type === "player" ? "flex-end" : "flex-start",
        alignItems: "center",
        gap: "0.5vh",
        height: "100%",
        paddingTop: participant.type === "player" ? "0" : "4vh",
        paddingBottom: participant.type === "player" ? "4vh" : "0",
      }}
    >
      {participant.type === "player" ? (
        <>
          <BaseCard />
          <LeaderCard />
        </>
      ) : (
        <>
          <LeaderCard />
          <BaseCard />
        </>
      )}
    </Grid>
  );
};

export default LeaderBase;
