'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    FormControlLabel,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    Aspect,
    BaseConstraint,
    IBaseTypeOption,
    OpponentArchetype,
    MatchPreferences,
} from '@/app/_constants/constants';
import { loadMatchPreferences, saveMatchPreferences } from '@/app/_utils/matchPreferences';
import { s3ImageURL } from '@/app/_utils/s3Utils';

/**
 * Build a card-art URL from a set-code id (e.g. `SEC_010`). Mirrors the
 * format used by `s3CardImageURL` for plain-style standard-format leader
 * and base art, but skips the type-specific branches that depend on
 * runtime card state (e.g. "leader on base zone") which don't apply here.
 */
function cardImageUrlFromSetCodeId(setCodeId: string): string | null {
    const [set, numStr] = setCodeId.split('_');
    if (!set || !numStr) {
        return null;
    }
    const num = parseInt(numStr, 10);
    if (Number.isNaN(num)) {
        return null;
    }
    const padded = num.toString().padStart(3, '0');
    return s3ImageURL(`cards/${set}/standard/large/${padded}.webp?v=2`);
}

interface LeaderOption {
    name: string;
    id: string;
    subtitle?: string;
    aspects: string[];
    set: string | null;
}

type BaseConstraintKind = 'any' | 'aspect' | 'baseType';

const ASPECT_OPTIONS: Aspect[] = [
    Aspect.Aggression,
    Aspect.Command,
    Aspect.Cunning,
    Aspect.Heroism,
    Aspect.Vigilance,
    Aspect.Villainy,
];

/**
 * Matches a leading '<Aspect> - ' prefix on a base-type label. Used when
 * an aspect icon is rendered alongside the label, making the text
 * prefix redundant. Unique-named labels (e.g. 'Colossus - 35hp (R)')
 * don't match this pattern.
 */
const ASPECT_PREFIX_PATTERN = /^(?:Aggression|Command|Cunning|Heroism|Vigilance|Villainy) - /;

function getConstraintKind(constraint: BaseConstraint | undefined): BaseConstraintKind {
    if (!constraint) {
        return 'any';
    }
    return constraint.kind;
}

function leaderLabel(option: LeaderOption | null): string {
    if (!option) {
        return '';
    }
    return option.subtitle ? `${option.name} - ${option.subtitle}` : option.name;
}

function baseTypeLabel(option: IBaseTypeOption | null): string {
    return option?.label ?? '';
}

function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const aspectIconUrl = (aspect: string) => `/aspect-icons/aspect-${aspect}.webp`;

