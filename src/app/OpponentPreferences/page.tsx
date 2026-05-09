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
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditIcon from '@mui/icons-material/Edit';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useRouter } from 'next/navigation';
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
    const router = useRouter();
    const { getBackground } = useCosmetics();
    const { user } = useUser();
    const background = getBackground(user?.preferences.cosmetics?.background);

    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);
    const [baseTypes, setBaseTypes] = useState<IBaseTypeOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Index of the archetype currently in expanded-edit mode. Only one at a
    // time; null = all collapsed.
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
        // If we just removed the active row, collapse all. If we removed an
        // earlier row, shift the active index down so the same row stays open.
        if (activeIndex === null) {
            return;
        }
        if (index === activeIndex) {
            setActiveIndex(null);
        } else if (index < activeIndex) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const addArchetype = () => {
        const leaderId = leaders[0]?.id ?? '';
        const updated = [...prefs.allowedArchetypes, { leaderId }];
        persist({ ...prefs, allowedArchetypes: updated });
        // Auto-expand the freshly-added archetype, collapsing any previous.
        setActiveIndex(updated.length - 1);
    };

    const handleBack = () => {
        router.push('/');
    };

    const renderArchetypeCard = (archetype: OpponentArchetype, index: number) => {
        if (activeIndex === index) {
            return renderExpandedArchetype(archetype, index);
        }
        return renderCollapsedArchetype(archetype, index);
    };

    const renderCollapsedArchetype = (archetype: OpponentArchetype, index: number) => {
        const leader = leaderById.get(archetype.leaderId) ?? null;
        const baseSummary = baseConstraintSummary(archetype.baseConstraint);
        return (
            <Box key={index} sx={styles.collapsedRow} onClick={() => setActiveIndex(index)}>
                <Box sx={styles.leaderAspectStack}>
                    {(leader?.aspects ?? []).map((aspect) => (
                        <Box
                            key={aspect}
                            component="img"
                            src={aspectIconUrl(aspect)}
                            alt={aspect}
                            sx={styles.aspectOptionIcon}
                        />
                    ))}
                </Box>
                <Typography component="span" sx={styles.collapsedLeader}>
                    {leader ? leaderLabel(leader) : 'Unknown leader'}
                </Typography>
                <Typography component="span" sx={styles.collapsedConstraint}>
                    {baseSummary}
                </Typography>
                <IconButton
                    aria-label="Edit archetype"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); setActiveIndex(index); }}
                    sx={styles.collapsedActionButton}
                >
                    <EditIcon fontSize="small" />
                </IconButton>
                <IconButton
                    aria-label="Remove archetype"
                    size="small"
                    onClick={(e) => { e.stopPropagation(); removeArchetype(index); }}
                    sx={styles.collapsedActionButton}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };

    function baseConstraintSummary(constraint: BaseConstraint | undefined): string {
        if (!constraint) {
            return 'any base';
        }
        if (constraint.kind === 'aspect') {
            return `+ any ${capitalize(constraint.aspect)} base`;
        }
        if (constraint.label) {
            return `+ ${constraint.label.replace(/^[A-Z][a-z]+ - /, '')}`;
        }
        return `+ ${constraint.baseIds.length} bases`;
    }

    const renderExpandedArchetype = (archetype: OpponentArchetype, index: number) => {
        const kind = getConstraintKind(archetype.baseConstraint);
        const selectedLeader = leaderById.get(archetype.leaderId) ?? null;
        const selectedBaseTypeKey = archetype.baseConstraint?.kind === 'baseType'
            ? archetype.baseConstraint.baseIds.slice().sort().join('|')
            : null;
        const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
        const selectedAspect = archetype.baseConstraint?.kind === 'aspect' ? archetype.baseConstraint.aspect : Aspect.Vigilance;

        const onLeaderChange = (next: LeaderOption | null) => {
            updateArchetype(index, { ...archetype, leaderId: next?.id ?? '' });
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

        const leaderImageUrl = selectedLeader ? cardImageUrlFromSetCodeId(selectedLeader.id) : null;
        const baseImageUrl = selectedBaseType ? cardImageUrlFromSetCodeId(selectedBaseType.representativeId) : null;
        const isUniqueBaseType = !!selectedBaseType && selectedBaseType.baseIds.length === 1;

        return (
            <Box key={index} sx={styles.archetypeCard}>
                <Box sx={styles.archetypeImages}>
                    {leaderImageUrl ? (
                        <Box sx={{ ...styles.cardImage, backgroundImage: `url(${leaderImageUrl})` }} />
                    ) : (
                        <Box sx={styles.cardImagePlaceholder} />
                    )}
                    {kind === 'baseType' && baseImageUrl && isUniqueBaseType && (
                        <Box sx={{ ...styles.cardImage, backgroundImage: `url(${baseImageUrl})` }} />
                    )}
                    {kind === 'baseType' && selectedBaseType && !isUniqueBaseType && (
                        <Box sx={styles.aspectPreview}>
                            <Box
                                component="img"
                                src={aspectIconUrl(selectedBaseType.aspect)}
                                alt={selectedBaseType.aspect}
                                sx={styles.aspectImage}
                            />
                            <Typography sx={styles.aspectPreviewLabel}>
                                {selectedBaseType.label.replace(`${capitalize(selectedBaseType.aspect)} - `, '')}
                            </Typography>
                        </Box>
                    )}
                    {kind === 'aspect' && (
                        <Box sx={styles.aspectPreview}>
                            <Box
                                component="img"
                                src={aspectIconUrl(selectedAspect)}
                                alt={selectedAspect}
                                sx={styles.aspectImage}
                            />
                            <Typography sx={styles.aspectPreviewLabel}>
                                Any {capitalize(selectedAspect)} base
                            </Typography>
                        </Box>
                    )}
                </Box>
                <Box sx={styles.archetypeFields}>
                    <Box sx={styles.fieldRow}>
                        <Typography sx={styles.fieldLabel}>Leader</Typography>
                        <Autocomplete
                            options={leaders}
                            value={selectedLeader}
                            getOptionLabel={leaderLabel}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) => onLeaderChange(value)}
                            renderInput={(params) => <TextField {...params} placeholder="Select leader" size="small" />}
                            sx={styles.field}
                            renderOption={(props, option) => {
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
                            }}
                        />
                    </Box>
                    <Box sx={styles.fieldRow}>
                        <Typography sx={styles.fieldLabel}>Base</Typography>
                        <RadioGroup
                            row
                            value={kind}
                            onChange={(_, value) => onKindChange(value as BaseConstraintKind)}
                        >
                            <FormControlLabel
                                value="any"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Any base</Typography>}
                            />
                            <FormControlLabel
                                value="aspect"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Any base of aspect</Typography>}
                            />
                            <FormControlLabel
                                value="baseType"
                                control={<Radio size="small" sx={styles.radio} />}
                                label={<Typography sx={styles.radioLabel}>Specific base type</Typography>}
                            />
                        </RadioGroup>
                    </Box>
                    {kind === 'aspect' && (
                        <Box sx={styles.fieldRow}>
                            <Typography sx={styles.fieldLabel}>Aspect</Typography>
                            <Select
                                value={selectedAspect}
                                size="small"
                                onChange={(e) => onAspectChange(e.target.value as Aspect)}
                                sx={styles.field}
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
                        <Box sx={styles.fieldRow}>
                            <Typography sx={styles.fieldLabel}>Base type</Typography>
                            <Autocomplete
                                options={baseTypes}
                                value={selectedBaseType}
                                getOptionLabel={baseTypeLabel}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(_, value) => onBaseTypeChange(value)}
                                renderInput={(params) => <TextField {...params} placeholder="Select base type" size="small" />}
                                sx={styles.field}
                                renderOption={(props, option) => {
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
                                            <Typography component="span" sx={styles.baseOptionLabel}>{option.label}</Typography>
                                            {option.set && (
                                                <Typography component="span" sx={styles.baseOptionSet}>{option.set}</Typography>
                                            )}
                                        </Box>
                                    );
                                }}
                            />
                        </Box>
                    )}
                </Box>
                <Box sx={styles.expandedActions}>
                    <IconButton
                        aria-label="Collapse archetype"
                        onClick={() => setActiveIndex(null)}
                        sx={styles.removeButton}
                    >
                        <ExpandLessIcon />
                    </IconButton>
                    <IconButton
                        aria-label="Remove archetype"
                        onClick={() => removeArchetype(index)}
                        sx={styles.removeButton}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
        );
    };

    return (
        <Box sx={{ ...styles.container, backgroundImage: `url(${background?.path}?v=2)` }}>
            <Box sx={styles.header}>
                <Typography sx={styles.title} onClick={handleBack}>
                    Karabast
                </Typography>
                <Button onClick={handleBack} sx={styles.backButton} variant="outlined">
                    Back to Play
                </Button>
            </Box>

            <Box sx={styles.content}>
                <Typography variant="h4" sx={styles.pageHeading}>Opponent Match Preferences</Typography>
                <Typography sx={styles.intro}>
                    Pick the leader and base combinations you{'’'}re willing to be matched against in
                    the public queue. Both players must accept each other for a match to be made,
                    so a narrow filter may mean longer waits. The default ({'“'}Any Opponent{'”'})
                    preserves Karabast{'’'}s normal behavior of matching against anyone.
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
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.25rem 2rem',
    },
    title: {
        fontSize: '2.25em',
        fontWeight: 600,
        cursor: 'pointer',
    },
    backButton: {
        color: '#fff',
        borderColor: '#ffffff66',
        '&:hover': {
            borderColor: '#fff',
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
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
    archetypeCard: {
        display: 'flex',
        gap: '1.25rem',
        padding: '1rem 1.25rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
        alignItems: 'flex-start',
    },
    collapsedRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        padding: '0.6rem 1rem',
        borderRadius: '10px',
        backgroundColor: 'rgba(0, 0, 0, 0.35)',
        border: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(6px)',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            borderColor: 'rgba(255, 255, 255, 0.15)',
        },
    },
    collapsedLeader: {
        color: '#fff',
        fontWeight: 500,
        margin: 0,
        flexShrink: 0,
    },
    collapsedConstraint: {
        color: '#bbbbbb',
        fontSize: '0.9em',
        margin: 0,
        flex: 1,
    },
    collapsedActionButton: {
        color: '#cccccc',
        '&:hover': {
            color: '#ffffff',
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
    },
    expandedActions: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    archetypeImages: {
        display: 'flex',
        gap: '0.5rem',
        flexShrink: 0,
        alignItems: 'center',
    },
    cardImage: {
        width: '120px',
        height: '90px',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderRadius: '6px',
    },
    cardImagePlaceholder: {
        width: '120px',
        height: '90px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        border: '1px dashed rgba(255, 255, 255, 0.18)',
    },
    aspectImageWrapper: {
        width: '60px',
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aspectImage: {
        width: '60px',
        height: '60px',
        objectFit: 'contain',
    },
    aspectPreview: {
        width: '90px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.25rem',
    },
    aspectPreviewLabel: {
        color: '#dddddd',
        fontSize: '0.8em',
        textAlign: 'center',
        lineHeight: 1.2,
    },
    archetypeFields: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        '& .MuiInputBase-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
    },
    fieldRow: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    fieldLabel: {
        color: '#aaaaaa',
        fontSize: '0.75em',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
    },
    field: {
        flex: 1,
    },
    aspectOption: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    radio: {
        color: '#888',
        '&.Mui-checked': {
            color: '#00ffff',
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
