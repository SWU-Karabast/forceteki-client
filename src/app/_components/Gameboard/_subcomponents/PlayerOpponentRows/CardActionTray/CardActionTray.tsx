import React, { useState, useEffect } from "react";
import Grid from "@mui/material/Grid2";
import { Box, Button, Typography } from "@mui/material";
import FaceCard from "../../Cards/FaceCard/FaceCard";
import BackCard from "../../Cards/BackCard/BackCard";
import useEmblaCarousel from "embla-carousel-react";
import styles from "./CardActionTray.module.css";

const CardActionTray: React.FC<CardActionTrayProps> = ({
  activePlayer = "player",
  availableCards,
  onSelectCard,
  resourceSelection = false,
  setResourceSelection,
  availableResources = 0,
  totalResources = 0,
  selectedResourceCards = [],
  handlePlayCard,
}) => {
  const [isPlayCardMode, setIsPlayCardMode] = useState(false);
  const [emblaRef, embla] = useEmblaCarousel({ loop: false });

  useEffect(() => {
    // Disable card selection when not in resource selection or play card mode
    if (!resourceSelection && !isPlayCardMode) {
      // Optionally, reset selected cards if needed
    }
  }, [resourceSelection, isPlayCardMode]);

  const handleCardClick = (card: FaceCardProps) => {
    if (resourceSelection && activePlayer === "player") {
      onSelectCard && onSelectCard(card);
    } else if (isPlayCardMode && activePlayer === "player") {
      handlePlayCard && handlePlayCard(card);
      // Exit play card mode after playing a card
      setIsPlayCardMode(false);
    }
  };

  const togglePlayCardMode = () => {
    if (availableResources > 0) {
      setIsPlayCardMode(!isPlayCardMode);
    }
  };

  const bottomRow =
    activePlayer === "player" ? (
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        spacing={2}
        sx={{ marginTop: "1vh" }}
      >
        <Typography variant="h6" sx={{ color: "white" }}>
          Choose an Action:
        </Typography>
        <Button variant="contained">Pass [Space]</Button>
        <Button variant="contained">Claim Initiative</Button>
        <Button
          variant="contained"
          sx={{ backgroundColor: resourceSelection ? "red" : "green" }}
          onClick={() => {
            setResourceSelection
              ? setResourceSelection(!resourceSelection)
              : console.log("setResourceSelection not defined");
          }}
        >
          {resourceSelection
            ? "Stop Resource Selection"
            : "Start Resource Selection"}
        </Button>
        <Button
          variant="contained"
          sx={{
            backgroundColor: isPlayCardMode ? "gold" : "green",
            color: isPlayCardMode ? "black" : "white",
          }}
          onClick={togglePlayCardMode}
          disabled={availableResources === 0}
        >
          {isPlayCardMode ? "Cancel Play Card" : "Play a Card"}
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
                    id={card.id}
                    name={card.name}
                    selected={card.selected}
                    handleSelect={() => handleCardClick(card)}
                    disabled={
                      (resourceSelection &&
                        availableResources >= totalResources) ||
                      (isPlayCardMode && availableResources === 0)
                    }
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
