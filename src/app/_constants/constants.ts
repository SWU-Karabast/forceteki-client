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

export const enum DefaultCosmeticId {
    Cardback = '5da51f47-66f2-4c3a-a016-c979246034a7',
    Background = 'eabf26d3-a85c-4999-a045-abf143518faf',
    Playmat = '00000000-0000-0000-0000-000000000003',
}