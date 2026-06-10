// app/_utils/deckTypes.ts
//
// Leaf module containing the deck value/type definitions consumed by both
// `fetchDeckData.ts` and the per-provider modules under `deckProviders/`.
// Keeping these here (rather than in `fetchDeckData.ts`) breaks the
// `fetchDeckData.ts` <-> `deckProviders/*` import cycle that otherwise
// causes `DeckSource` to be `undefined` at module-init time on the SSR pass.

export interface IDeckMetadata {
    name: string;
    author?: string;
}

export interface IDeckCard {
    id: string;
    count: number;
}

export enum DeckSource {
    NotSupported = 'NotSupported',
    SWUStats = 'SWUStats',
    SWUDB = 'SWUDB',
    SWUnlimitedDB = 'SWUnlimitedDB',
    SWUCardHub = 'SWUCardHub',
    SWUBase = 'SWUBase',
    SWUMetaStats = 'SWUMetaStats',
    MySWU = 'MySWU',
    ProtectThePod = 'ProtectThePod',
    SWUForge = 'SWUForge',
    KyberDecks = 'KyberDecks',
    CardCore = 'CardCore',
    HoloScan = 'HoloScan',
    Melee = 'Melee'
}

export interface IDeckData {
    metadata: IDeckMetadata;
    leader: IDeckCard;
    secondleader: IDeckCard | null;
    base: IDeckCard;
    deck: IDeckCard[];
    sideboard: IDeckCard[];
    deckSource: DeckSource;
    deckID: string;
    deckLink: string;
    isPresentInDb?: boolean;
}
