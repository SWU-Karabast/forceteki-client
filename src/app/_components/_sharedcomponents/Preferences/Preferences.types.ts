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

export type ISleeve = {
    image: string,
    source: string,
    selected?: boolean,
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
    source: statsSource;
    message: string;
}

export enum StatsSaveStatus {
    Warning = 'Warning',
    Error = 'Error',
    Success = 'Success'
}

export enum statsSource {
    Karabast = 'Karabast',
    SwuStats = 'SWUStats'
}