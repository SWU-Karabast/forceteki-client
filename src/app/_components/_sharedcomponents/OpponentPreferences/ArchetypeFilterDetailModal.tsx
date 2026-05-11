import React from 'react';
import { Box, Typography } from '@mui/material';
import OverlayDialog from '@/app/_components/_sharedcomponents/OverlayDialog/OverlayDialog';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import ReadOnlyArchetypeList from './ReadOnlyArchetypeList';
import { OpponentArchetype } from '@/app/_constants/constants';
import { IArchetypeLookup } from '@/app/_utils/archetypeLookup';

interface IArchetypeFilterDetailModalProps {
    onClose: () => void;
    lobbyName: string;
    archetypes: OpponentArchetype[];
    lookup: IArchetypeLookup | null;
}

const ArchetypeFilterDetailModal: React.FC<IArchetypeFilterDetailModalProps> = ({
    onClose, lobbyName, archetypes, lookup,
}) => {
    const styles = {
        heading: { fontWeight: 600, color: '#fff', paddingRight: '2rem' },
        subheading: { color: '#cccccc', fontSize: '0.95rem' },
        footer: { display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' },
    };

    return (
        <OverlayDialog onClose={onClose}>
            <Typography variant="h5" sx={styles.heading}>Allowed Archetypes</Typography>
            <Typography sx={styles.subheading}>{lobbyName}</Typography>

            <ReadOnlyArchetypeList archetypes={archetypes} lookup={lookup} />

            <Box sx={styles.footer}>
                <PreferenceButton text="Close" buttonFnc={onClose} variant="standard" />
            </Box>
        </OverlayDialog>
    );
};

export default ArchetypeFilterDetailModal;
