export enum DeckValidationFailureReason {
    NotImplemented = 'notImplemented',
    DeckSetToPrivate = 'deckSetToPrivate',
    IllegalInFormat = 'illegalInFormat',
    TooManyLeaders = 'tooManyLeaders',
    InvalidDecklistLocation = 'invalidCardLocation',
    InvalidDeckData = 'invalidDeckData',
    MinDecklistSizeNotMet = 'minDecklistSizeNotMet',
    MinMainboardSizeNotMet = 'minMainboardSizeNotMet',
    MaxSideboardSizeExceeded = 'maxSideboardSizeExceeded',
    TooManyCopiesOfCard = 'tooManyCopiesOfCard',
    UnknownCardId = 'unknownCardId',
}

export enum DecklistLocation {
    Leader = 'leader',
    Base = 'base',
    Deck = 'deck'
}

export enum IllegalInFormatReason {

    /** Card's set is not part of the legal rotation/card pool for this format. */
    RotatedOut = 'rotatedOut',

    /** Card is from a preview set that has not yet been officially released. */
    Preview = 'preview',

    /** Card is on this format's suspension list. */
    Suspended = 'suspended',

    /** Card's set code is not recognized. */
    UnknownSet = 'unknownSet',
}

export interface ICardIdAndName {
    id: string;
    name: string;
}

export interface IIllegalCardEntry extends ICardIdAndName {
    reason?: IllegalInFormatReason;
}

export interface IDeckValidationFailures {
    [DeckValidationFailureReason.NotImplemented]?: ICardIdAndName[];
    [DeckValidationFailureReason.IllegalInFormat]?: IIllegalCardEntry[];
    [DeckValidationFailureReason.TooManyLeaders]?: boolean;
    [DeckValidationFailureReason.InvalidDecklistLocation]?: { card: ICardIdAndName; location: DecklistLocation }[];
    [DeckValidationFailureReason.InvalidDeckData]?: boolean;
    [DeckValidationFailureReason.DeckSetToPrivate]?: boolean;
    [DeckValidationFailureReason.MinDecklistSizeNotMet]?: {
        minDecklistSize: number;
        actualDecklistSize: number;
    };
    [DeckValidationFailureReason.MinMainboardSizeNotMet]?: {
        minBoardedSize: number;
        actualBoardedSize: number;
    };
    [DeckValidationFailureReason.MaxSideboardSizeExceeded]?: {
        maxSideboardSize: number;
        actualSideboardSize: number;
    };
    [DeckValidationFailureReason.TooManyCopiesOfCard]?: {
        card: ICardIdAndName;
        maxCopies: number;
        actualCopies: number;
    }[];
    [DeckValidationFailureReason.UnknownCardId]?: { id: string }[];
}