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

    /** TwinSuns only: the two leaders are the same card (or different printings of the same card). */
    DuplicateLeaders = 'duplicateLeaders',

    /** TwinSuns only: deck has a primary leader but is missing a secondary leader. */
    MissingSecondLeader = 'missingSecondLeader',

    /** TwinSuns only: one leader has the Heroism aspect and the other has Villainy — an illegal pairing. */
    MixedAlignmentLeaders = 'mixedAlignmentLeaders',
}

export enum DecklistLocation {
    Leader = 'leader',
    Base = 'base',
    Deck = 'deck'
}

export enum IllegalInFormatReason {

    /** Card's set is not legal in this format (outside the rotation, never legal, or an unreleased preview set). */
    NotLegalInFormat = 'notLegalInFormat',

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

    /** Twin Suns only: the two leaders are the same card (or different printings of the same card). */
    [DeckValidationFailureReason.DuplicateLeaders]?: boolean;

    /** Twin Suns only: the deck has a primary leader but no secondary leader. */
    [DeckValidationFailureReason.MissingSecondLeader]?: boolean;

    /** Twin Suns only: one leader has the Heroism aspect and the other has Villainy — an illegal pairing. */
    [DeckValidationFailureReason.MixedAlignmentLeaders]?: boolean;
}