export type IButtonType = {
    variant: 'concede' | 'standard',
    text: string,
    buttonFnc?: () => void
    disabled?: boolean
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
    variant?: 'gameBoard' | 'homePage'
}

export type IBlockedUser = {
    username: string,
}

export interface IPreferenceProps {
    isPreferenceOpen: boolean,
    tabs: string[],
    preferenceToggle?: () => void,
    variant?: 'gameBoard' | 'homePage'
    title?: string,
    subtitle?: string,
}