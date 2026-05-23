import React from 'react';
import { Box, Typography } from '@mui/material';
import OverlayDialog from '@/app/_components/_sharedcomponents/OverlayDialog/OverlayDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import OpponentPreferencesEditor from './OpponentPreferencesEditor';

interface IOpponentPreferencesModalProps {
    open: boolean;
    onClose: () => void;
}

const OpponentPreferencesModal: React.FC<IOpponentPreferencesModalProps> = ({ open, onClose }) => {
    if (!open) return null;

    const styles = {
        heading: { fontWeight: 600, color: '#fff', paddingRight: '2rem' },
        intro: { color: '#cccccc', maxWidth: '720px' },
        footer: { display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' },
    };

    return (
        <OverlayDialog onClose={onClose}>
            <Typography variant="h4" sx={styles.heading}>Opponent Preferences</Typography>
            <Typography sx={styles.intro}>
                Add and manage the opponent archetypes you{'’'}ll accept into your filtered
                lobby. Each archetype is a leader + base combination; toggle them on or off
                without removing them to fine-tune the filter. Preferences are saved
                automatically and snapshot into the lobby when you create it.
            </Typography>

            <OpponentPreferencesEditor />

            <Box sx={styles.footer}>
                <PreferenceButton text="Done" buttonFnc={onClose} variant="standard" />
            </Box>
        </OverlayDialog>
    );
};

export default OpponentPreferencesModal;
