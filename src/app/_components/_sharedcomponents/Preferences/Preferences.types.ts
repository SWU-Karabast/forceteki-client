import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';

export type IButtonType = {
    variant: 'concede' | 'standard' | 'warning',
    text?: string,
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

export interface IRegisteredCosmeticOption {
    id: string;
    title: string;
    type: RegisteredCosmeticType;
    path: string;
    darkened?: boolean;
}

export interface IRegisteredCosmetics {
    cardbacks: IRegisteredCosmeticOption[];
    backgrounds: IRegisteredCosmeticOption[];
    //playmats: IRegisteredCosmeticOption[];
}

// constants
export enum StatsSaveStatus {
    Warning = 'Warning',
    Error = 'Error',
    Success = 'Success'
}

export enum StatsSource {
    Karabast = 'Karabast',
    SwuStats = 'SWUStats'
}
export enum PlayerReportType {
    OffensiveUsername = 'offensive username',
    ChatHarrasment = 'chat harrasment',
    AbusingMechanics = 'abusing mechanics',
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