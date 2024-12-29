import { IUnitsBoardProps } from "@/app/_components/Gameboard/GameboardTypes";
import { useGame } from "@/app/_contexts/Game.context";
import { Box, Grid2 as Grid } from "@mui/material";
import React from "react";
import { ICardData } from "../../_sharedcomponents/Cards/CardTypes";
import GameCard from "../../_sharedcomponents/Cards/GameCard/GameCard";

const UnitsBoard: React.FC<IUnitsBoardProps> = ({ sidebarOpen, arena }) => {
  //------------------------STYLES------------------------//
  const mainBoxStyle = {
    borderRadius: "20px",
    height: "60vh",
    width: sidebarOpen ? "32vw" : "36vw",
    ml: ".3vw",
    p: "1vh",
  };

  const containerStyle = {
    height: "100%",
  };

  const opponentGridStyle = {
    flexGrow: 1,
    display: "flex",
    justifyContent: arena == "groundArena" ? "flex-start" : "flex-end",
    alignItems: "flex-start",
    gap: "0.5vw",
    flexWrap: "nowrap",
    overflowX: "auto",
  };

  const playerGridStyle = {
    flexGrow: 1,
    display: "flex",
    justifyContent: arena == "groundArena" ? "flex-start" : "flex-end",
    alignItems: "flex-end",
    gap: "0.5vw",
    flexWrap: "nowrap",
    overflowX: "auto",
  };

  //------------------------CONTEXT------------------------//
  /**
   * Takes an array of cards which can be main units or upgrades,
   * and returns a new array of only upgrades,
   */
  const findUpgrades = (cards: ICardData[]): Record<string, ICardData[]> => {
    // Group upgrades by their parentCardId
    const upgradesByParentId: Record<string, ICardData[]> = {};

    cards.forEach((card) => {
      if (card.parentCardId) {
        // If this card is actually an upgrade that references a parent ID
        if (!upgradesByParentId[card.parentCardId]) {
          upgradesByParentId[card.parentCardId] = [];
        }
        upgradesByParentId[card.parentCardId].push(card);
      }
    });
    return upgradesByParentId;
  };
  /**
   * Takes an array of cards which can be main units or upgrades,
   * and returns a new array of only main cards,
   * each including a subcards array with any matching upgrades.
   */
  const attachUpgrades = (
    cards: ICardData[],
    upgradesByParentId: Record<string, ICardData[]>
  ): ICardData[] => {
    // For each "main" card (has NO parentCardId), attach the subcards
    const mainCards = cards
      .filter((card) => !card.parentCardId)
      .map((card) => ({
        ...card,
        subcards: card.uuid ? upgradesByParentId[card.uuid] ?? [] : [], // attach any upgrades belonging to this card
      }));
    return mainCards;
  };
  const { gameState, connectedPlayer, getOpponent } = useGame();

  const rawPlayerUnits = gameState?.players[connectedPlayer].cardPiles[arena];
  const rawOpponentUnits =
    gameState?.players[getOpponent(connectedPlayer)].cardPiles[arena];
  const allCardsInArena = [...rawPlayerUnits, ...rawOpponentUnits];
  const upgradeMapping = findUpgrades(allCardsInArena);
  const playerUnits = attachUpgrades(rawPlayerUnits, upgradeMapping);
  const opponentUnits = attachUpgrades(rawOpponentUnits, upgradeMapping);

  return (
    <Box sx={mainBoxStyle}>
      <Grid container direction="column" sx={containerStyle}>
        {/* Opponent's Ground Units */}
        <Grid sx={opponentGridStyle}>
          {opponentUnits.map((card: ICardData) => (
            <Box key={card.uuid} sx={{ flex: "0 0 auto" }}>
              <GameCard
                card={card}
                subcards={card.subcards}
                size="square"
                variant={"gameboard"}
              />
            </Box>
          ))}
        </Grid>

        {/* Player's Ground Units */}
        <Grid sx={playerGridStyle}>
          {playerUnits.map((card: ICardData) => (
            <Box key={card.uuid} sx={{ flex: "0 0 auto" }}>
              <GameCard
                card={card}
                subcards={card.subcards}
                size="square"
                variant={"gameboard"}
              />
            </Box>
          ))}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UnitsBoard;
