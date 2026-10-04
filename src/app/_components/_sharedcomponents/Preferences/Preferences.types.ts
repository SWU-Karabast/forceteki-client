import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';
import { ReactNode } from 'react';

export type IButtonType = {
    variant: 'concede' | 'standard' | 'warning',
    text?: string | ReactNode,
    buttonFnc?: () => void,
    disabled?: boolean,
    sx?: SxProps<Theme>,
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
}

export type ICosmeticItem = {
    id: string,
    path: string,
    title: string,
    selected: boolean,
    onClick: (id: string) => void,
    isNoneOption?: boolean,
}

export type IPreferenceOptions = {
    option: string,
    optionDescription: string,
}

export interface IVerticalTabsProps {
    tabs: string[]
    variant?: 'gameBoard' | 'homePage',
    attemptingClose?: boolean,
    closeHandler?: () => void,
    cancelCloseHandler?: () => void,
    initialTab?: string,
}

export type IBlockedUser = {
    username: string,
}

export interface IPreferenceProps {
    isPreferenceOpen: boolean,
    sidebarOpen: boolean,
    tabs: string[],
    preferenceToggle?: () => void,
    variant?: 'gameBoard' | 'homePage'
    title?: string,
    subtitle?: string,
    initialTab?: string,
}

export interface IStatsNotification {
    id: string;
    success: boolean;
    type: StatsSaveStatus;
    source: StatsSource;
    message: string;
}

// Registered cosmetic types
export enum RegisteredCosmeticType {
    Cardback = 'cardback',
    Background = 'background',
    // Playmat = 'playmat',
}

export interface ICosmeticEntity {
    id: string;
    title: string;
    type: RegisteredCosmeticType;
    path: string;
}

export interface IActiveCosmetics {
    cardback: ICosmeticEntity;
    background: ICosmeticEntity;
}

export interface IRegisteredCosmetics {
    cardbacks: ICosmeticEntity[];
    backgrounds: ICosmeticEntity[];
    // playmats: ICosmeticEntity[];
}

// constants
export enum StatsSaveStatus {
    Warning = 'Warning',
    Error = 'Error',
    Success = 'Success'
}

export enum StatsSource {
    Karabast = 'Karabast',
    SwuStats = 'SWUStats',
    SwuBase = 'SWUBase'
}

export enum PlayerReportType {
    OffensiveUsername = 'offensiveUsername',
    ChatHarrasment = 'chatHarrasment',
    AbusingMechanics = 'abusingMechanics',
    Other = 'other',
}

export interface IReportTypeConfig {
    type: PlayerReportType;
    label: string;
    description: string;
}

export interface IPlayerReportDialogProps {
    open: boolean;
    onClose: () => void;
}

export enum ModActionType {
    Mute = 'Mute',
    Warning = 'Warning',
    Rename = 'Rename',
    ReportingDisabled = 'ReportingDisabled',
}

/**
 * Per-type behaviour, mirroring ModActionDefinitions on the server. Keep the two in sync — the server
 * re-validates everything, so a mismatch shows up as a rejected submission rather than a hole.
 */
export interface IModActionDefinition {
    label: string;
    requiresNote: boolean;
    requiresDuration: boolean;
    cancellable: boolean;
}

export const modActionDefinitions: Record<ModActionType, IModActionDefinition> = {
    [ModActionType.Mute]: {
        label: 'Mute',
        requiresNote: true,
        requiresDuration: true,
        cancellable: true,
    },
    [ModActionType.Warning]: {
        label: 'Warning',
        requiresNote: true,
        requiresDuration: false,
        cancellable: false,
    },
    [ModActionType.Rename]: {
        label: 'Force Rename',
        requiresNote: false,
        requiresDuration: false,
        cancellable: false,
    },
    [ModActionType.ReportingDisabled]: {
        label: 'Disable Reporting',
        requiresNote: true,
        requiresDuration: false,
        cancellable: true,
    },
};

export interface IModActionResponse {
    id: string;
    playerId: string;
    actionType: ModActionType;
    durationDays?: number;
    note?: string;
    moderatorId: string;
    moderatorUsername: string;
    createdAt: string;
    startedAt?: string;
    expiresAt?: string;
    cancelledAt?: string;
    cancelledById?: string;
    cancelledByUsername?: string;
    relatedReportId?: string;
}

