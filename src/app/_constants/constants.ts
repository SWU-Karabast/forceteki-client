import { DeckSource } from '../_utils/fetchDeckData';

export enum MatchType {
    Custom = 'Custom',
    Private = 'Private',
    Quick = 'Quick',
}

export enum SwuGameFormat {
    Premier = 'premier',
    NextSetPreview = 'nextSetPreview',
    Open = 'open'
}

export const FormatLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.NextSetPreview]: 'Next Set Preview',
    [SwuGameFormat.Open]: 'Open',
};

export const FormatTagLabels: Record<SwuGameFormat, string> = {
    [SwuGameFormat.Premier]: 'Premier',
    [SwuGameFormat.NextSetPreview]: 'Next Set',
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
