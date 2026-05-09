import React, { ChangeEvent, useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    FormControl,
    FormControlLabel,
    Radio,
    RadioGroup,
    Typography,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
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

interface IMatchFilterPanelProps {
    matchPreferences: MatchPreferences;
    setMatchPreferences: (prefs: MatchPreferences) => void;
}

const aspectIconUrl = (aspect: string) => `/aspect-icons/aspect-${aspect}.webp`;

function leaderLabel(leader: LeaderOption | undefined): string {
    if (!leader) {
        return 'Unknown leader';
    }
    return leader.subtitle ? `${leader.name} - ${leader.subtitle}` : leader.name;
}

function baseConstraintSummary(constraint: BaseConstraint | undefined): React.ReactNode {
    if (!constraint) {
        return <Typography component="span" sx={styles.summaryConstraint}>any base</Typography>;
    }
    if (constraint.kind === 'aspect') {
        return (
            <Typography component="span" sx={styles.summaryConstraint}>
                + any
                <Box component="img" src={aspectIconUrl(constraint.aspect)} alt={constraint.aspect} sx={styles.summaryAspectIcon} />
                base
            </Typography>
        );
    }
    return (
        <Typography component="span" sx={styles.summaryConstraint}>+ {constraint.label ?? `${constraint.baseIds.length} bases`}</Typography>
    );
}

const MatchFilterPanel: React.FC<IMatchFilterPanelProps> = ({ matchPreferences, setMatchPreferences }) => {
    const router = useRouter();
    const [leaders, setLeaders] = useState<LeaderOption[]>([]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`);
                if (!res.ok) {
                    return;
                }
                const leadersData: LeaderOption[] = await res.json();
                if (cancelled) {
                    return;
                }
                setLeaders(leadersData);
            } catch {
                // Summary will fall back to ids; the manage page surfaces errors.
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    const leaderById = useMemo(() => new Map(leaders.map((l) => [l.id, l])), [leaders]);

    const handleRadioChange = (_: ChangeEvent<HTMLInputElement>, value: string) => {
        const enabled = value === 'specific';
        setMatchPreferences({ ...matchPreferences, enabled });
    };

    const handleManage = () => {
        router.push('/OpponentPreferences');
    };

    const radioValue = matchPreferences.enabled ? 'specific' : 'any';
    const showManageBlock = matchPreferences.enabled;
    const archetypes = matchPreferences.allowedArchetypes;
    const hasArchetypes = archetypes.length > 0;
    const activeArchetypeCount = archetypes.filter((a) => a.enabled !== false).length;
    const disabledArchetypeCount = archetypes.length - activeArchetypeCount;
    const showNarrowFilterNote = showManageBlock && activeArchetypeCount > 0 && activeArchetypeCount <= NARROW_FILTER_THRESHOLD;

    return (
        <FormControl fullWidth sx={styles.formControl}>
            <Typography sx={styles.label}>Opponent matchmaking</Typography>
            <RadioGroup row value={radioValue} onChange={handleRadioChange}>
                <FormControlLabel
                    value="any"
                    control={<Radio sx={styles.radio} />}
                    label={<Typography sx={styles.radioLabel}>Any Opponent</Typography>}
                />
                <FormControlLabel
                    value="specific"
                    control={<Radio sx={styles.radio} />}
                    label={<Typography sx={styles.radioLabel}>Specific Opponents</Typography>}
                />
            </RadioGroup>

            {showManageBlock && (
                <Box sx={styles.manageBlock}>
                    {!hasArchetypes && (
                        <Typography sx={styles.summaryEmpty}>
                            No archetypes selected yet. Open the manager to choose which leader/base
                            combinations you{'’'}ll match against.
                        </Typography>
                    )}
                    {hasArchetypes && (
                        <Box sx={styles.summaryList}>
                            <Typography sx={styles.summaryHeading}>
                                Currently allowing {activeArchetypeCount} archetype{activeArchetypeCount === 1 ? '' : 's'}
                                {disabledArchetypeCount > 0 && (
                                    <Typography component="span" sx={styles.summaryDisabledCount}>
                                        {' '}({disabledArchetypeCount} disabled)
                                    </Typography>
                                )}:
                            </Typography>
                            <Box component="ul" sx={styles.summaryItems}>
                                {archetypes.map((archetype: OpponentArchetype, i: number) => {
                                    const isEnabled = archetype.enabled !== false;
                                    return (
                                        <Box
                                            component="li"
                                            key={i}
                                            sx={isEnabled ? styles.summaryItem : { ...styles.summaryItem, ...styles.summaryItemDisabled }}
                                        >
                                            <Typography component="span" sx={styles.summaryLeaderName}>
                                                {leaderLabel(leaderById.get(archetype.leaderId))}
                                            </Typography>{' '}
                                            {baseConstraintSummary(archetype.baseConstraint)}
                                        </Box>
                                    );
                                })}
                            </Box>
                            {showNarrowFilterNote && (
                                <Typography sx={styles.narrowFilterNote}>
                                    Narrow filter — expect longer queue waits.
                                </Typography>
                            )}
                            {activeArchetypeCount === 0 && (
                                <Typography sx={styles.summaryEmpty}>
                                    Every archetype is currently disabled — you{'’'}ll match against any opponent until at least one is enabled.
                                </Typography>
                            )}
                        </Box>
                    )}
                    <Box sx={styles.manageButtonRow}>
                        <Button onClick={handleManage} sx={styles.manageButton}>
                            Manage&nbsp;Opponent&nbsp;Preferences
                        </Button>
                    </Box>
                </Box>
            )}
        </FormControl>
    );
};

const styles = {
    formControl: {
        mb: '1rem',
    },
    label: {
        mb: '.5em',
        color: 'white',
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
    },
    manageBlock: {
        mt: '0.5rem',
        p: '0.75rem 1rem',
        borderRadius: '8px',
        backgroundColor: 'rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
    },
    summaryEmpty: {
        color: '#bbbbbb',
        fontSize: '0.85em',
    },
    summaryList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
    },
    summaryHeading: {
        color: '#dddddd',
        fontSize: '0.85em',
    },
    summaryItems: {
        margin: 0,
        paddingLeft: '1.25rem',
        color: '#dddddd',
        fontSize: '0.85em',
    },
    summaryItem: {
        marginBottom: '0.15rem',
    },
    summaryItemDisabled: {
        opacity: 0.5,
        textDecoration: 'line-through',
    },
    summaryDisabledCount: {
        color: '#888',
        fontSize: 'inherit',
    },
    summaryLeaderName: {
        color: '#fff',
        fontWeight: 500,
        fontSize: 'inherit',
    },
    summaryConstraint: {
        color: '#bbbbbb',
        fontSize: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.25rem',
    },
    summaryAspectIcon: {
        width: '14px',
        height: '14px',
        objectFit: 'contain',
        verticalAlign: 'middle',
    },
    narrowFilterNote: {
        color: '#f0c060',
        fontSize: '0.8em',
        mt: '0.25rem',
    },
    manageButtonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
    manageButton: {
        color: '#fff',
        textTransform: 'none',
        fontWeight: 500,
        '&:hover': {
            color: '#4FABD2',
            backgroundColor: 'transparent',
        },
    },
};

export default MatchFilterPanel;
