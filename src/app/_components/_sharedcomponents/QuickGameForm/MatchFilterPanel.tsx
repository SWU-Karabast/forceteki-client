import React, { useEffect, useMemo, useState } from 'react';
import {
    Autocomplete,
    Box,
    Button,
    Collapse,
    FormControlLabel,
    IconButton,
    MenuItem,
    Select,
    Switch,
    TextField,
    Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import {
    Aspect,
    BaseConstraint,
    MatchPreferences,
    NARROW_FILTER_THRESHOLD,
    OpponentArchetype,
} from '@/app/_constants/constants';

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
    const aspect = option.aspects[0] ? ` (${option.aspects[0]})` : '';
    return `${option.name}${aspect}`;
}

const ASPECT_OPTIONS: Aspect[] = [
    Aspect.Aggression,
    Aspect.Command,
    Aspect.Cunning,
    Aspect.Heroism,
    Aspect.Vigilance,
    Aspect.Villainy,
];

interface IMatchFilterPanelProps {
    matchPreferences: MatchPreferences;
    setMatchPreferences: (prefs: MatchPreferences) => void;
}

const MatchFilterPanel: React.FC<IMatchFilterPanelProps> = ({ matchPreferences, setMatchPreferences }) => {
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

    const leaderById = useMemo(() => {
        const map = new Map<string, LeaderOption>();
        for (const leader of leaders) {
            map.set(leader.id, leader);
        }
        return map;
    }, [leaders]);

    const baseById = useMemo(() => {
        const map = new Map<string, BaseOption>();
        for (const base of bases) {
            map.set(base.id, base);
        }
        return map;
    }, [bases]);

    const updateArchetype = (index: number, next: OpponentArchetype) => {
        const updated = matchPreferences.allowedArchetypes.slice();
        updated[index] = next;
        setMatchPreferences({ ...matchPreferences, allowedArchetypes: updated });
    };

    const removeArchetype = (index: number) => {
        const updated = matchPreferences.allowedArchetypes.slice();
        updated.splice(index, 1);
        setMatchPreferences({ ...matchPreferences, allowedArchetypes: updated });
    };

    const addArchetype = () => {
        // Default to the alphabetically-first leader if available so the row
        // is immediately editable rather than blank.
        const leaderId = leaders[0]?.id ?? '';
        const next: OpponentArchetype = { leaderId };
        setMatchPreferences({
            ...matchPreferences,
            allowedArchetypes: [...matchPreferences.allowedArchetypes, next],
        });
    };

    const handleEnabledToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMatchPreferences({ ...matchPreferences, enabled: event.target.checked });
    };

    const archetypeRow = (archetype: OpponentArchetype, index: number) => {
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

        return (
            <Box key={index} sx={styles.archetypeRow}>
                <Box sx={styles.archetypeFields}>
                    <Autocomplete
                        options={leaders}
                        value={selectedLeader}
                        getOptionLabel={leaderLabel}
                        isOptionEqualToValue={(option, value) => option.id === value.id}
                        onChange={(_, value) => onLeaderChange(value)}
                        renderInput={(params) => <TextField {...params} label="Leader" size="small" />}
                        sx={styles.leaderField}
                    />
                    <Select
                        value={kind}
                        size="small"
                        onChange={(e) => onKindChange(e.target.value as BaseConstraintKind)}
                        sx={styles.kindField}
                    >
                        <MenuItem value="any">Any base</MenuItem>
                        <MenuItem value="aspect">Any base of aspect…</MenuItem>
                        <MenuItem value="specificBase">Specific base…</MenuItem>
                    </Select>
                    {kind === 'aspect' && (
                        <Select
                            value={selectedAspect}
                            size="small"
                            onChange={(e) => onAspectChange(e.target.value as Aspect)}
                            sx={styles.aspectField}
                        >
                            {ASPECT_OPTIONS.map((aspect) => (
                                <MenuItem key={aspect} value={aspect}>{capitalize(aspect)}</MenuItem>
                            ))}
                        </Select>
                    )}
                    {kind === 'specificBase' && (
                        <Autocomplete
                            options={bases}
                            value={selectedBase}
                            getOptionLabel={baseLabel}
                            isOptionEqualToValue={(option, value) => option.id === value.id}
                            onChange={(_, value) => onBaseChange(value)}
                            renderInput={(params) => <TextField {...params} label="Base" size="small" />}
                            sx={styles.baseField}
                        />
                    )}
                </Box>
                <IconButton aria-label="Remove archetype" size="small" onClick={() => removeArchetype(index)} sx={styles.removeButton}>
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
        );
    };

    const showNarrowFilterNote =
        matchPreferences.enabled &&
        matchPreferences.allowedArchetypes.length > 0 &&
        matchPreferences.allowedArchetypes.length <= NARROW_FILTER_THRESHOLD;

    return (
        <Box sx={styles.panel}>
            <FormControlLabel
                control={<Switch checked={matchPreferences.enabled} onChange={handleEnabledToggle} />}
                label={<Typography sx={styles.toggleLabel}>Only match against specific opponents</Typography>}
            />
            <Collapse in={matchPreferences.enabled} unmountOnExit>
                <Box sx={styles.collapseInner}>
                    <Typography variant="body2" sx={styles.helperText}>
                        Pick the leader/base combinations you{'’'}re willing to match against.
                        Both players must accept each other for a match to be made.
                    </Typography>
                    {error && <Typography sx={styles.errorText}>{error}</Typography>}
                    {!loaded && !error && <Typography sx={styles.helperText}>Loading leaders and bases…</Typography>}
                    {loaded && matchPreferences.allowedArchetypes.length === 0 && (
                        <Typography sx={styles.helperText}>No opponents allowed yet — add at least one archetype below.</Typography>
                    )}
                    {loaded && matchPreferences.allowedArchetypes.map(archetypeRow)}
                    {loaded && (
                        <Button variant="outlined" onClick={addArchetype} sx={styles.addButton} disabled={leaders.length === 0}>
                            + Add allowed archetype
                        </Button>
                    )}
                    {showNarrowFilterNote && (
                        <Typography sx={styles.narrowFilterNote}>
                            Heads up: a narrow filter means you may wait longer for a match.
                        </Typography>
                    )}
                </Box>
            </Collapse>
        </Box>
    );
};

