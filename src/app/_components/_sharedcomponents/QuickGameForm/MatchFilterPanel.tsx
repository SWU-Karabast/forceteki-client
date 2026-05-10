import React, { ChangeEvent } from 'react';
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
import { MatchPreferences } from '@/app/_constants/constants';

interface IMatchFilterPanelProps {
    matchPreferences: MatchPreferences;
    setMatchPreferences: (prefs: MatchPreferences) => void;
}

const MatchFilterPanel: React.FC<IMatchFilterPanelProps> = ({ matchPreferences, setMatchPreferences }) => {
    const router = useRouter();

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
                        <Typography sx={styles.summaryHeading}>
                            Currently allowing {activeArchetypeCount} archetype{activeArchetypeCount === 1 ? '' : 's'}
                        </Typography>
                    )}
                    {hasArchetypes && activeArchetypeCount === 0 && (
                        <Typography sx={styles.summaryEmpty}>
                            Every archetype is currently disabled — you{'’'}ll match against any opponent until at least one is enabled.
                        </Typography>
                    )}
                    <Box sx={styles.manageButtonRow}>
                        <Button onClick={handleManage} variant="contained">
                            Manage Opponent Preferences
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
    summaryHeading: {
        color: '#dddddd',
        fontSize: '0.85em',
    },
    manageButtonRow: {
        display: 'flex',
        justifyContent: 'flex-end',
    },
};

export default MatchFilterPanel;