export interface IPlayerSearchResult {
    id: string;
    username: string;
    createdAt: string;
    lastLogin: string;
    isMuted: boolean;
    activeRename?: IActiveModActionCacheEntry;
    activeReportingDisabledId?: string | null;
}

export interface IActiveModActionCacheEntry {
    id: string;
    actionType: ModActionType;
    durationDays?: number;
    startedAt?: string;
    expiresAt?: string;
    modActionId: string;
}

export enum UsernameChangeSource {
    AccountCreation = 'AccountCreation',
    Migration = 'Migration',
    UserInitiated = 'UserInitiated',
    ForcedRename = 'ForcedRename',
}

export interface IUsernameChangeResponse {
    id: string;
    playerId: string;
    previousUsername: string | null;
    newUsername: string;
    source: UsernameChangeSource;
    relatedModActionId?: string;
    createdAt: string;
}

// ==================== Player reports (mod tools) ====================

export enum PlayerReportStatus {
    Open = 'Open',
    Closed = 'Closed',
}

export enum PlayerReportOutcome {
    Punished = 'Punished',
    NoAction = 'NoAction',
    FalseReport = 'FalseReport',
    TimerAbuse = 'TimerAbuse',
}

export enum PlayerReportRole {
    Reporter = 'Reporter',
    Reported = 'Reported',
}

export interface IPlayerReport {
    id: string;
    createdAt: string;
    status: PlayerReportStatus;
    reporterId: string;
    reporterUsername: string;
    reportedPlayerId: string;
    reportedPlayerUsername: string;
    offense: PlayerReportType | string;
    description: string;
    lobbyId: string;
    gameId?: string;
    gameFormat: string;
    matchType: string;
    gameStepsSinceLastUndo?: number;
    screenResolution?: { width: number; height: number };
    viewport?: { width: number; height: number };
    reportedPlayerPriorReportCount: number;
    reporterPriorFalseReportCount: number;
    claimedById?: string;
    claimedByUsername?: string;
    claimedAt?: string;
    closedAt?: string;
    closedById?: string;
    closedByUsername?: string;
    outcome?: PlayerReportOutcome;
    closingNote?: string;
    reopenedAt?: string;
    reopenedByUsername?: string;
    logsDeletedAt?: string;
}

export interface IPlayerReportLogLine {
    at: string;
    playerIds: string[];
    text: string;
}

export interface IPlayerReportLog {
    reportId: string;
    kind: 'Chat' | 'Game';
    lines: IPlayerReportLogLine[];
    truncated: boolean;
}

export interface IPlayerReportIndexEntry {
    reportId: string;
    playerId: string;
    role: PlayerReportRole;
    createdAt: string;
    offense: string;
    status: PlayerReportStatus;
    outcome?: PlayerReportOutcome;
}

export interface IPlayerReportPlayerContext {
    playerId: string;
    username: string;
    createdAt?: string;
    isMuted: boolean;
    activeRename: IActiveModActionCacheEntry | null;
    activeReportingDisabledId: string | null;
    modActions: IModActionResponse[];
    reportsAgainst: IPlayerReportIndexEntry[];
    reportsFiled: IPlayerReportIndexEntry[];
}

export interface IPlayerReportDetailResponse {
    success: boolean;
    report: IPlayerReport;
    chatLog: IPlayerReportLog | null;
    gameLog: IPlayerReportLog | null;
    reporter: IPlayerReportPlayerContext;
    reportedPlayer: IPlayerReportPlayerContext;
    ticketActions: IModActionResponse[];

    /** Id of the moderator who requested the report, as the server sees them */
    viewerId: string;
}

export interface IPlayerReportListResponse {
    success: boolean;
    reports: IPlayerReport[];
    nextBeforeMonth: string | null;
}

export interface IPlayerReportUpdateResponse {
    success: boolean;
    report?: IPlayerReport;
    message?: string;
}

export interface IFindUserResponse {
    success: boolean;
    players: IPlayerSearchResult[];
    modActions: IModActionResponse[];
    usernameChanges: IUsernameChangeResponse[];
}

/**
 * Global server settings, owned by the backend and toggleable by moderators at runtime.
 */
export interface IServerSettings {
    gamesEnabled: boolean;
    maintenanceMessage?: string;
    updatedBy?: string;
    updatedAt?: string;
}

export enum DurationUnit {
    Days = 'Days',
    Weeks = 'Weeks',
}