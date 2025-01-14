export type IButtonType = {
    variant: 'concede' | 'standard',
    text: string,
    buttonFnc?: () => void
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
}

export interface IPreferenceProps {
    isPreferenceOpen: boolean,
    tabs: string[],
    preferenceToggle: () => void,
    title?: string,
    subtitle?: string,
}