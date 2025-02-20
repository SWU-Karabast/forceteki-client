export enum DeckValidationFailureReason {
    NotImplemented = 'notImplemented',
    IllegalInFormat = 'illegalInFormat',
    TooManyLeaders = 'tooManyLeaders',
    InvalidDeckData = 'invalidDeckData',
    MinDecklistSizeNotMet = 'minDecklistSizeNotMet',
    MinMainboardSizeNotMet = 'minMainboardSizeNotMet',
    MaxSideboardSizeExceeded = 'maxSideboardSizeExceeded',
    TooManyCopiesOfCard = 'tooManyCopiesOfCard',
    UnknownCardId = 'unknownCardId',
}

export interface ICardIdAndName {
    id: string;
    name: string;
}

export interface IDeckValidationFailures {
    [DeckValidationFailureReason.NotImplemented]?: ICardIdAndName[];
    [DeckValidationFailureReason.IllegalInFormat]?: ICardIdAndName[];
    [DeckValidationFailureReason.TooManyLeaders]?: boolean;
    [DeckValidationFailureReason.InvalidDeckData]?: boolean;
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