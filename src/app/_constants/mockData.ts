export const mockPlayer: Participant = {
  id: "player1",
  type: "player",
  deckSize: 30,
  cards: Array.from({ length: 10 }, (_, i) => ({
    //cards in hand
    id: i + 1,
    name: `Player Card ${i + 1}`,
  })),
};

export const mockOpponent: Participant = {
  id: "opponent1",
  type: "opponent",
  deckSize: 25,
  cards: Array.from({ length: 10 }, (_, i) => ({
    //cards in hand
    id: i + 11,
    name: `Opponent Card ${i + 1}`,
  })),
};
