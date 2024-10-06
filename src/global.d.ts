interface BackCardProps {
  deckSize?: number;
}

type ParticipantType = "player" | "opponent";

interface Participant {
  id: string;
  type: ParticipantType;
  deckSize: number;
  cards: Card[];
}

interface ChatDrawerProps {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  chatHistory: string[];
  chatMessage: string;
  setChatMessage: React.Dispatch<React.SetStateAction<string>>;
  handleChatSubmit: () => void;
  currentRound: number;
}

interface PlayerCardTrayProps {
  participant: Participant;
  availableCards: Card[];
  resourceSelection: boolean;
  availableResources: number;
  totalResources: number;
  handleModalToggle: () => void;
  onSelectCard: (card: Card) => void;
  setResourceSelection: (active: boolean) => void;
}

interface OpponentCardTrayProps {
  participant: Participant;
  spacing: number;
}

interface BoardProps {
  spacing: number;
}

interface CardActionTrayProps {
  activePlayer: ParticipantType;
  availableCards: Card[];
  onSelectCard?: (card: Card) => void; // Optional, only for player
  resourceSelection?: boolean; // Optional, only for player
  setResourceSelection?: (active: boolean) => void;
  availableResources?: number; // Optional, only for player
  totalResources?: number; // Optional, only for player
}

type DeckSize = number;

interface DeckDiscardProps {
  deckSize: number;
}

interface FaceCardProps {
  id?: string;
  selected: boolean;
  handleSelect: () => void;
  disabled?: boolean;
}

interface ResourcesProps {
  availableResources: number;
  totalResources: number;
  activePlayer?: ParticipantType;
  handleModalToggle?: () => void;
}

interface ResourcesOverlayProps {
  isModalOpen: boolean;
  handleModalToggle: () => void;
  selectedResourceCards: Card[];
}
