'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
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
import { createFilterOptions } from '@mui/material/Autocomplete';
import CloseIcon from '@mui/icons-material/Close';
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

interface LeaderOption {
    name: string;
    id: string;
    subtitle?: string;
}

type BaseConstraintKind = 'any' | 'aspect' | 'baseType';

// Bases only carry the four 'color' aspects — never Heroism or Villainy
// (those are alignment aspects on leaders/units, not on bases).
const ASPECT_OPTIONS: Aspect[] = [
    Aspect.Aggression,
    Aspect.Command,
    Aspect.Cunning,
    Aspect.Vigilance,
];

// Stripped from base-type labels for display since the aspect icon and the
// uniqueness of the base name already convey the same info as the prefix/tag.
const ASPECT_PREFIX_PATTERN = /^(?:Aggression|Command|Cunning|Heroism|Vigilance|Villainy) - /;
const RARE_TAG_PATTERN = /\s*\(R\)\s*$/;

function displayBaseLabel(label: string): string {
    return label.replace(ASPECT_PREFIX_PATTERN, '').replace(RARE_TAG_PATTERN, '');
}

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

// Bases tagged 'neutral' have no aspect-icon image; checking before rendering
// avoids a broken-image with the alt text 'neutral' showing in the icon slot.
const VALID_BASE_ASPECTS = new Set(['aggression', 'command', 'cunning', 'vigilance']);
function aspectHasIcon(aspect: string | null | undefined): aspect is string {
    return !!aspect && VALID_BASE_ASPECTS.has(aspect.toLowerCase());
}

// Filter on the displayed label so typing 'agg' doesn't match every
// Aggression-prefix multi-card group.
const baseTypeFilter = createFilterOptions<IBaseTypeOption>({
    stringify: (option) => displayBaseLabel(option.label),
});

