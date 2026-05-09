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

/**
 * Mirrors the BE `Aspect` enum from `forceteki/server/game/core/Constants.ts`.
 * Used by the matchmaking-queue base-aspect filter.
 */
export enum Aspect {
    Aggression = 'aggression',
    Command = 'command',
    Cunning = 'cunning',
    Heroism = 'heroism',
    Vigilance = 'vigilance',
    Villainy = 'villainy',
}

/**
 * Constraint on which bases a filtered opponent's deck can use, paired with a
 * leader. Omit `baseConstraint` for "any base of this leader".
 *
 * `baseType` carries the inline list of acceptable card ids — used both for
 * unique named bases (a single id) and for functionally-grouped types like
 * "Aggression - Force" (multiple printed cards). The optional `label` is for
 * display only; the BE rule only inspects `baseIds`.
 *
 * Wire-format mirror of the BE type in `forceteki/server/gamenode/MatchmakingRules.ts`.
 */
export type BaseConstraint =
    | { kind: 'aspect'; aspect: Aspect }
    | { kind: 'baseType'; baseIds: string[]; label?: string };

export interface IBaseTypeOption {
    id: string;
    label: string;
    aspect: string;
    hp: number;
    rarity: string | null;
    baseIds: string[];
    representativeId: string;
}

export interface OpponentArchetype {
    leaderId: string;
    baseConstraint?: BaseConstraint;
}

export interface MatchPreferences {
    enabled: boolean;
    allowedArchetypes: OpponentArchetype[];
}

export const DefaultMatchPreferences: MatchPreferences = {
    enabled: false,
    allowedArchetypes: [],
};

export const MATCH_PREFERENCES_LOCALSTORAGE_KEY = 'matchPreferences';
export const NARROW_FILTER_THRESHOLD = 2;

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
    { format: SwuGameFormat.Eternal, cardPools: [CardPool.Current, CardPool.NextSet], gamesToWinModes: [GamesToWinMode.BestOfOne, GamesToWinMode.BestOfThree] },
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
    [GamesToWinMode.BestOfOne]: 'Best-of-One',
    [GamesToWinMode.BestOfThree]: 'Best-of-Three',
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
            case DeckSource.KyberDecks:
                return 'kyberdecks.com';
            case DeckSource.CardCore:
                return 'cardcore.gg';
            case DeckSource.HoloScan:
                return 'holoscan.net';
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
