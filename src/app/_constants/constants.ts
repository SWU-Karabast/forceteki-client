import { DeckSource } from '../_utils/fetchDeckData';

export enum MatchmakingType {
    PublicLobby= 'publicLobby',
    PrivateLobby = 'privateLobby',
    Quick = 'quick',
}

export enum SwuGameFormat {
    Premier = 'premier',
    // NextSetPreview = 'nextSetPreview',
    Open = 'open'
}

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

export const QueueFormatOptions: Record<string, IQueueFormat> = {
    premierBo1: { format: SwuGameFormat.Premier, gamesToWinMode: GamesToWinMode.BestOfOne },
    premierBo3: { format: SwuGameFormat.Premier, gamesToWinMode: GamesToWinMode.BestOfThree },
    openBo1: { format: SwuGameFormat.Open, gamesToWinMode: GamesToWinMode.BestOfOne },
    openBo3: { format: SwuGameFormat.Open, gamesToWinMode: GamesToWinMode.BestOfThree },
};

export const QueueFormatLabels: Record<string, string> = {
    premierBo1: 'Premier Best-of-One',
    premierBo3: 'Premier Best-of-Three',
    openBo1: 'Open Best-of-One',
    openBo3: 'Open Best-of-Three',
};

export const DefaultQueueFormatKey = 'premierBo1';

export const FormatLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    // [SwuGameFormat.NextSetPreview]: 'Next Set Preview',
    [SwuGameFormat.Open]: 'Open',
};

export const FormatTagLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    // [SwuGameFormat.NextSetPreview]: 'Next Set',
    [SwuGameFormat.Open]: 'Open',
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

