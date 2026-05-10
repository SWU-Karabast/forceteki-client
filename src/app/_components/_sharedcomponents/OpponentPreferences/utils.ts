import { createFilterOptions } from '@mui/material/Autocomplete';
import { Aspect, BaseConstraint, IBaseTypeOption } from '@/app/_constants/constants';

export interface LeaderOption {
    name: string;
    id: string;
    subtitle?: string;
}

export type BaseConstraintKind = 'any' | 'aspect' | 'baseType';

// Aspects offered in the 'any base of aspect' picker. Bases only carry the
// four 'color' aspects — Heroism / Villainy are alignment aspects on
// leaders/units, not on bases.
export const ASPECT_OPTIONS: Aspect[] = [
    Aspect.Aggression,
    Aspect.Command,
    Aspect.Cunning,
    Aspect.Vigilance,
];

const ASPECT_NAME = '(?:Aggression|Command|Cunning|Heroism|Vigilance|Villainy)';
const ASPECT_PREFIX_PATTERN = new RegExp(`^${ASPECT_NAME}(?:\\s*/\\s*${ASPECT_NAME})*\\s*-\\s*`);

// Bases tagged 'neutral' have no aspect-icon image.
const VALID_BASE_ASPECTS = new Set(['aggression', 'command', 'cunning', 'vigilance']);

export const aspectIconUrl = (aspect: string) => `/aspect-icons/aspect-${aspect}.webp`;

export function aspectHasIcon(aspect: string | null | undefined): aspect is string {
    return !!aspect && VALID_BASE_ASPECTS.has(aspect.toLowerCase());
}

export function displayBaseLabel(label: string): string {
    return label.replace(ASPECT_PREFIX_PATTERN, '');
}

export function getConstraintKind(constraint: BaseConstraint | undefined): BaseConstraintKind {
    if (!constraint) {
        return 'any';
    }
    return constraint.kind;
}

export function leaderLabel(option: LeaderOption | null): string {
    if (!option) {
        return '';
    }
    return option.subtitle ? `${option.name} - ${option.subtitle}` : option.name;
}

export function baseTypeLabel(option: IBaseTypeOption | null): string {
    return option?.label ?? '';
}

export function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

// Filter on the displayed label so typing 'agg' doesn't match every
// Aggression-prefix multi-card group.
export const baseTypeFilter = createFilterOptions<IBaseTypeOption>({
    stringify: (option) => displayBaseLabel(option.label),
});
