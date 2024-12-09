import { CardData } from "../_components/_sharedcomponents/Cards/CardTypes";


interface DeckMetadata {
    name: string;
    author: string;
}

interface DeckCard {
    id: string;
    count: number;
}
interface ServerDeckCard {
    count: number;
    card: CardDetails
}
interface CardDetails {
    title: string;
    subtitle: string | null;
    cost: number | null;
    hp: number | null;
    power: number | null;
    text: string;
    deployBox: string | null;
    epicAction: string | null;
    unique: boolean;
    rules: string;
    id: string;
    aspects: string[];
    traits: string[];
    keywords: string[];
    types: string[];
    setId: {
        set: string;
        number: number;
    };
    internalName: string;
}

interface DeckData {
    metadata: DeckMetadata;
    leader: DeckCard;
    secondleader: DeckCard | null;
    base: DeckCard;
    deck: DeckCard[];
    sideboard: DeckCard[];
}

interface ServerDeckData {
    leader: DeckCard;
    secondleader: DeckCard | null;
    base: DeckCard;
    deckCards: DeckCard[];
    sideboard: DeckCard[];
}

type Mapping = {
    [id:string]: string;
}
type idToInternalNameMapping = {
    "id": string,
    "internalName": string,
    "title": string,
    "subtitle": string
}

export const s3ImageURL = (path: string) => {
    const s3Bucket = "https://karabast-assets.s3.amazonaws.com/";
    return s3Bucket + path;
};

export const s3CardImageURL = (card: CardData) => {
    if (!card) return "game/epic-action-token.webp";
    const cardNumber = card.setId.number.toString().padStart(3, "0") + (card.type === "leaderUnit" ? "-portrait" : "");
    return s3ImageURL(`cards/${card.setId.set}/${cardNumber}.webp`);
};


// Helper function to update a card's id
export const updateIdsWithMapping = (data: DeckData, mapping: Mapping): ServerDeckData => {

    const updateCard = (card: DeckCard): DeckCard => {
        const updatedId = mapping[card.id] || card.id; // Use mapping if available, else keep the original id
        return { ...card, id: updatedId };
    };

    return {
        leader: updateCard(data.leader),
        secondleader: data.secondleader,
        base: updateCard(data.base),
        deckCards: data.deck.map(updateCard), // Update all cards in the deck
        sideboard: data.sideboard.map(updateCard) // Update all cards in the sideboard
    };
};

// Helper function to update a cards id to its internal name
export function mapIdToInternalName(
    mapper: idToInternalNameMapping[],
    deckData: ServerDeckData
): ServerDeckData {
    // Convert the mapper array to a lookup map for faster access
    const idToNameMap = new Map<string, string>();
    mapper.forEach(entry => {
        idToNameMap.set(entry.id, entry.internalName);
    });

    // Helper function to update a single CardSlot
    const updateCardSlot = (slot: DeckCard): DeckCard => {
        const { id, count } = slot;
        const mappedName = idToNameMap.get(id);
        if (mappedName) {
            return { id: mappedName, count };
        } else {
            // If no mapping found, log a warning and retain the original ID
            console.warn(`No internalName mapping found for ID: ${id}`);
            return { id, count };
        }
    };

    // Update leader, secondleader, base
    const updatedLeader = updateCardSlot(deckData.leader);
    let updatedSecondLeader = null;
    if(deckData.secondleader) {
        updatedSecondLeader = updateCardSlot(deckData.secondleader);
    }
    const updatedBase = updateCardSlot(deckData.base);

    // Update deck and sideboard arrays
    const updatedDeck = deckData.deckCards.map(updateCardSlot).filter((slot): slot is DeckCard => slot !== null);
    const updatedSideboard = deckData.sideboard.map(updateCardSlot).filter((slot): slot is DeckCard => slot !== null);

    return {
        ...deckData,
        leader: updatedLeader,
        secondleader: updatedSecondLeader,
        base: updatedBase,
        deckCards: updatedDeck,
        sideboard: updatedSideboard
    };
}

// helper function to convert DeckWithInternalName to a playable set of cards.
// Fetch card details from the API
const fetchCardData = async (internalName: string): Promise<CardDetails | null> => {
    try {
        const response = await fetch(`/api/s3bucket?jsonFile=cards/${encodeURIComponent(internalName)}.json`);
        const cardDetails = await response.json();
        return cardDetails[0];
    } catch {
        console.error(`Failed to fetch card data for ${internalName}:`);
        return null;
    }
};

// Transform Deck with card details
export const transformDeckWithCardData = async (deckData: ServerDeckData): Promise<any> => {
    try {
        const transformCard = async (deckCard: DeckCard): Promise<ServerDeckCard | null> => {
            const cardData = await fetchCardData(deckCard.id);
            if (!cardData) return null;
            return {
                count: deckCard.count,
                card: cardData, // Add full card details under "card"
            };
        };

        const leader = await transformCard(deckData.leader);
        const secondleader = deckData.secondleader
            ? await transformCard(deckData.secondleader)
            : null;
        const base = await transformCard(deckData.base);
        const deckCards = (
            await Promise.all(deckData.deckCards.map((card) => transformCard(card)))
        ).filter((card) => card !== null);
        const sideboard = (
            await Promise.all(deckData.sideboard.map((card) => transformCard(card)))
        ).filter((card) => card !== null);
        return {
            leader: leader ? [leader] : [],
            base: base ? [base] : [],
            deckCards,
            selected:true,
        };
    } catch {
        console.error('Error transforming deck with card data');
        return null;
    }
};