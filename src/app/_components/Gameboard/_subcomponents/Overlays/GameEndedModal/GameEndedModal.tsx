import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography,
} from '@mui/material';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import EndGameTab from '@/app/_components/_sharedcomponents/Preferences/PreferencesSubElementVariants/EndGameTab';

interface IGameEndedModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    subtitle: string;
}

const GameEndedModal: React.FC<IGameEndedModalProps> = ({ open, onClose, title, subtitle }) => (
    <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="md"
        aria-labelledby="game-ended-modal-title"
        slotProps={{
            paper: {
                sx: {
                    maxHeight: '90dvh',
                    color: '#fff',
                    backgroundColor: 'rgba(3, 12, 19, 0.96)',
                    backgroundImage: 'linear-gradient(#0F1F27, #030C13)',
                    border: '1px solid #50717D',
                    borderRadius: '15px',
                    backdropFilter: 'blur(30px)',
                },
            },
            backdrop: {
                sx: { backgroundColor: 'rgba(0, 0, 0, 0.65)' },
            },
        }}
    >
        <DialogTitle component="div" id="game-ended-modal-title" sx={{ textAlign: 'center', pr: '64px', pl: '64px' }}>
            <Typography variant="h1">{title}</Typography>
            <Typography variant="h2">{subtitle}</Typography>
            <IconButton
                aria-label="Close game ended modal"
                onClick={onClose}
                sx={{ position: 'absolute', right: '16px', top: '16px', color: '#fff' }}
            >
                <CloseOutlinedIcon />
            </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ px: { xs: '20px', sm: '30px' }, py: '30px' }}>
            <EndGameTab />
        </DialogContent>
    </Dialog>
);

export default GameEndedModal;
