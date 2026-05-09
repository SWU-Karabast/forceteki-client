'use client';
import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    IconButton,
    MenuItem,
    Select,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useRouter } from 'next/navigation';
import {
    Aspect,
    BaseConstraint,
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
}

interface BaseOption {
    name: string;
    id: string;
    subtitle?: string;
    aspects: string[];
}

type BaseConstraintKind = 'any' | 'aspect' | 'specificBase';

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

function baseLabel(option: BaseOption | null): string {
    if (!option) {
        return '';
    }
    return option.name;
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
    const [bases, setBases] = useState<BaseOption[]>([]);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [leadersRes, basesRes] = await Promise.all([
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`),
                    fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-bases`),
                ]);
                if (!leadersRes.ok || !basesRes.ok) {
                    throw new Error(`Failed to load leaders/bases (${leadersRes.status}/${basesRes.status})`);
                }
                const leadersData: LeaderOption[] = await leadersRes.json();
                const basesData: BaseOption[] = await basesRes.json();
                if (cancelled) {
                    return;
                }
                leadersData.sort((a, b) => leaderLabel(a).localeCompare(leaderLabel(b)));
                basesData.sort((a, b) => a.name.localeCompare(b.name));
                setLeaders(leadersData);
                setBases(basesData);
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
    const baseById = useMemo(() => new Map(bases.map((b) => [b.id, b])), [bases]);

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
        persist({
            ...prefs,
            allowedArchetypes: [...prefs.allowedArchetypes, { leaderId }],
        });
    };

    const handleBack = () => {
        router.push('/');
    };

    const renderArchetype = (archetype: OpponentArchetype, index: number) => {
        const kind = getConstraintKind(archetype.baseConstraint);
        const selectedLeader = leaderById.get(archetype.leaderId) ?? null;
        const selectedBaseId = archetype.baseConstraint?.kind === 'specificBase' ? archetype.baseConstraint.baseId : null;
        const selectedBase = selectedBaseId ? (baseById.get(selectedBaseId) ?? null) : null;
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
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'specificBase', baseId: bases[0]?.id ?? '' },
            });
        };

        const onAspectChange = (nextAspect: Aspect) => {
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'aspect', aspect: nextAspect },
            });
        };

        const onBaseChange = (next: BaseOption | null) => {
            updateArchetype(index, {
                ...archetype,
                baseConstraint: { kind: 'specificBase', baseId: next?.id ?? '' },
            });
        };

        const leaderImageUrl = selectedLeader ? cardImageUrlFromSetCodeId(selectedLeader.id) : null;
        const baseImageUrl = selectedBase ? cardImageUrlFromSetCodeId(selectedBase.id) : null;

        return (
            <Box key={index} sx={styles.archetypeCard}>
                <Box sx={styles.archetypeImages}>
                    {leaderImageUrl ? (
                        <Box sx={{ ...styles.cardImage, backgroundImage: `url(${leaderImageUrl})` }} />
                    ) : (
                        <Box sx={styles.cardImagePlaceholder} />
                    )}
                    {kind === 'specificBase' && baseImageUrl && (
                        <Box sx={{ ...styles.cardImage, backgroundImage: `url(${baseImageUrl})` }} />
                    )}
                    {kind === 'aspect' && (
                        <Box sx={styles.aspectImageWrapper}>
                            <Box
                                component="img"
                                src={aspectIconUrl(selectedAspect)}
                                alt={selectedAspect}
                                sx={styles.aspectImage}
                            />
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
                        />
                    </Box>
                    <Box sx={styles.fieldRow}>
                        <Typography sx={styles.fieldLabel}>Base</Typography>
                        <Select
                            value={kind}
                            size="small"
                            onChange={(e) => onKindChange(e.target.value as BaseConstraintKind)}
                            sx={styles.field}
                        >
                            <MenuItem value="any">Any base</MenuItem>
                            <MenuItem value="aspect">Any base of aspect…</MenuItem>
                            <MenuItem value="specificBase">Specific base…</MenuItem>
                        </Select>
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
                    {kind === 'specificBase' && (
                        <Box sx={styles.fieldRow}>
                            <Typography sx={styles.fieldLabel}>Specific base</Typography>
                            <Autocomplete
                                options={bases}
                                value={selectedBase}
                                getOptionLabel={baseLabel}
                                isOptionEqualToValue={(option, value) => option.id === value.id}
                                onChange={(_, value) => onBaseChange(value)}
                                renderInput={(params) => <TextField {...params} placeholder="Select base" size="small" />}
                                sx={styles.field}
                                renderOption={(props, option) => {
                                    const { key, ...optionProps } = props as any;
                                    return (
                                        <Box component="li" key={key ?? option.id} {...optionProps} sx={styles.baseOption}>
                                            {option.aspects[0] && (
                                                <Box
                                                    component="img"
                                                    src={aspectIconUrl(option.aspects[0])}
                                                    alt={option.aspects[0]}
                                                    sx={styles.aspectOptionIcon}
                                                />
                                            )}
                                            {option.name}
                                        </Box>
                                    );
                                }}
                            />
                        </Box>
                    )}
                </Box>
                <IconButton
                    aria-label="Remove archetype"
                    onClick={() => removeArchetype(index)}
                    sx={styles.removeButton}
                >
                    <CloseIcon />
                </IconButton>
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

                {loaded && prefs.allowedArchetypes.map(renderArchetype)}

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
    aspectOptionIcon: {
        width: '20px',
        height: '20px',
        objectFit: 'contain',
    },
    baseOption: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
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
