import { DeckSource } from '../_utils/fetchDeckData';

export enum MatchmakingType {
    PublicLobby= 'publicLobby',
    PrivateLobby = 'privateLobby',
    Quick = 'quick',
}

export enum SwuGameFormat {
    Premier = 'premier',
    Eternal = 'eternal',
    Limited = 'limited',
    Open = 'open',
}

export enum CardPool {
    Current = 'current',
    NextSet = 'nextSet',
    Unlimited = 'unlimited',
}

export const NewGameFormatAvailable: SwuGameFormat | undefined = SwuGameFormat.Limited;

export enum GamesToWinMode {
    BestOfOne = 'bestOfOne',
    BestOfThree = 'bestOfThree',
}

export enum RematchMode {
    Regular = 'regular',
    Reset = 'reset',
    Bo1ConvertToBo3 = 'bo1ConvertToBo3',
    NewBo3 = 'newBo3'
}

export interface IMatchConfiguration {
    format: SwuGameFormat;
    cardPool: CardPool;
    gamesToWinMode: GamesToWinMode;
}

export const DefaultFormat: IMatchConfiguration = {
    format: SwuGameFormat.Premier,
    cardPool: CardPool.Current,
    gamesToWinMode: GamesToWinMode.BestOfOne,
}

// Per-format config describing what card pools and match types are allowed
export interface IFormatModeConfig {
    format: SwuGameFormat;
    cardPools: CardPool[];
    gamesToWinModes: GamesToWinMode[];
}

export const LobbyFormatConfigs: IFormatModeConfig[] = [
    { format: SwuGameFormat.Premier, cardPools: [CardPool.Current], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
    { format: SwuGameFormat.Eternal, cardPools: [CardPool.Current], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
    { format: SwuGameFormat.Open, cardPools: [CardPool.Unlimited], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
    { format: SwuGameFormat.Limited, cardPools: [CardPool.Current, CardPool.Unlimited], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
];

export const QueueFormatConfigs: IFormatModeConfig[] = [
    { format: SwuGameFormat.Premier, cardPools: [CardPool.Current], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
    { format: SwuGameFormat.Eternal, cardPools: [CardPool.Current], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
];

// Helper to get the list of formats from a config array
export const getFormatsFromConfig = (configs: IFormatModeConfig[]): SwuGameFormat[] =>
    configs.map((c) => c.format);

// Helper to look up config for a specific format
export const getFormatConfig = (configs: IFormatModeConfig[], format: SwuGameFormat): IFormatModeConfig | undefined =>
    configs.find((c) => c.format === format);

export const GamesToWinModeLabels: Record<GamesToWinMode, string> = {
    [GamesToWinMode.BestOfOne]: 'One Big Bonk',
    [GamesToWinMode.BestOfThree]: 'Three Big Bonks',
}

export const CardPoolLabels: Record<CardPool, string> = {
    [CardPool.Current]: 'Current',
    [CardPool.NextSet]: 'Next Set',
    [CardPool.Unlimited]: 'Unlimited',
}

export const FormatLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.Open]: 'Open',
    [SwuGameFormat.Eternal]: 'Eternal',
    [SwuGameFormat.Limited]: 'Limited',
};

export const FormatTagLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.Open]: 'Open',
    [SwuGameFormat.Eternal]: 'Eternal',
    [SwuGameFormat.Limited]: 'Limited',
};

export const SupportedDeckSources = Object.values(DeckSource)
    .filter((source) => source !== DeckSource.NotSupported)
    .map((source) => {
        switch (source) {
            case DeckSource.SWUStats:
                return 'swustats.net';
            case DeckSource.SWUDB:
                return 'swudb.com';
            case DeckSource.SWUnlimitedDB:
                return 'sw-unlimited-db.com';
            case DeckSource.SWUCardHub:
                return 'swucardhub.fr';
            case DeckSource.SWUBase:
                return 'swubase.com';
            case DeckSource.SWUMetaStats:
                return 'swumetastats.com';
            case DeckSource.MySWU:
                return 'my-swu.com';
            case DeckSource.ProtectThePod:
                return 'protectthepod.com';
            case DeckSource.SWUForge:
                return 'swuforge.com';
            default:
                return source;
        }
    })
    .sort();

export enum ZoneName {
    Base = 'base',
    Capture = 'capture',
    Deck = 'deck',
    Discard = 'discard',
    GroundArena = 'groundArena',
    Hand = 'hand',
    OutsideTheGame = 'outsideTheGame',
    Resource = 'resource',
    SpaceArena = 'spaceArena',
}

export enum QuickUndoAvailableState {
    NoSnapshotAvailable = 'noSnapshotAvailable',
    UndoRequestsBlocked = 'undoRequestsBlocked',
    FreeUndoAvailable = 'freeUndoAvailable',
    RequestUndoAvailable = 'requestUndoAvailable',
    WaitingForConfirmation = 'waitingForConfirmation',
}

// Bo3 Set End Result types
export enum Bo3SetEndedReason {
    Concede = 'concede',
    OnePlayerLobbyTimeout = 'onePlayerLobbyTimeout',
    BothPlayersLobbyTimeout = 'bothPlayersLobbyTimeout',
    WonTwoGames = 'wonTwoGames',
}

export interface IBo3ConcedeResult {
    endedReason: Bo3SetEndedReason.Concede;
    concedingPlayerId: string;
}

export interface IBo3OnePlayerTimeoutResult {
    endedReason: Bo3SetEndedReason.OnePlayerLobbyTimeout;
    timeoutPlayerId: string;
}

export interface IBo3BothPlayersTimeoutResult {
    endedReason: Bo3SetEndedReason.BothPlayersLobbyTimeout;
}

export interface IBo3WonGamesResult {
    endedReason: Bo3SetEndedReason.WonTwoGames;
}

export type IBo3SetEndResult = IBo3ConcedeResult | IBo3OnePlayerTimeoutResult | IBo3BothPlayersTimeoutResult | IBo3WonGamesResult;
