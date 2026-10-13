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
    UsernameChangesBlocked = 'UsernameChangesBlocked',
    ChangeUsername = 'ChangeUsername',
}

/** Reset names are this prefix plus a random four-digit number, e.g. KaraUser0427. */
export const RESET_USERNAME_PREFIX = 'KaraUser';

/**
 * Validation properties mirror ModActionDefinitions on the server.
 * supportsUsernameReset enables a client-only shortcut that submits a separate ChangeUsername action.
 */
export interface IModActionDefinition {
    label: string;
    requiresNote: boolean;
    requiresDuration: boolean;
    cancellable: boolean;
    requiresNewUsername: boolean;
    supportsUsernameReset: boolean;
}

export const modActionDefinitions: Record<ModActionType, IModActionDefinition> = {
    [ModActionType.Mute]: {
        label: 'Mute',
        requiresNote: true,
        requiresDuration: true,
        cancellable: true,
        requiresNewUsername: false,
        supportsUsernameReset: false,
    },
    [ModActionType.Warning]: {
        label: 'Warning',
        requiresNote: true,
        requiresDuration: false,
        cancellable: false,
        requiresNewUsername: false,
        supportsUsernameReset: false,
    },
    [ModActionType.Rename]: {
        label: 'Force User to Rename',
        requiresNote: false,
        requiresDuration: false,
        cancellable: false,
        requiresNewUsername: false,
        supportsUsernameReset: false,
    },
    [ModActionType.ReportingDisabled]: {
        label: 'Disable Reporting',
        requiresNote: true,
        requiresDuration: false,
        cancellable: true,
        requiresNewUsername: false,
        supportsUsernameReset: false,
    },
    [ModActionType.UsernameChangesBlocked]: {
        label: 'Block Username Changes',
        requiresNote: true,
        requiresDuration: false,
        cancellable: true,
        requiresNewUsername: false,
        supportsUsernameReset: true,
    },
    [ModActionType.ChangeUsername]: {
        label: 'Change Username',
        requiresNote: true,
        requiresDuration: false,
        cancellable: false,
        requiresNewUsername: true,
        supportsUsernameReset: false,
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
}

export interface IPlayerSearchResult {
    id: string;
    username: string;
    createdAt: string;
    lastLogin: string;
    isMuted: boolean;
    activeRename?: IActiveModActionCacheEntry;
    activeReportingDisabledId?: string | null;
    activeUsernameChangesBlockedId?: string | null;
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
    UsernameChangedByModerator = 'UsernameChangedByModerator',
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