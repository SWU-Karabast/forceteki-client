// BackCard.tsx

import React from "react";
import { Card, CardContent, Box, Typography } from "@mui/material";
import Image from "next/image";

const BackCard: React.FC<BackCardProps> = ({ deckSize }) => {
  return (
    <Card
      sx={{
        backgroundColor: "rgba(40, 40, 40, 0.9)",
        width: "9vh",
        height: "9vh",
        display: "flex",
        borderRadius: "5px",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
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
          position: "relative",
        }}
      >
        <Image
          src="/card-back.png"
          alt="Deck Image"
          width={28}
          height={38}
          placeholder="empty"
          style={{
            width: "11.29vh",
            height: "auto",
          }}
        />

        {deckSize && deckSize > 0 && (
          <>
            {/* Circular background */}
            <Box
              sx={{
                width: "5.5vh",
                height: "5.5vh",
                backgroundColor: "rgba(20, 20, 20, 0.9)",
                borderRadius: "50%",
                position: "absolute",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            ></Box>

            {/* Deck Size Number */}
            <Typography
              variant="body2"
              sx={{
                fontFamily: "var(--font-barlow), sans-serif",
                fontWeight: "800",
                fontSize: "2.2vh",
                color: "white",
                position: "absolute",
              }}
            >
              {deckSize}
            </Typography>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BackCard;
