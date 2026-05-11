import type React from 'react';
import { createFilterOptions } from '@mui/material/Autocomplete';
import { Aspect, BaseConstraint, IBaseTypeOption } from '@/app/_constants/constants';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import type { BaseTileKind } from './BaseTilePreview';

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

export function aspectHasIcon(aspect: string | null | undefined): aspect is Aspect {
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
        case 'unique': return option.name;
        case 'standard': return 'Standard 30HP';
        case 'force': return 'Force 28HP';
        case 'splash': return 'Splash 27HP';
        case 'unknown': return 'Other';
    }
}

// Filter on display name so 'agg' doesn't match every Aggression group.
export const baseTypeFilter = createFilterOptions<IBaseTypeOption>({
    stringify: baseTypeDisplayName,
});

// Wrap s3CardImageURL for the common case where we only have a card id
// (no full ICardData/ISetCode payload). The shape-check inside s3Utils
// handles a bare {id} at runtime.
export function cardImageUrl(id: string, style?: CardStyle): string {
    return s3CardImageURL({ id, count: 0 } as never, style);
}

// Strip MUI Autocomplete's auto-generated `key` from the rendered <li>
// props — React needs the key passed explicitly via JSX, not through a
// spread. Returns the rest of the props ready for spreading.
export function pluckOptionProps(
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key },
): React.HTMLAttributes<HTMLLIElement> {
    const { key, ...rest } = props;
    void key;
    return rest;
}

// User-facing title for the "base" half of an archetype row, given the
// constraint and any resolved baseType for it.
export function formatBaseTitle(
    constraint: BaseConstraint | undefined,
    selectedBaseType: IBaseTypeOption | null,
): string {
    if (!constraint) {
        return 'Any base';
    }
    if (constraint.kind === 'aspect') {
        return `Any ${capitalize(constraint.aspect)}`;
    }
    if (selectedBaseType) {
        return baseTypeDisplayName(selectedBaseType);
    }
    return `${constraint.baseIds.length} bases`;
}

// Two archetypes are equal iff they target the same leader+base constraint.
// `enabled` doesn't affect identity — the user toggles it independently.
function constraintsEqual(a: BaseConstraint | undefined, b: BaseConstraint | undefined): boolean {
    if (!a && !b) return true;
    if (!a || !b) return false;
    if (a.kind !== b.kind) return false;
    if (a.kind === 'aspect' && b.kind === 'aspect') {
        return a.aspect === b.aspect;
    }
    if (a.kind === 'baseType' && b.kind === 'baseType') {
        return a.baseIds.slice().sort().join('|') === b.baseIds.slice().sort().join('|');
    }
    return false;
}

export function archetypesEqual(a: { leaderId: string; baseConstraint?: BaseConstraint }, b: { leaderId: string; baseConstraint?: BaseConstraint }): boolean {
    return a.leaderId === b.leaderId && constraintsEqual(a.baseConstraint, b.baseConstraint);
}

// Resolve which BaseTilePreview variant to render for an archetype. Callers
// pass the constraint and the resolved baseType (if applicable) — unique
// base types are rendered as a thumbnail by the caller, not the tile.
export function baseTileKindFor(
    constraint: BaseConstraint | undefined,
    selectedBaseType: IBaseTypeOption | null,
): BaseTileKind {
    if (!constraint) {
        return 'any';
    }
    if (constraint.kind === 'aspect') {
        return 'aspect';
    }
    if (!selectedBaseType || selectedBaseType.kind === 'unique') {
        return 'standard';
    }
    return selectedBaseType.kind;
}
