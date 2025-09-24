import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogActions,
    Typography,
    styled,
    Box
} from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

interface PhaseUndoDialogProps {
    open: boolean;
    onClose: () => void;
}

enum PhaseName {
    Action = 'action',
    Regroup = 'regroup',
}

const StyledDialog = styled(Dialog)(() => ({
    '& .MuiDialog-paper': {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        borderRadius: '15px',
        border: '3px solid #30434B',
        backdropFilter: 'blur(30px)',
        overflow: 'hidden',
        maxWidth: '500px',
        width: '100%',
        padding: '30px'
    },
    '& .MuiBackdrop-root': {
        backgroundColor: 'rgba(0, 0, 0, 0.5)' // Match gameboard variant backdrop
    }
}));

const StyledDialogTitle = styled(DialogTitle)(() => ({
    fontSize: '1.5rem',
    fontWeight: 500,
    borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
    padding: '0 0 20px 0',
    margin: '0 0 24px 0',
    color: 'white',
    textAlign: 'center'
}));

const StyledDialogActions = styled(DialogActions)(() => ({
    padding: '24px 0 0 0',
    justifyContent: 'center'
}));

const PhaseUndoDialog: React.FC<PhaseUndoDialogProps> = ({ open, onClose }) => {
    const { sendGameMessage, gameState, connectedPlayer } = useGame();
    const currentPlayer = gameState.players[connectedPlayer];

    // Click handler for the undo button
    const handleUndoPhase = (phaseName: PhaseName.Action | PhaseName.Regroup) => {
        sendGameMessage(['rollbackToSnapshot', {
            type: 'phase',
            phaseName
        }])
    }

    const handleUndoRegroup = () => {
        handleUndoPhase(PhaseName.Regroup);
    }

    const handleUndoAction = () => {
        handleUndoPhase(PhaseName.Action);
    }

    return (
        <StyledDialog open={open} onClose={onClose}>
            <StyledDialogTitle>Phase Undo</StyledDialogTitle>
            <Box sx={{ padding: '0 0 24px 0', color: 'rgba(255, 255, 255, 0.9)' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', mb: '20px' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={'Action Phase'}
                        buttonFnc={handleUndoAction}
                        disabled={currentPlayer['availableSnapshots']?.actionPhaseSnapshots === 0}
                        sx={{ minWidth: '140px' }}
                    />
                    <Typography sx={{ ml: '2rem', color: '#878787', lineHeight: '18px', fontSize: '14px', fontWeight: '500' }}>
                        Revert to the start of the most recent action phase
                    </Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={'Regroup Phase'}
                        buttonFnc={handleUndoRegroup}
                        disabled={currentPlayer['availableSnapshots']?.regroupPhaseSnapshots === 0}
                        sx={{ minWidth: '140px' }}
                    />
                    <Typography sx={{ ml: '2rem', color: '#878787', lineHeight: '18px', fontSize: '14px', fontWeight: '500' }}>
                        Revert to the start of the most recent regroup phase
                    </Typography>
                </Box>
            </Box>
            <StyledDialogActions>
                <PreferenceButton
                    buttonFnc={onClose}
                    variant="concede"
                    text={'Close'}
                />
            </StyledDialogActions>
        </StyledDialog>
    );
};

export default PhaseUndoDialog;