const OpponentPreferencesPage: React.FC = () => {
    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);
    const [baseTypes, setBaseTypes] = useState<IBaseTypeOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Indices of archetypes currently selected for batch operations
    // (mirrors the DeckPage selection pattern).
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

    // When true, the confirmation dialog for deleting selected archetypes is
    // open.
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [leadersRes, baseTypesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`),
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-base-types`),
                ]);
                if (!leadersRes.ok || !baseTypesRes.ok) {
                    throw new Error(`Failed to load leaders/base types (${leadersRes.status}/${baseTypesRes.status})`);
                }
                const leadersData: LeaderOption[] = await leadersRes.json();
                const baseTypesData: IBaseTypeOption[] = await baseTypesRes.json();
                if (cancelled) {
                    return;
                }
                leadersData.sort((a, b) => leaderLabel(a).localeCompare(leaderLabel(b)));
                // Cluster by aspect first, then alphabetical within each aspect.
                // Each option already shows its aspect icon, so explicit
                // group headers would just add visual noise.
                baseTypesData.sort((a, b) => {
                    if (a.aspect !== b.aspect) {
                        return a.aspect.localeCompare(b.aspect);
                    }
                    return a.label.localeCompare(b.label);
                });
                setLeaders(leadersData);
                setBaseTypes(baseTypesData);
                setLoaded(true);
            } catch (err) {
                if (cancelled) {
                    return;
                }
                setError(err instanceof Error ? err.message : 'Failed to load leader/base data');
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const leaderById = useMemo(() => new Map(leaders.map((l) => [l.id, l])), [leaders]);
    const baseTypesByJoinedIds = useMemo(() => {
        const map = new Map<string, IBaseTypeOption>();
        for (const baseType of baseTypes) {
            map.set(baseType.baseIds.slice().sort().join('|'), baseType);
        }
        return map;
    }, [baseTypes]);

    const persist = (next: MatchPreferences) => {
        setPrefs(next);
        saveMatchPreferences(next);
    };

    const updateArchetype = (index: number, next: OpponentArchetype) => {
        const updated = prefs.allowedArchetypes.slice();
        updated[index] = next;
        persist({ ...prefs, allowedArchetypes: updated });
    };

    const addArchetype = () => {
        const leaderId = leaders[0]?.id ?? '';
        const updated = [...prefs.allowedArchetypes, { leaderId }];
        persist({ ...prefs, allowedArchetypes: updated });
    };

    const toggleSelection = (index: number) => {
        setSelectedIndices((prev) => (
            prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
        ));
    };

    const deleteSelected = () => {
        const removeSet = new Set(selectedIndices);
        const updated = prefs.allowedArchetypes.filter((_, i) => !removeSet.has(i));
        persist({ ...prefs, allowedArchetypes: updated });
        setSelectedIndices([]);
        setDeleteDialogOpen(false);
    };

    const setArchetypeEnabled = (index: number, enabled: boolean) => {
        const updated = prefs.allowedArchetypes.slice();
        updated[index] = { ...updated[index], enabled };
        persist({ ...prefs, allowedArchetypes: updated });
    };

    function baseConstraintSummary(constraint: BaseConstraint | undefined): string {
        if (!constraint) {
            return 'any base';
        }
        if (constraint.kind === 'aspect') {
            // The aspect icon next to this text already conveys the aspect.
            return '+ any base';
        }
        if (constraint.label) {
            // Strip the leading aspect prefix when the label starts with
            // '<Aspect> - ' (covers grouped types like 'Aggression - 30hp'
            // and 'Aggression - Force - 28hp'). Unique-named bases like
            // 'Colossus - 35hp (R)' don't start with an aspect, so they
            // pass through unchanged.
            const trimmed = constraint.label.replace(ASPECT_PREFIX_PATTERN, '');
            return `+ ${trimmed}`;
        }
        return `+ ${constraint.baseIds.length} bases`;
    }

    /**
     * Returns the aspect string (e.g. 'aggression') of the base under this
     * constraint, used to render a small aspect-icon badge next to the
     * constraint summary in the collapsed row. `null` for "any base"
     * (no specific aspect) or when the baseType isn't found.
     */
    function baseConstraintAspect(constraint: BaseConstraint | undefined): string | null {
        if (!constraint) {
            return null;
        }
        if (constraint.kind === 'aspect') {
            return constraint.aspect;
        }
        const key = constraint.baseIds.slice().sort().join('|');
        const type = baseTypesByJoinedIds.get(key);
        return type?.aspect ?? null;
    }

    const renderArchetypeCard = (archetype: OpponentArchetype, index: number) => {
        const isEnabled = archetype.enabled !== false;
        const kind = getConstraintKind(archetype.baseConstraint);
        const selectedLeader = leaderById.get(archetype.leaderId) ?? null;
        const selectedBaseTypeKey = archetype.baseConstraint?.kind === 'baseType'
            ? archetype.baseConstraint.baseIds.slice().sort().join('|')
            : null;
        const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
        const selectedAspect = archetype.baseConstraint?.kind === 'aspect' ? archetype.baseConstraint.aspect : Aspect.Vigilance;

        const onLeaderChange = (next: LeaderOption | null) => {
            if (!next) {
                return;
            }
            updateArchetype(index, { ...archetype, leaderId: next.id });
        };

        const onKindChange = (nextKind: BaseConstraintKind) => {
            if (nextKind === 'any') {
                const { baseConstraint, ...rest } = archetype;
                void baseConstraint;
                updateArchetype(index, rest);
                return;
            }
            if (nextKind === 'aspect') {
                updateArchetype(index, {
                    ...archetype,
                    baseConstraint: { kind: 'aspect', aspect: selectedAspect },
                });
                return;
            }
            const firstType = baseTypes[0];
            if (!firstType) {
                return;
            }
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'baseType', baseIds: firstType.baseIds, label: firstType.label },
            });
        };

        const onAspectChange = (nextAspect: Aspect) => {
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'aspect', aspect: nextAspect },
            });
        };

        const onBaseTypeChange = (next: IBaseTypeOption | null) => {
            if (!next) {
                return;
            }
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'baseType', baseIds: next.baseIds, label: next.label },
            });
        };

        const leaderOptionRender = (props: React.HTMLAttributes<HTMLLIElement>, option: LeaderOption) => {
            const { key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
            return (
                <Box component="li" key={key ?? option.id} {...optionProps} sx={styles.baseOption}>
                    <Box sx={styles.leaderAspectStack}>
                        {option.aspects.map((aspect) => (
                            <Box
                                key={aspect}
                                component="img"
                                src={aspectIconUrl(aspect)}
                                alt={aspect}
                                sx={styles.aspectOptionIcon}
                            />
                        ))}
                    </Box>
                    <Typography component="span" sx={styles.baseOptionLabel}>{leaderLabel(option)}</Typography>
                    {option.set && (
                        <Typography component="span" sx={styles.baseOptionSet}>{option.set}</Typography>
                    )}
                </Box>
            );
        };

        const baseTypeOptionRender = (props: React.HTMLAttributes<HTMLLIElement>, option: IBaseTypeOption) => {
            const { key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
            return (
                <Box component="li" key={key ?? option.id} {...optionProps} sx={styles.baseOption}>
                    {option.aspect && (
                        <Box
                            component="img"
                            src={aspectIconUrl(option.aspect)}
                            alt={option.aspect}
                            sx={styles.aspectOptionIcon}
                        />
                    )}
                    <Typography component="span" sx={styles.baseOptionLabel}>
                        {option.label.replace(ASPECT_PREFIX_PATTERN, '')}
                    </Typography>
                    {option.set && (
                        <Typography component="span" sx={styles.baseOptionSet}>{option.set}</Typography>
                    )}
                </Box>
            );
        };

        const leaderImageUrl = selectedLeader
            ? s3CardImageURL({ id: selectedLeader.id, count: 0 } as never, CardStyle.PlainLeader)
            : null;
        const baseImageUrl = selectedBaseType && selectedBaseType.baseIds.length === 1
            ? s3CardImageURL({ id: selectedBaseType.representativeId, count: 0 } as never)
            : null;
        const isSelected = selectedIndices.includes(index);
        const stop = (e: React.MouseEvent) => e.stopPropagation();

        return (
            <Box
                key={index}
                sx={{ ...styles.archetypeCard(isSelected), ...(isEnabled ? null : styles.archetypeCardDisabled) }}
                onClick={() => toggleSelection(index)}
            >
                <Box sx={styles.cardSwitch} onClick={stop}>
                    <Switch
                        size="small"
                        checked={isEnabled}
                        onChange={(e) => setArchetypeEnabled(index, e.target.checked)}
                        sx={styles.archetypeSwitch}
                        inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                    />
                </Box>
                {isSelected && (
                    <Box sx={styles.selectionCheckmark}>
                        <Typography sx={styles.checkmarkSymbol}>✓</Typography>
                    </Box>
                )}
                <Box sx={styles.leaderBaseHolder}>
                    {leaderImageUrl ? (
                        <Box sx={{ ...styles.cardArt, backgroundImage: `url(${leaderImageUrl})` }} />
                    ) : (
                        <Box sx={styles.cardArtPlaceholder} />
                    )}
                    {kind === 'baseType' && baseImageUrl ? (
                        <Box sx={{ ...styles.cardArt, backgroundImage: `url(${baseImageUrl})` }} />
                    ) : kind === 'aspect' ? (
                        <Box sx={styles.cardArtAspect}>
                            <Box
                                component="img"
                                src={aspectIconUrl(selectedAspect)}
                                alt={selectedAspect}
                                sx={styles.aspectArtImage}
                            />
                            <Typography sx={styles.aspectArtLabel}>
                                Any {capitalize(selectedAspect)}
                            </Typography>
                        </Box>
                    ) : kind === 'baseType' && selectedBaseType ? (
                        <Box sx={styles.cardArtAspect}>
                            <Box
                                component="img"
                                src={aspectIconUrl(selectedBaseType.aspect)}
                                alt={selectedBaseType.aspect}
                                sx={styles.aspectArtImage}
                            />
                            <Typography sx={styles.aspectArtLabel}>
                                {selectedBaseType.label.replace(ASPECT_PREFIX_PATTERN, '')}
                            </Typography>
                        </Box>
                    ) : (
                        <Box sx={styles.cardArtAspect}>
                            <Box sx={styles.anyBaseRing} />
                            <Typography sx={styles.aspectArtLabel}>Any base</Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={styles.cardForm}>
                    <Box onClick={stop}>
                        <Autocomplete
                            options={leaders}
                            value={selectedLeader}
                            getOptionLabel={leaderLabel}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) => onLeaderChange(value)}
                            clearIcon={null}
                            renderInput={(params) => <TextField {...params} placeholder="Select leader" size="small" />}
                            sx={styles.field}
                            renderOption={leaderOptionRender}
                        />
                    </Box>
                    <Box onClick={stop}>
                        <RadioGroup
                            row
                            value={kind}
                            onChange={(_, value) => onKindChange(value as BaseConstraintKind)}
                            sx={styles.kindRadios}
                        >
                            <FormControlLabel
                                value="any"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Any</Typography>}
                            />
                            <FormControlLabel
                                value="aspect"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Aspect</Typography>}
                            />
                            <FormControlLabel
                                value="baseType"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Specific</Typography>}
                            />
                        </RadioGroup>
                    </Box>
                    {kind === 'aspect' && (
                        <Box onClick={stop}>
                            <Select
                                value={selectedAspect}
                                size="small"
                                fullWidth
                                onChange={(e) => onAspectChange(e.target.value as Aspect)}
                                renderValue={(value) => (
                                    <Box component="span" sx={styles.aspectOption}>
                                        <Box
                                            component="img"
                                            src={aspectIconUrl(value)}
                                            alt={value}
                                            sx={styles.aspectOptionIcon}
                                        />
                                        {capitalize(value as string)}
                                    </Box>
                                )}
                            >
                                {ASPECT_OPTIONS.map((aspect) => (
                                    <MenuItem key={aspect} value={aspect}>
                                        <Box component="span" sx={styles.aspectOption}>
                                            <Box
                                                component="img"
                                                src={aspectIconUrl(aspect)}
                                                alt={aspect}
                                                sx={styles.aspectOptionIcon}
                                            />
                                            {capitalize(aspect)}
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                        </Box>
                    )}
                    {kind === 'baseType' && (
                        <Box onClick={stop}>
                            <Autocomplete
                                options={baseTypes}
                                value={selectedBaseType}
                                getOptionLabel={baseTypeLabel}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(_, value) => onBaseTypeChange(value)}
                                clearIcon={null}
                                renderInput={(params) => <TextField {...params} placeholder="Select base type" size="small" />}
                                sx={styles.field}
                                renderOption={baseTypeOptionRender}
                            />
                        </Box>
                    )}
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={styles.container}>
            <Box sx={styles.content}>
                <Typography variant="h4" sx={styles.pageHeading}>Opponent Match Preferences</Typography>
                <Typography sx={styles.intro}>
                    Choose the leader and base combinations you{'’'}re willing to play against in
                    the public queue. The default ({'“'}Any Opponent{'”'}) matches you against
                    anyone, like Karabast normally does.
                </Typography>

                {error && <Typography sx={styles.error}>{error}</Typography>}
                {!loaded && !error && <Typography sx={styles.muted}>Loading leaders and bases…</Typography>}

                {loaded && (
                    <Box sx={styles.header}>
                        <Box sx={styles.toolbarSlot}>
                            <PreferenceButton
                                variant="standard"
                                text="Add archetype"
                                buttonFnc={addArchetype}
                                disabled={leaders.length === 0}
                            />
                        </Box>
                        <Box sx={styles.toolbarSlot}>
                            <PreferenceButton
                                variant="concede"
                                text={`Delete archetype${selectedIndices.length === 1 ? '' : 's'}`}
                                buttonFnc={() => setDeleteDialogOpen(true)}
                                disabled={selectedIndices.length === 0}
                            />
                        </Box>
                    </Box>
                )}

                {loaded && prefs.allowedArchetypes.length === 0 && (
                    <Box sx={styles.emptyState}>
                        <Typography sx={styles.muted}>
                            No archetypes added yet. Click {'“'}Add archetype{'”'} above to start filtering.
                        </Typography>
                    </Box>
                )}

                {loaded && prefs.allowedArchetypes.length > 0 && (
                    <Grid container alignItems="center" spacing={1} sx={styles.gridContainer}>
                        {prefs.allowedArchetypes.map((archetype, i) => renderArchetypeCard(archetype, i))}
                    </Grid>
                )}
            </Box>
            <ConfirmationDialog
                open={deleteDialogOpen}
                title={`Delete archetype${selectedIndices.length === 1 ? '' : 's'}`}
                message={
                    <>
                        <Typography sx={styles.confirmPrimary}>
                            Are you sure you want to delete {selectedIndices.length} archetype
                            {selectedIndices.length === 1 ? '' : 's'}? This action cannot be undone.
                        </Typography>
                        <Typography sx={styles.confirmHint}>
                            Tip: if you only want to pause an archetype, toggle it off with the switch on
                            the card — disabled archetypes stay saved and can be re-enabled later.
                        </Typography>
                    </>
                }
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={deleteSelected}
                confirmButtonText="Delete"
            />
        </Box>
    );
};

