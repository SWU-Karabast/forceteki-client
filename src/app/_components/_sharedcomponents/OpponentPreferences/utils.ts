import { createFilterOptions } from '@mui/material/Autocomplete';
import { Aspect, BaseConstraint, IBaseTypeOption } from '@/app/_constants/constants';

export interface LeaderOption {
    name: string;
    id: string;
    subtitle?: string;
}

export type BaseConstraintKind = 'any' | 'aspect' | 'baseType';

// Heroism / Villainy are alignment aspects on leaders/units, not bases.
export const BASE_ASPECTS: Aspect[] = [
    Aspect.Aggression,
    Aspect.Command,
    Aspect.Cunning,
    Aspect.Vigilance,
];

const BASE_ASPECT_SET: Set<string> = new Set(BASE_ASPECTS);

export const aspectIconUrl = (aspect: string) => `/aspect-icons/aspect-${aspect}.webp`;

export function aspectHasIcon(aspect: string | null | undefined): aspect is string {
    return !!aspect && BASE_ASPECT_SET.has(aspect.toLowerCase());
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

export function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

export function baseTypeDisplayName(option: IBaseTypeOption): string {
    switch (option.kind) {
        case 'unique': return option.name ?? '';
        case 'standard': return 'Standard';
        case 'force': return 'Force';
        case 'splash': return 'Splash';
        case 'unknown': return `${option.hp}hp`;
    }
}

// Filter on display name so 'agg' doesn't match every Aggression group.
export const baseTypeFilter = createFilterOptions<IBaseTypeOption>({
    stringify: baseTypeDisplayName,
});
