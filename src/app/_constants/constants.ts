import { DeckSource } from '../_utils/fetchDeckData';

export const ENABLE_NEXT_SET_PREVIEW = false;

export enum MatchmakingType {
    PublicLobby= 'publicLobby',
    PrivateLobby = 'privateLobby',
    Quick = 'quick',
}

export enum SwuGameFormat {
    Premier = 'premier',
    NextSetPreview = 'nextSetPreview',
    Open = 'open',
    Eternal = 'eternal',
}

export const NewGameFormatAvailable: SwuGameFormat | undefined = SwuGameFormat.Eternal;

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

// Combined format + game mode for queue/lobby creation
export interface IQueueFormat {
    format: SwuGameFormat;
    gamesToWinMode: GamesToWinMode;
}

export const DefaultFormat: IQueueFormat = {
    format: SwuGameFormat.Premier,
    gamesToWinMode: GamesToWinMode.BestOfOne,
}

const AllLobbyFormats: SwuGameFormat[] = [
    SwuGameFormat.Premier,
    SwuGameFormat.NextSetPreview,
    SwuGameFormat.Eternal,
    SwuGameFormat.Open,
];

const AllQueueFormats: SwuGameFormat[] = [
    SwuGameFormat.Premier,
    SwuGameFormat.NextSetPreview,
    SwuGameFormat.Eternal,
];

export const LobbyFormats: SwuGameFormat[] = ENABLE_NEXT_SET_PREVIEW
    ? AllLobbyFormats
    : AllLobbyFormats.filter((fmt) => fmt !== SwuGameFormat.NextSetPreview);

export const QueueFormats: SwuGameFormat[] = ENABLE_NEXT_SET_PREVIEW
    ? AllQueueFormats
    : AllQueueFormats.filter((fmt) => fmt !== SwuGameFormat.NextSetPreview);

export const GamesToWinModeLabels: Record<GamesToWinMode, string> = {
    [GamesToWinMode.BestOfOne]: 'Best-of-One',
    [GamesToWinMode.BestOfThree]: 'Best-of-Three',
}

export const FormatLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.NextSetPreview]: 'Next Set Preview',
    [SwuGameFormat.Open]: 'Open',
    [SwuGameFormat.Eternal]: 'Eternal',
};

export const FormatTagLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.NextSetPreview]: 'Next Set',
    [SwuGameFormat.Open]: 'Open',
    [SwuGameFormat.Eternal]: 'Eternal',
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
            case DeckSource.SwuForge:
                return 'swuforge.com';
            case DeckSource.SWUMetaStats:
                return 'swumetastats.com';
            case DeckSource.MySWU:
                return 'my-swu.com';
            case DeckSource.ProtectThePod:
                return 'protectthepod.com';
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
