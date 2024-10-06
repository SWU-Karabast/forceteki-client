import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import { Box, Button, Typography } from "@mui/material";
import FaceCard from "../FaceCard/FaceCard";
import BackCard from "../BackCard/BackCard";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./CardActionTray.module.css";

const CardActionTray: React.FC<CardActionTrayProps> = ({
  activePlayer = "player",
  availableCards,
  onSelectCard,
  resourceSelection = false,
  setResourceSelection,
}) => {
  const [disabled, setDisabled] = useState(!resourceSelection);
  const [emblaRef, embla] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    setDisabled(!resourceSelection);
  }, [resourceSelection]);

  const handleCardClick = (card: FaceCardProps) => {
    if (onSelectCard && resourceSelection && activePlayer === "player") {
      onSelectCard(card);
    }
  };

  const bottomRow =
    activePlayer === "player" && setResourceSelection ? (
      <Grid container justifyContent="center" alignItems="center" spacing={2}>
        <Typography variant="h6">Choose an Action:</Typography>
        <Button variant="contained">Pass [Space]</Button>
        <Button variant="contained">Claim Initiative</Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: resourceSelection ? "red" : "green" }}
          onClick={() => {
            setResourceSelection(!resourceSelection);
          }}
        >
          {resourceSelection
            ? "Stop Resource Selection"
            : "Start Resource Selection"}
        </Button>
      </Grid>
    ) : null;

  return (
    <>
      {/* Embla Carousel wrapped in a Grid */}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        sx={{ position: "relative" }}
      >
        <Box className={styles.embla} ref={emblaRef}>
          <Box className={styles.embla__container}>
            {availableCards.map((card) => (
              <Box className={styles.embla__slide} key={card.id}>
                {activePlayer === "player" ? (
                  <FaceCard
                    selected={card.selected}
                    handleSelect={() => handleCardClick(card)}
                    disabled={disabled}
                  />
                ) : (
                  <BackCard />
                )}
              </Box>
            ))}
          </Box>
        </Box>
      </Grid>
      {bottomRow}
    </>
  );
};

export default CardActionTray;
