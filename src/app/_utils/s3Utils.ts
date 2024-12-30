import { ICardData } from '../_components/_sharedcomponents/Cards/CardTypes';

// Deck data interfaces for deck info from swudb
interface IDeckMetadata {
    name: string;
    author: string;
}

interface IDeckCard {
    id: string;
    count: number;
}

interface IDeckData {
    metadata: IDeckMetadata;
    leader: IDeckCard;
    secondleader: IDeckCard | null;
    base: IDeckCard;
    deck: IDeckCard[];
    sideboard: IDeckCard[];
}

// Deck data interfaces for deck info on the server
interface IServerCardDetails {
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

interface IServerDeckCard {
    count: number;
    card: IServerCardDetails;
}

interface IServerDeckData {
    leader: IServerDeckCard[];
    base: IServerDeckCard[];
    deckCards: IServerDeckCard[];
    sideboard: IServerDeckCard[];
}

// types of mapping
type IMapping = {
    [id:string]: string;
}
type IIdToInternalNameMapping = {
    id: string,
    internalName: string,
    title: string,
    subtitle: string
}

export const s3ImageURL = (path: string) => {
    const s3Bucket = 'https://karabast-assets.s3.amazonaws.com/';
    return s3Bucket + path;
};

export const s3CardImageURL = (card: ICardData) => {
    if (!card) return 'game/epic-action-token.webp';
    const cardNumber = card.setId.number.toString().padStart(3, '0') + (card.type === 'leaderUnit' ? '-portrait' : '');
    return s3ImageURL(`cards/${card.setId.set}/${cardNumber}.webp`);
};

export const s3TokenImageURL = (token_name: string) =>{
    return s3ImageURL(`game/${token_name}.webp`);
}


// Helper function to update a card's id
export const updateIdsWithMapping = (data: IDeckData, mapping: IMapping): IDeckData => {
    const updateCard = (card: IDeckCard): IDeckCard => {
        const updatedId = mapping[card.id] || card.id; // Use mapping if available, else keep the original id
        return { ...card, id: updatedId };
    };

    return {
        metadata: data.metadata,
        leader: updateCard(data.leader),
        secondleader: data.secondleader,
        base: updateCard(data.base),
        deck: data.deck.map(updateCard), // Update all cards in the deck
        sideboard: data.sideboard.map(updateCard) // Update all cards in the sideboard
    };
};

// Helper function to update a cards id to its internal name
export function mapIdToInternalName(
    mapper: IIdToInternalNameMapping[],
    deckData: IDeckData
): IDeckData {
    // Convert the mapper array to a lookup map for faster access
    const idToNameMap = new Map<string, string>();
    mapper.forEach(entry => {
        idToNameMap.set(entry.id, entry.internalName);
    });

    // Helper function to update a single CardSlot
    const updateCardSlot = (slot: IDeckCard): IDeckCard => {
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
    const updatedDeck = deckData.deck.map(updateCardSlot).filter((slot): slot is IDeckCard => slot !== null);
    const updatedSideboard = deckData.sideboard.map(updateCardSlot).filter((slot): slot is IDeckCard => slot !== null);

    return {
        metadata: deckData.metadata,
        leader: updatedLeader,
        secondleader: updatedSecondLeader,
        base: updatedBase,
        deck: updatedDeck,
        sideboard: updatedSideboard
    };
}

// helper function to convert DeckWithInternalName to a playable set of cards.
// Fetch card details from the API
const fetchCardData = async (internalName: string): Promise<IServerCardDetails | null> => {
    try {
        const response = await fetch(`/api/s3bucket?jsonFile=cards/${encodeURIComponent(internalName)}.json`);
        const cardDetails = await response.json();
        // Do we want to inform the user that some of the cards weren't imported?
        if(cardDetails.status){
            console.error(`Failed to fetch card data for ${internalName}:`);
            return null
        }
        return cardDetails[0];
    } catch {
        console.error(`Failed to fetch card data for ${internalName}:`);
        return null;
    }
};

// Transform Deck with card details
export const transformDeckWithCardData = async (deckData: IDeckData): Promise<IServerDeckData | null> => {
    try {
        const transformCard = async (deckCard: IDeckCard): Promise<IServerDeckCard | null> => {
            const cardData = await fetchCardData(deckCard.id);
            if (!cardData) return null;
            return {
                count: deckCard.count,
                card: cardData, // Add full card details under "card"
            };
        };

        const leader = await transformCard(deckData.leader);
        const base = await transformCard(deckData.base);
        const deckCards = (
            await Promise.all(deckData.deck.map((card) => transformCard(card)))
        ).filter((card) => card !== null);
        const sideboard = (
            await Promise.all(deckData.sideboard.map((card) => transformCard(card)))
        ).filter((card) => card !== null);
        return {
            leader: leader ? [leader] : [],
            base: base ? [base] : [],
            deckCards,
            sideboard,
        };
    } catch {
        console.error('Error transforming deck with card data');
        return null;
    }
};