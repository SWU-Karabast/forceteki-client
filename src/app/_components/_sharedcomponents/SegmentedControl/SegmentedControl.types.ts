export interface ISegmentedControlOption<TValue extends string> {
    value: TValue;
    label: string;
    description?: string;
    disabled?: boolean;
}

export interface ISegmentedControlProps<TValue extends string> {
    name: string;
    label: string;
    value: TValue;
    options: readonly ISegmentedControlOption<TValue>[];
    onChange: (value: TValue) => void;
    disabled?: boolean;
}
