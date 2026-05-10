'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    FormControlLabel,
    IconButton,
    MenuItem,
    Radio,
    RadioGroup,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import {
    Aspect,
    BaseConstraint,
    IBaseTypeOption,
    OpponentArchetype,
    MatchPreferences,
} from '@/app/_constants/constants';
import { loadMatchPreferences, saveMatchPreferences } from '@/app/_utils/matchPreferences';
import { s3ImageURL } from '@/app/_utils/s3Utils';
import { useCosmetics } from '@/app/_contexts/CosmeticsContext';
import { useUser } from '@/app/_contexts/User.context';

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
    const { getBackground } = useCosmetics();
    const { user } = useUser();
    const background = getBackground(user?.preferences.cosmetics?.background);

    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);
    const [baseTypes, setBaseTypes] = useState<IBaseTypeOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Index pending removal — when set, the confirmation dialog opens.
    const [pendingRemovalIndex, setPendingRemovalIndex] = useState<number | null>(null);

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

    const removeArchetype = (index: number) => {
        const updated = prefs.allowedArchetypes.slice();
        updated.splice(index, 1);
        persist({ ...prefs, allowedArchetypes: updated });
    };

    const addArchetype = () => {
        const leaderId = leaders[0]?.id ?? '';
        const updated = [...prefs.allowedArchetypes, { leaderId }];
        persist({ ...prefs, allowedArchetypes: updated });
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

        return (
            <Box key={index} sx={{ ...styles.archetypeRow, ...(isEnabled ? null : styles.archetypeRowDisabled) }}>
                <Switch
                    size="small"
                    checked={isEnabled}
                    onChange={(e) => setArchetypeEnabled(index, e.target.checked)}
                    sx={styles.archetypeSwitch}
                    inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                />
                <Box sx={styles.leaderAspectStack}>
                    {(selectedLeader?.aspects ?? []).map((aspect) => (
                        <Box
                            key={aspect}
                            component="img"
                            src={aspectIconUrl(aspect)}
                            alt={aspect}
                            sx={styles.aspectOptionIcon}
                        />
                    ))}
                </Box>
                <Autocomplete
                    options={leaders}
                    value={selectedLeader}
                    getOptionLabel={leaderLabel}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    onChange={(_, value) => onLeaderChange(value)}
                    clearIcon={null}
                    renderInput={(params) => <TextField {...params} placeholder="Select leader" size="small" />}
                    sx={styles.leaderField}
                    renderOption={leaderOptionRender}
                />
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
                <Box sx={styles.baseValueSlot}>
                    {kind === 'aspect' && (
                        <Select
                            value={selectedAspect}
                            size="small"
                            onChange={(e) => onAspectChange(e.target.value as Aspect)}
                            sx={styles.field}
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
                    )}
                    {kind === 'baseType' && (
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
                    )}
                </Box>
                <IconButton
                    aria-label="Remove archetype"
                    onClick={() => setPendingRemovalIndex(index)}
                    sx={styles.headerActionButton}
                >
                    <CloseIcon />
                </IconButton>
            </Box>
        );
    };

    return (
        <Box sx={{ ...styles.container, backgroundImage: `url(${background?.path}?v=2)` }}>
            <Box sx={styles.content}>
                <Typography variant="h4" sx={styles.pageHeading}>Opponent Match Preferences</Typography>
                <Typography sx={styles.intro}>
                    Choose the leader and base combinations you{'’'}re willing to play against in
                    the public queue. The default ({'“'}Any Opponent{'”'}) matches you against
                    anyone, like Karabast normally does.
                </Typography>

                {error && <Typography sx={styles.error}>{error}</Typography>}
                {!loaded && !error && <Typography sx={styles.muted}>Loading leaders and bases…</Typography>}

                {loaded && prefs.allowedArchetypes.length === 0 && (
                    <Box sx={styles.emptyState}>
                        <Typography sx={styles.muted}>
                            No archetypes added yet. Add at least one to start filtering.
                        </Typography>
                    </Box>
                )}

                {loaded && prefs.allowedArchetypes.map(renderArchetypeCard)}

                {loaded && (
                    <Button
                        variant="contained"
                        onClick={addArchetype}
                        sx={styles.addButton}
                        disabled={leaders.length === 0}
                    >
                        + Add allowed archetype
                    </Button>
                )}
            </Box>
            <ConfirmationDialog
                open={pendingRemovalIndex !== null}
                title="Remove archetype"
                message={
                    <>
                        <Typography sx={styles.confirmPrimary}>
                            Are you sure you want to remove this archetype? This action cannot be undone.
                        </Typography>
                        <Typography sx={styles.confirmHint}>
                            Tip: if you only want to pause it, toggle it off with the switch instead — disabled
                            archetypes stay saved and can be re-enabled later.
                        </Typography>
                    </>
                }
                onCancel={() => setPendingRemovalIndex(null)}
                onConfirm={() => {
                    if (pendingRemovalIndex !== null) {
                        removeArchetype(pendingRemovalIndex);
                    }
                    setPendingRemovalIndex(null);
                }}
                confirmButtonText="Remove"
            />
        </Box>
    );
};

const styles = {
    container: {
        minHeight: '100vh',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        // Leave room for the global Navbar (KARABAST + ControlHub) which is
        // position: fixed at the top.
        paddingTop: '5rem',
    },
    content: {
        flex: 1,
        maxWidth: '960px',
        width: '100%',
        margin: '0 auto',
        padding: '0 2rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
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
    archetypeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.6rem 0.75rem',
        borderRadius: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
    },
    archetypeRowDisabled: {
        opacity: 0.55,
    },
    leaderField: {
        flex: '2 1 240px',
        minWidth: '200px',
    },
    kindRadios: {
        flexShrink: 0,
        flexWrap: 'nowrap',
    },
    baseValueSlot: {
        flex: '1 1 200px',
        minWidth: '180px',
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
