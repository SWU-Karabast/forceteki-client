import { SxProps } from '@mui/material';
import { Theme } from '@mui/material/styles';

export type IButtonType = {
    variant: 'concede' | 'standard',
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

export type CosmeticType = 'cardback' | 'background' | 'playmat';

export interface CosmeticOption {
    id: string;
    title: string;
    type: CosmeticType;
    path: string;
    darkened?: boolean;
};

export interface Cosmetics {
    cardbacks: CosmeticOption[];
    backgrounds: CosmeticOption[];
    playmats: CosmeticOption[];
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