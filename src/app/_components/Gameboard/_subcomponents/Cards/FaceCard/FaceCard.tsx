import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

const FaceCard: React.FC<FaceCardProps> = ({
  selected,
  handleSelect,
  disabled = false,
}) => {
  return (
    <Card
      sx={{
        border: selected ? "2px solid blue" : "1px solid gray",
        opacity: disabled ? 0.65 : 1,
        width: "8vh",
        height: "8vh",
        textAlign: "center",
        color: "white",
        display: "flex",
        backgroundColor: "rgba(0, 0, 0, 0.8)", // Slightly transparent black
        "&:hover": {
          backgroundColor: disabled
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(112, 128, 144, 0.8)", // Adjust hover color
        },
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={() => {
        if (!disabled) {
          handleSelect();
        }
      }}
    >
      <CardActionArea>
        <CardContent>
          <Typography variant="h6">Card Name</Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default FaceCard;