function capitalize(value: string): string {
    if (value.length === 0) {
        return value;
    }
    return value.charAt(0).toUpperCase() + value.slice(1);
}

const styles = {
    panel: {
        mt: '0.5rem',
        mb: '1rem',
        p: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
    },
    toggleLabel: {
        color: 'white',
        fontSize: '0.95em',
    },
    collapseInner: {
        mt: '0.5rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    helperText: {
        color: '#bbbbbb',
        fontSize: '0.85em',
    },
    errorText: {
        color: '#ff8080',
        fontSize: '0.85em',
    },
    archetypeRow: {
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
    },
    archetypeFields: {
        display: 'flex',
        gap: '0.5rem',
        flex: 1,
        flexWrap: 'wrap',
        '& .MuiInputBase-root': {
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
        },
    },
    leaderField: {
        flex: '2 1 220px',
        minWidth: '180px',
    },
    kindField: {
        flex: '1 1 160px',
        minWidth: '140px',
    },
    aspectField: {
        flex: '1 1 140px',
        minWidth: '120px',
    },
    baseField: {
        flex: '2 1 200px',
        minWidth: '180px',
    },
    removeButton: {
        color: '#cccccc',
    },
    addButton: {
        alignSelf: 'flex-start',
        textTransform: 'none',
    },
    narrowFilterNote: {
        color: '#f0c060',
        fontSize: '0.85em',
        mt: '0.25rem',
    },
};

export default MatchFilterPanel;
