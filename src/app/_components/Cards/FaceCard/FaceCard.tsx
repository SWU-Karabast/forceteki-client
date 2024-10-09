import React from "react";
import { Card, CardActionArea, CardContent, Typography } from "@mui/material";

const FaceCard: React.FC<FaceCardProps> = ({
  selected = false,
  handleSelect,
  disabled = false,
  name = "Unnamed Card",
  unitType,
}) => {
  return (
    <Card
      sx={{
        border: selected ? "2px solid blue" : "1px solid gray",
        opacity: disabled ? 0.8 : 1,
        width: "8vh",
        height: "8vh",
        textAlign: "center",
        color: "white",
        display: "flex",
        backgroundColor: "rgba(40, 40, 40, 0.9)",
        "&:hover": {
          backgroundColor: disabled
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(112, 128, 144, 0.8)", // Adjust hover color
        },
        cursor: disabled ? "not-allowed" : "pointer",
      }}
      onClick={() => {
        if (!disabled && handleSelect) {
          handleSelect();
        }
      }}
    >
      <CardActionArea>
        <CardContent>
          <Typography variant="h6">{name}</Typography>
          {unitType && (
            <Typography variant="body2" sx={{ fontSize: "1.5vh" }}>
              {unitType.toUpperCase()}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
};

export default FaceCard;