const styles = {
    container: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
    },
    content: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        overflow: 'hidden',
    },
    pageHeading: {
        fontWeight: 600,
        marginBottom: '0.25rem',
    },
    intro: {
        color: '#cccccc',
        marginBottom: '1rem',
        maxWidth: '720px',
    },
    muted: {
        color: '#bbbbbb',
    },
    error: {
        color: '#ff8080',
    },
    emptyState: {
        padding: '2rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        border: '1px dashed rgba(255, 255, 255, 0.18)',
        textAlign: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
    },
    toolbarSlot: {
        minWidth: '200px',
    },
    gridContainer: {
        mt: '20px',
        overflowY: 'auto',
        maxHeight: '84%',
    },
    archetypeCard: (isSelected: boolean) => ({
        background: isSelected ? '#2F7DB680' : '#20344280',
        width: '31rem',
        height: '13rem',
        borderRadius: '5px',
        padding: '5px',
        display: 'flex',
        flexDirection: 'row',
        border: '2px solid transparent',
        cursor: 'pointer',
        position: 'relative',
        '&:hover': {
            backgroundColor: '#2F7DB680',
        },
    }),
    archetypeCardDisabled: {
        opacity: 0.55,
    },
    cardSwitch: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        zIndex: 10,
    },
    selectionCheckmark: {
        position: 'absolute',
        bottom: '34px',
        right: '10px',
        width: '24px',
        height: '24px',
        borderRadius: '50%',
        backgroundColor: '#66E5FF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    checkmarkSymbol: {
        color: '#1E2D32',
        fontWeight: 'bold',
        fontSize: '16px',
    },
    leaderBaseHolder: {
        display: 'flex',
        alignItems: 'center',
        height: '100%',
        width: 'calc(55% - 5px)',
        gap: '0.4rem',
        padding: '0 0.3rem',
    },
    cardArt: {
        flex: 1,
        backgroundColor: 'transparent',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        height: '11.5rem',
        minWidth: 0,
    },
    cardArtPlaceholder: {
        flex: 1,
        height: '11.5rem',
        minWidth: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        border: '1px dashed rgba(255, 255, 255, 0.18)',
    },
    cardArtAspect: {
        flex: 1,
        height: '11.5rem',
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        borderRadius: '6px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.5rem',
    },
    aspectArtImage: {
        width: '4rem',
        height: '4rem',
        objectFit: 'contain',
    },
    aspectArtLabel: {
        color: '#fff',
        fontSize: '0.85em',
        textAlign: 'center',
        margin: 0,
        lineHeight: 1.2,
    },
    anyBaseRing: {
        width: '4rem',
        height: '4rem',
        borderRadius: '50%',
        border: '2px dashed rgba(255, 255, 255, 0.3)',
    },
    cardForm: {
        display: 'flex',
        flexDirection: 'column',
        width: 'calc(45% - 5px)',
        height: '100%',
        gap: '0.5rem',
        justifyContent: 'center',
        paddingRight: '0.5rem',
    },
    kindRadios: {
        flexWrap: 'nowrap',
    },
    headerActionButton: {
        color: '#cccccc',
        flexShrink: 0,
        '&:hover': {
            color: '#ffffff',
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
    },
    confirmPrimary: {
        color: '#fff',
        marginBottom: '0.75rem',
    },
    confirmHint: {
        color: '#aaaaaa',
        fontSize: '0.9em',
        fontStyle: 'italic',
    },
    archetypeSwitch: {
        flexShrink: 0,
        // Match Karabast's white-accent convention used by checkboxes and
        // radios elsewhere on the site.
        '& .MuiSwitch-switchBase.Mui-checked': {
            color: '#fff',
        },
        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
            backgroundColor: '#fff',
            opacity: 0.5,
        },
    },
    fieldLabel: {
        color: '#aaaaaa',
        fontSize: '0.75em',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    field: {
        flex: 1,
        // MUI Autocomplete defaults the clear-X and dropdown-chevron icons
        // to a very low-contrast gray on dark backgrounds. Brighten them so
        // they read like the existing Format/Match Type dropdowns.
        '& .MuiAutocomplete-clearIndicator, & .MuiAutocomplete-popupIndicator': {
            color: '#ffffff',
        },
        '& .MuiSelect-icon': {
            color: '#ffffff',
        },
    },
    aspectOption: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    radio: {
        color: '#fff',
        '&.Mui-checked': {
            color: '#fff',
        },
        '&.Mui-disabled': {
            color: 'rgba(255, 255, 255, 0.3)',
        },
    },
    radioLabel: {
        color: '#fff',
        fontSize: '0.9em',
    },
    aspectOptionIcon: {
        width: '20px',
        height: '20px',
        objectFit: 'contain',
    },
    leaderAspectStack: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.15rem',
        flexShrink: 0,
        minWidth: '20px',
    },
    baseOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        minHeight: '36px',
        py: '0.25rem',
    },
    baseOptionLabel: {
        flex: 1,
        lineHeight: 1.2,
        margin: 0,
    },
    baseOptionSet: {
        color: '#aaaaaa',
        fontSize: '0.85em',
        lineHeight: 1.2,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        flexShrink: 0,
    },
    removeButton: {
        color: '#cccccc',
        '&:hover': {
            color: '#ffffff',
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
    },
    addButton: {
        alignSelf: 'flex-start',
        marginTop: '0.5rem',
        textTransform: 'none',
    },
};

export default OpponentPreferencesPage;
