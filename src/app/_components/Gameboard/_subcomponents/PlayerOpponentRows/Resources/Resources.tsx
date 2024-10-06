import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import Image from "next/image";

const Resources: React.FC<ResourcesProps> = ({
  availableResources,
  totalResources,
  activePlayer,
  handleModalToggle,
}) => {
  return (
    <Card
      sx={{
        backgroundColor: "rgba(20, 20, 20, 0.8)",
        width: "9.52vw",
        height: "9vh",
        display: "flex",
        borderRadius: "5px",
        justifyContent: "center",
        alignItems: "center",
        transition: "background-color 0.3s ease",
        "&:hover": {
          background:
            activePlayer === "player"
              ? "linear-gradient(to top, white, transparent)"
              : null,
        },
      }}
      onClick={() => {
        if (activePlayer === "player" && handleModalToggle) {
          handleModalToggle();
        }
      }}
    >
      <CardContent
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          textAlign: "center",
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            flexDirection: "row",
            gap: "1vw",
            height: "4.47vh",
          }}
        >
          <Image
            src="/resource-icon.png"
            alt="Resource Icon"
            width={28}
            height={38}
            style={{
              width: "2.50vw",
              height: `calc(2.50vw * 1.357)`,
            }}
          />
          <Typography
            variant="body2"
            sx={{
              fontFamily: "var(--font-barlow), sans-serif",
              fontWeight: "800",
              fontSize: "4.2vh",
              color: "white",
            }}
          >
            {availableResources}/{totalResources}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default Resources;
