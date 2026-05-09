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

    // Index of the archetype currently in expanded-edit mode. Only one at a
    // time; null = all collapsed.
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    // Working copy of the archetype being edited. While non-null, field
    // changes mutate this draft rather than the persisted state. "Save"
    // commits the draft; opening another row for edit auto-saves first.
    const [editingDraft, setEditingDraft] = useState<OpponentArchetype | null>(null);

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

    /**
     * Mutates the in-flight draft for the active archetype. Field changes
     * call this; persistence happens in `commitDraft`.
     */
    const updateArchetype = (index: number, next: OpponentArchetype) => {
        if (activeIndex === index && editingDraft) {
            setEditingDraft(next);
            return;
        }
        // Fallback: editing-not-active path (shouldn't generally happen, but
        // keeps the function safe for any caller that bypasses the draft).
        const updated = prefs.allowedArchetypes.slice();
        updated[index] = next;
        persist({ ...prefs, allowedArchetypes: updated });
    };

    const startEditing = (index: number) => {
        // If we were editing a different row, commit that one first.
        if (editingDraft !== null && activeIndex !== null && activeIndex !== index) {
            const updated = prefs.allowedArchetypes.slice();
            updated[activeIndex] = editingDraft;
            persist({ ...prefs, allowedArchetypes: updated });
        }
        setEditingDraft({ ...prefs.allowedArchetypes[index] });
        setActiveIndex(index);
    };

    const commitDraft = () => {
        if (editingDraft === null || activeIndex === null) {
            setActiveIndex(null);
            setEditingDraft(null);
            return;
        }
        const updated = prefs.allowedArchetypes.slice();
        updated[activeIndex] = editingDraft;
        persist({ ...prefs, allowedArchetypes: updated });
        setActiveIndex(null);
        setEditingDraft(null);
    };

    const removeArchetype = (index: number) => {
        const updated = prefs.allowedArchetypes.slice();
        updated.splice(index, 1);
        persist({ ...prefs, allowedArchetypes: updated });
        // If we just removed the active row, drop its draft. If we removed
        // an earlier row, shift the active index down so the same row stays
        // open with its existing draft.
        if (activeIndex === null) {
            return;
        }
        if (index === activeIndex) {
            setActiveIndex(null);
            setEditingDraft(null);
        } else if (index < activeIndex) {
            setActiveIndex(activeIndex - 1);
        }
    };

    const addArchetype = () => {
        // If something else was being edited, commit first so we don't lose it.
        let baseList = prefs.allowedArchetypes;
        if (editingDraft !== null && activeIndex !== null) {
            baseList = baseList.slice();
            baseList[activeIndex] = editingDraft;
        }
        const leaderId = leaders[0]?.id ?? '';
        const newArchetype: OpponentArchetype = { leaderId };
        const updated = [...baseList, newArchetype];
        persist({ ...prefs, allowedArchetypes: updated });
        // Auto-open the freshly-added archetype with a fresh draft.
        setActiveIndex(updated.length - 1);
        setEditingDraft({ ...newArchetype });
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
        const isExpanded = activeIndex === index;
        // While editing, render the live-mutating draft so the header summary
        // reflects what the user is changing in the form below.
        const view = isExpanded && editingDraft ? editingDraft : archetype;
        const isEnabled = view.enabled !== false;
        const kind = getConstraintKind(view.baseConstraint);
        const selectedLeader = leaderById.get(view.leaderId) ?? null;
        const selectedBaseTypeKey = view.baseConstraint?.kind === 'baseType'
            ? view.baseConstraint.baseIds.slice().sort().join('|')
            : null;
        const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
        const selectedAspect = view.baseConstraint?.kind === 'aspect' ? view.baseConstraint.aspect : Aspect.Vigilance;
        const baseSummary = baseConstraintSummary(view.baseConstraint);
        const baseAspect = baseConstraintAspect(view.baseConstraint);

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
            <Box key={index} sx={{ ...styles.archetypeCard, ...(isEnabled ? null : styles.archetypeCardDisabled) }}>
                <Box sx={styles.archetypeHeader}>
                    <Switch
                        size="small"
                        checked={isEnabled}
                        onChange={(e) => setArchetypeEnabled(index, e.target.checked)}
                        sx={styles.archetypeSwitch}
                        inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                    />
                    <Box sx={styles.archetypeImages}>
                        {leaderImageUrl ? (
                            <Box sx={{ ...styles.cardImage, backgroundImage: `url(${leaderImageUrl})` }} />
                        ) : (
                            <Box sx={styles.cardImagePlaceholder} />
                        )}
                        {kind === 'baseType' && baseImageUrl && isUniqueBaseType && selectedBaseType && (
                            <Box sx={styles.aspectPreview}>
                                <Box sx={{ ...styles.cardImage, backgroundImage: `url(${baseImageUrl})` }} />
                                <Typography sx={styles.aspectPreviewLabel}>
                                    {selectedBaseType.label}
                                </Typography>
                            </Box>
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
                                    {selectedBaseType.label.replace(ASPECT_PREFIX_PATTERN, '')}
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
                        {kind === 'any' && (
                            <Box sx={styles.aspectPreview}>
                                <Box sx={styles.anyBasePlaceholder} />
                                <Typography sx={styles.aspectPreviewLabel}>
                                    Any base
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Typography component="span" sx={styles.headerLeaderName}>
                        {selectedLeader ? leaderLabel(selectedLeader) : 'Unknown leader'}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        onClick={() => (isExpanded ? commitDraft() : startEditing(index))}
                        sx={styles.editSaveButton}
                    >
                        {isExpanded ? 'Save' : 'Edit'}
                    </Button>
                    <IconButton
                        aria-label="Remove archetype"
                        onClick={() => setPendingRemovalIndex(index)}
                        sx={styles.headerActionButton}
                    >
                        <CloseIcon />
                    </IconButton>
                </Box>
                {isExpanded && (
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
                                            <Typography component="span" sx={styles.baseOptionLabel}>
                                                {option.label.replace(ASPECT_PREFIX_PATTERN, '')}
                                            </Typography>
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
                )}
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
    archetypeCard: {
        display: 'flex',
        flexDirection: 'column',
        padding: '0.75rem 1rem',
        borderRadius: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(6px)',
    },
    archetypeCardDisabled: {
        opacity: 0.55,
    },
    archetypeHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
    },
    headerActionButton: {
        color: '#cccccc',
        '&:hover': {
            color: '#ffffff',
            backgroundColor: 'rgba(255,255,255,0.05)',
        },
    },
    editSaveButton: {
        color: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.4)',
        textTransform: 'none',
        fontWeight: 500,
        minWidth: '64px',
        '&:hover': {
            borderColor: '#fff',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
    },
    headerLeaderName: {
        flex: 1,
        color: '#fff',
        fontWeight: 500,
        margin: 0,
    },
    anyBasePlaceholder: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: '1px dashed rgba(255, 255, 255, 0.3)',
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
    collapsedLeader: {
        color: '#fff',
        fontWeight: 500,
        margin: 0,
        flexShrink: 0,
    },
    collapsedConstraintGroup: {
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    collapsedConstraint: {
        color: '#bbbbbb',
        fontSize: '0.9em',
        margin: 0,
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
        width: '80px',
        height: '60px',
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        borderRadius: '6px',
    },
    cardImagePlaceholder: {
        width: '80px',
        height: '60px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '6px',
        border: '1px dashed rgba(255, 255, 255, 0.18)',
    },
    aspectImageWrapper: {
        width: '40px',
        height: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    aspectImage: {
        width: '40px',
        height: '40px',
        objectFit: 'contain',
    },
    aspectPreview: {
        width: '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.15rem',
    },
    aspectPreviewLabel: {
        color: '#dddddd',
        fontSize: '0.75em',
        textAlign: 'center',
        lineHeight: 1.2,
        margin: 0,
    },
    archetypeFields: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        marginTop: '0.75rem',
        paddingTop: '0.75rem',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
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