const OpponentPreferencesPage: React.FC = () => {
    const [prefs, setPrefs] = useState<MatchPreferences>(() => loadMatchPreferences());
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);
    const [baseTypes, setBaseTypes] = useState<IBaseTypeOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingDraft, setEditingDraft] = useState<OpponentArchetype | null>(null);

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

    const addArchetype = () => {
        const leaderId = leaders[0]?.id ?? '';
        const newArchetype: OpponentArchetype = { leaderId };
        const updated = [...prefs.allowedArchetypes, newArchetype];
        persist({ ...prefs, allowedArchetypes: updated });
        setEditingIndex(updated.length - 1);
        setEditingDraft({ ...newArchetype });
    };

    const openEditDialog = (index: number) => {
        setEditingIndex(index);
        setEditingDraft({ ...prefs.allowedArchetypes[index] });
    };

    const closeEditDialog = () => {
        setEditingIndex(null);
        setEditingDraft(null);
    };

    const commitEditDialog = () => {
        if (editingIndex !== null && editingDraft !== null) {
            const updated = prefs.allowedArchetypes.slice();
            updated[editingIndex] = editingDraft;
            persist({ ...prefs, allowedArchetypes: updated });
        }
        closeEditDialog();
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

    const renderArchetypeRow = (archetype: OpponentArchetype, index: number) => {
        const isEnabled = archetype.enabled !== false;
        const isSelected = selectedIndices.includes(index);
        const selectedLeader = leaderById.get(archetype.leaderId) ?? null;
        const selectedBaseTypeKey = archetype.baseConstraint?.kind === 'baseType'
            ? archetype.baseConstraint.baseIds.slice().sort().join('|')
            : null;
        const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
        const baseAspect = baseConstraintAspect(archetype.baseConstraint);
        const stop = (e: React.MouseEvent) => e.stopPropagation();

        const leaderImageUrl = selectedLeader
            ? s3CardImageURL({ id: selectedLeader.id, count: 0 } as never, CardStyle.PlainLeader)
            : null;
        const uniqueBaseImageUrl = selectedBaseType && selectedBaseType.baseIds.length === 1
            ? s3CardImageURL({ id: selectedBaseType.representativeId, count: 0 } as never)
            : null;

        let baseTitle: string;
        let baseSubtitle: string | null = null;
        if (!archetype.baseConstraint) {
            baseTitle = 'Any base';
        } else if (archetype.baseConstraint.kind === 'aspect') {
            baseTitle = `Any ${capitalize(archetype.baseConstraint.aspect)}`;
        } else if (selectedBaseType) {
            const stripped = selectedBaseType.label.replace(ASPECT_PREFIX_PATTERN, '');
            const match = stripped.match(/^(.+?)\s*-\s*(\d+hp)(?:\s*\(R\))?\s*$/i);
            if (match) {
                baseTitle = match[1];
                baseSubtitle = match[2];
            } else {
                baseTitle = stripped;
            }
        } else {
            baseTitle = `${archetype.baseConstraint.baseIds.length} bases`;
        }

        return (
            <Box
                key={index}
                sx={{ ...styles.archetypeRow(isSelected), ...(isEnabled ? null : styles.archetypeRowDisabled) }}
                onClick={() => toggleSelection(index)}
            >
                <Box sx={styles.rowToggle} onClick={stop}>
                    <Switch
                        size="small"
                        checked={isEnabled}
                        onChange={(e) => setArchetypeEnabled(index, e.target.checked)}
                        sx={styles.archetypeSwitch}
                        inputProps={{ 'aria-label': isEnabled ? 'Disable archetype' : 'Enable archetype' }}
                    />
                </Box>
                <Box sx={styles.rowContent}>
                    <Box sx={styles.rowLeaderSection}>
                        {leaderImageUrl ? (
                            <Box sx={{ ...styles.rowLeaderThumb, backgroundImage: `url(${leaderImageUrl})` }} />
                        ) : (
                            <Box sx={{ ...styles.rowLeaderThumb, ...styles.rowThumbPlaceholder }} />
                        )}
                        <Box sx={styles.rowTextStack}>
                            <Typography sx={styles.rowTitle}>
                                {selectedLeader ? selectedLeader.name : 'Unknown leader'}
                            </Typography>
                            {selectedLeader?.subtitle && (
                                <Typography sx={styles.rowSubtitle}>{selectedLeader.subtitle}</Typography>
                            )}
                        </Box>
                    </Box>
                    <Box sx={styles.rowBaseSection}>
                        {uniqueBaseImageUrl ? (
                            <Box sx={{ ...styles.rowBaseThumb, backgroundImage: `url(${uniqueBaseImageUrl})` }} />
                        ) : aspectHasIcon(baseAspect) ? (
                            <Box
                                component="img"
                                src={aspectIconUrl(baseAspect)}
                                alt={baseAspect}
                                sx={styles.rowBaseAspectIcon}
                            />
                        ) : (
                            <Typography sx={styles.rowBaseAnyAsterisk} aria-hidden>*</Typography>
                        )}
                        <Box sx={styles.rowTextStack}>
                            <Typography sx={styles.rowTitle}>{baseTitle}</Typography>
                            {baseSubtitle && (
                                <Typography sx={styles.rowSubtitle}>{baseSubtitle}</Typography>
                            )}
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.rowEditSlot} onClick={stop}>
                    <PreferenceButton
                        variant="standard"
                        text="Edit"
                        buttonFnc={() => openEditDialog(index)}
                    />
                </Box>
                <Box
                    sx={{
                        ...styles.rowSelectionCheckmark,
                        visibility: isSelected ? 'visible' : 'hidden',
                    }}
                    aria-hidden={!isSelected}
                >
                    <Typography sx={styles.checkmarkSymbol}>✓</Typography>
                </Box>
            </Box>
        );
    };

    // ----------------------Styles-----------------------------//
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
        rowList: {
            mt: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '84%',
        },
        archetypeRow: (isSelected: boolean) => ({
            background: isSelected ? '#2F7DB680' : '#20344280',
            borderRadius: '5px',
            border: '2px solid transparent',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            position: 'relative' as const,
            '&:hover': {
                backgroundColor: '#2F7DB680',
            },
        }),
        rowToggle: {
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
        },
        // Wrappable middle area: when content doesn't fit on one line, the leader
        // and base sections wrap to separate lines while toggle + Edit stay anchored.
        rowContent: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            alignItems: 'center',
            gap: '8px 16px',
            flex: '1 1 auto',
            minWidth: 0,
        },
        rowLeaderSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: '1 1 22rem',
            minWidth: 0,
        },
        rowBaseSection: {
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flex: '1 1 16rem',
            minWidth: 0,
        },
        rowLeaderThumb: {
            width: '6.5rem',
            height: '4.65rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: '4px',
            flexShrink: 0,
        },
        rowThumbPlaceholder: {
            border: '1px dashed rgba(255, 255, 255, 0.18)',
        },
        rowTextStack: {
            display: 'flex',
            flexDirection: 'column' as const,
            minWidth: 0,
            flex: '1 1 auto',
            overflow: 'hidden',
        },
        rowTitle: {
            color: '#fff',
            fontSize: '1.1em',
            fontWeight: 600,
            margin: 0,
            lineHeight: 1.25,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        rowSubtitle: {
            color: '#bbbbbb',
            fontSize: '0.85em',
            margin: 0,
            lineHeight: 1.25,
            whiteSpace: 'nowrap' as const,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
        },
        rowBaseThumb: {
            width: '6.5rem',
            height: '4.65rem',
            backgroundColor: 'rgba(255, 255, 255, 0.04)',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            borderRadius: '4px',
            flexShrink: 0,
        },
        rowBaseAspectIcon: {
            width: '2.6rem',
            height: '2.6rem',
            objectFit: 'contain' as const,
            flexShrink: 0,
        },
        rowBaseAnyAsterisk: {
            width: '2.6rem',
            height: '2.6rem',
            flexShrink: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255, 255, 255, 0.55)',
            // Asterisk visual mass sits near cap-height; nudge down to optically center.
            fontSize: '4.5rem',
            fontWeight: 400,
            lineHeight: 0.6,
            transform: 'translateY(0.18em)',
        },
        rowEditSlot: {
            display: 'flex',
            flexShrink: 0,
        },
        rowSelectionCheckmark: {
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#66E5FF',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            flexShrink: 0,
        },
        dialogOverlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        dialog: {
            padding: '2rem',
            borderRadius: '15px',
            border: '2px solid transparent',
            background: 'linear-gradient(#0F1F27, #030C13) padding-box, linear-gradient(to top, #30434B, #50717D) border-box',
            width: '560px',
            maxWidth: '92%',
            maxHeight: '92vh',
            overflow: 'auto',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
        },
        dialogPreview: {
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '0.5rem',
            flexWrap: 'wrap' as const,
        },
        dialogPreviewSlot: {
            flex: '1 1 12rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
            minWidth: 0,
            maxWidth: '14rem',
        },
        dialogPreviewImage: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
        },
        dialogPreviewPlaceholder: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '6px',
            border: '1px dashed rgba(255, 255, 255, 0.18)',
        },
        dialogPreviewBadge: {
            width: '100%',
            maxWidth: '14rem',
            aspectRatio: '7 / 5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.35)',
            borderRadius: '6px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
        },
        dialogPreviewBadgeIcon: {
            width: '5rem',
            height: '5rem',
            objectFit: 'contain' as const,
        },
        dialogPreviewAnyBase: {
            background: 'linear-gradient(135deg, #1a2530 0%, #08111a 100%)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
        },
        dialogPreviewAnyBaseText: {
            color: 'rgba(255, 255, 255, 0.55)',
            fontSize: '12rem',
            fontWeight: 400,
            margin: 0,
            lineHeight: 0.6,
            transform: 'translateY(0.18em)',
        },
        dialogPreviewCaption: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.15rem',
            textAlign: 'center' as const,
        },
        dialogPreviewCaptionText: {
            color: '#fff',
            fontSize: '0.95em',
            fontWeight: 500,
            margin: 0,
            lineHeight: 1.2,
        },
        dialogPreviewCaptionSub: {
            color: '#bbbbbb',
            fontSize: '0.85em',
            margin: 0,
            lineHeight: 1.2,
        },
        dialogClose: {
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            color: '#fff',
        },
        dialogTitle: {
            color: 'white',
            fontSize: '1.25rem',
            fontWeight: 'bold',
            textAlign: 'center',
            marginBottom: '0.5rem',
        },
        dialogField: {
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
        },
        dialogLabel: {
            color: '#aaaaaa',
            fontSize: '0.75em',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            margin: 0,
        },
        dialogActions: {
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '0.5rem',
        },
        dialogOptionRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            minHeight: '36px',
            py: '0.25rem',
        },
        dialogOptionLabel: {
            lineHeight: 1.2,
            margin: 0,
            minWidth: 0,
        },
        dialogOptionSet: {
            color: '#aaaaaa',
            fontSize: '0.85em',
            lineHeight: 1.2,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            flexShrink: 0,
            marginLeft: 'auto',
        },
        archetypeRowDisabled: {
            opacity: 0.55,
        },
        checkmarkSymbol: {
            color: '#1E2D32',
            fontWeight: 'bold',
            fontSize: '13px',
            lineHeight: 1,
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
            // Brighten clear-X and dropdown-chevron icons to match the existing dropdowns.
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
        inputAspectAdornment: {
            width: '22px',
            height: '22px',
            objectFit: 'contain',
            ml: '4px',
            mr: '2px',
            flexShrink: 0,
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
                                text={'Delete archetype(s)'}
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
                    <Box sx={styles.rowList}>
                        {prefs.allowedArchetypes.map((archetype, i) => renderArchetypeRow(archetype, i))}
                    </Box>
                )}
            </Box>
            <ConfirmationDialog
                open={deleteDialogOpen}
                title="Delete Archetypes"
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
            {editingIndex !== null && editingDraft !== null && renderEditDialog()}
        </Box>
    );

    function renderEditDialog() {
        if (editingDraft === null) {
            return null;
        }
        const draft = editingDraft;
        const kind = getConstraintKind(draft.baseConstraint);
        const selectedLeader = leaderById.get(draft.leaderId) ?? null;
        const selectedBaseTypeKey = draft.baseConstraint?.kind === 'baseType'
            ? draft.baseConstraint.baseIds.slice().sort().join('|')
            : null;
        const selectedBaseType = selectedBaseTypeKey ? (baseTypesByJoinedIds.get(selectedBaseTypeKey) ?? null) : null;
        const selectedAspect = draft.baseConstraint?.kind === 'aspect' ? draft.baseConstraint.aspect : Aspect.Vigilance;

        const leaderImageUrl = selectedLeader
            ? s3CardImageURL({ id: selectedLeader.id, count: 0 } as never, CardStyle.PlainLeader)
            : null;
        const uniqueBaseImageUrl = selectedBaseType && selectedBaseType.baseIds.length === 1
            ? s3CardImageURL({ id: selectedBaseType.representativeId, count: 0 } as never)
            : null;

        const setDraft = (next: OpponentArchetype) => setEditingDraft(next);

        const onLeaderChange = (next: LeaderOption | null) => {
            if (!next) return;
            setDraft({ ...draft, leaderId: next.id });
        };
        const onKindChange = (nextKind: BaseConstraintKind) => {
            if (nextKind === 'any') {
                const { baseConstraint, ...rest } = draft;
                void baseConstraint;
                setDraft(rest);
                return;
            }
            if (nextKind === 'aspect') {
                setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: selectedAspect } });
                return;
            }
            const firstType = baseTypes[0];
            if (!firstType) return;
            setDraft({ ...draft, baseConstraint: { kind: 'baseType', baseIds: firstType.baseIds, label: firstType.label } });
        };
        const onAspectChange = (nextAspect: Aspect) => {
            setDraft({ ...draft, baseConstraint: { kind: 'aspect', aspect: nextAspect } });
        };
        const onBaseTypeChange = (next: IBaseTypeOption | null) => {
            if (!next) return;
            setDraft({ ...draft, baseConstraint: { kind: 'baseType', baseIds: next.baseIds, label: next.label } });
        };

        return (
            <Box sx={styles.dialogOverlay} onClick={closeEditDialog}>
                <Box sx={styles.dialog} onClick={(e) => e.stopPropagation()}>
                    <IconButton sx={styles.dialogClose} onClick={closeEditDialog} aria-label="close">
                        <CloseIcon />
                    </IconButton>
                    <Typography sx={styles.dialogTitle}>Edit archetype</Typography>

                    <Box sx={styles.dialogPreview}>
                        <Box sx={styles.dialogPreviewSlot}>
                            {leaderImageUrl ? (
                                <Box sx={{ ...styles.dialogPreviewImage, backgroundImage: `url(${leaderImageUrl})` }} />
                            ) : (
                                <Box sx={styles.dialogPreviewPlaceholder} />
                            )}
                            <Box sx={styles.dialogPreviewCaption}>
                                <Typography sx={styles.dialogPreviewCaptionText}>
                                    {selectedLeader ? selectedLeader.name : 'Unknown leader'}
                                </Typography>
                                {selectedLeader?.subtitle && (
                                    <Typography sx={styles.dialogPreviewCaptionSub}>
                                        {selectedLeader.subtitle}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                        <Box sx={styles.dialogPreviewSlot}>
                            {uniqueBaseImageUrl ? (
                                <Box sx={{ ...styles.dialogPreviewImage, backgroundImage: `url(${uniqueBaseImageUrl})` }} />
                            ) : kind === 'aspect' ? (
                                <Box sx={styles.dialogPreviewBadge}>
                                    <Box
                                        component="img"
                                        src={aspectIconUrl(selectedAspect)}
                                        alt={selectedAspect}
                                        sx={styles.dialogPreviewBadgeIcon}
                                    />
                                </Box>
                            ) : kind === 'baseType' && selectedBaseType && aspectHasIcon(selectedBaseType.aspect) ? (
                                <Box sx={styles.dialogPreviewBadge}>
                                    <Box
                                        component="img"
                                        src={aspectIconUrl(selectedBaseType.aspect)}
                                        alt={selectedBaseType.aspect}
                                        sx={styles.dialogPreviewBadgeIcon}
                                    />
                                </Box>
                            ) : (
                                <Box sx={{ ...styles.dialogPreviewBadge, ...styles.dialogPreviewAnyBase }}>
                                    <Typography sx={styles.dialogPreviewAnyBaseText}>*</Typography>
                                </Box>
                            )}
                            <Box sx={styles.dialogPreviewCaption}>
                                <Typography sx={styles.dialogPreviewCaptionText}>
                                    {kind === 'any'
                                        ? 'Any base'
                                        : kind === 'aspect'
                                            ? `Any ${capitalize(selectedAspect)} base`
                                            : selectedBaseType
                                                ? displayBaseLabel(selectedBaseType.label)
                                                : 'Any base'}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    <Box sx={styles.dialogField}>
                        <Typography sx={styles.dialogLabel}>Leader</Typography>
                        <Autocomplete
                            options={leaders}
                            value={selectedLeader}
                            getOptionLabel={leaderLabel}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) => onLeaderChange(value)}
                            clearIcon={null}
                            renderInput={(params) => <TextField {...params} placeholder="Select leader" size="small" />}
                            sx={styles.field}
                            renderOption={(props, option) => {
                                // Use option.id as React key — MUI's default key is getOptionLabel,
                                // which collides for leader options whose displayed label is identical.
                                const { key: _key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
                                void _key;
                                return (
                                    <Box component="li" key={option.id} {...optionProps} sx={styles.dialogOptionRow}>
                                        <Typography component="span" sx={styles.dialogOptionLabel}>{leaderLabel(option)}</Typography>
                                    </Box>
                                );
                            }}
                        />
                    </Box>

                    <Box sx={styles.dialogField}>
                        <Typography sx={styles.dialogLabel}>Base</Typography>
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
                        <Box sx={styles.dialogField}>
                            <Typography sx={styles.dialogLabel}>Aspect</Typography>
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
                        <Box sx={styles.dialogField}>
                            <Typography sx={styles.dialogLabel}>Base type</Typography>
                            <Autocomplete
                                options={baseTypes}
                                value={selectedBaseType}
                                getOptionLabel={(option) => displayBaseLabel(baseTypeLabel(option))}
                                filterOptions={baseTypeFilter}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(_, value) => onBaseTypeChange(value)}
                                clearIcon={null}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        placeholder="Select base type"
                                        size="small"
                                        InputProps={{
                                            ...params.InputProps,
                                            startAdornment: aspectHasIcon(selectedBaseType?.aspect) ? (
                                                <Box
                                                    component="img"
                                                    src={aspectIconUrl(selectedBaseType!.aspect)}
                                                    alt={selectedBaseType!.aspect}
                                                    sx={styles.inputAspectAdornment}
                                                />
                                            ) : null,
                                        }}
                                    />
                                )}
                                sx={styles.field}
                                renderOption={(props, option) => {
                                    const { key: _key, ...optionProps } = props as React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
                                    void _key;
                                    return (
                                        <Box component="li" key={option.id} {...optionProps} sx={styles.dialogOptionRow}>
                                            {aspectHasIcon(option.aspect) && (
                                                <Box
                                                    component="img"
                                                    src={aspectIconUrl(option.aspect)}
                                                    alt={option.aspect}
                                                    sx={styles.aspectOptionIcon}
                                                />
                                            )}
                                            <Typography component="span" sx={styles.dialogOptionLabel}>
                                                {displayBaseLabel(option.label)}
                                            </Typography>
                                            {option.set && (
                                                <Typography component="span" sx={styles.dialogOptionSet}>{option.set}</Typography>
                                            )}
                                        </Box>
                                    );
                                }}
                            />
                        </Box>
                    )}

                    <Box sx={styles.dialogActions}>
                        <PreferenceButton variant="standard" text="Cancel" buttonFnc={closeEditDialog} />
                        <PreferenceButton variant="standard" text="Done" buttonFnc={commitEditDialog} />
                    </Box>
                </Box>
            </Box>
        );
    }
};

export default OpponentPreferencesPage;
