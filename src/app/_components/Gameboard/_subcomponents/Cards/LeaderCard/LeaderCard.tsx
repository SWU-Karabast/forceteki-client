import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

const LeaderCard: React.FC<LeaderCardProps> = ({
  selected = false,
  handleSelect,
}) => {
  return (
    <Card
      sx={{
        border: selected ? "2px solid blue" : "1px solid gray",
        width: "12vw",
        height: "11vh",
        textAlign: "center",
        color: "white",
        display: "flex",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        "&:hover": {
          backgroundColor: "rgba(112, 128, 144, 0.8)",
        },
        cursor: "pointer",
      }}
      onClick={() => {
        if (handleSelect) {
          handleSelect();
        }
      }}
    >
      <CardActionArea>
        <CardContent>
          <Typography variant="h6">Leader Card</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default LeaderCard;
