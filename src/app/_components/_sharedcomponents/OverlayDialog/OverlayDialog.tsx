import React from 'react';
import { Box, IconButton, Portal } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface IOverlayDialogProps {
    onClose: () => void;
    width?: string;
    children: React.ReactNode;
}

/**
 * Shared shell for the filtered-lobby modals: Portal-mounted backdrop +
 * gradient-bordered dialog box + top-right close button. Portaling lets
 * position:fixed escape transform-creating ancestors (the homepage's
 * three-column layout otherwise traps fixed-positioned descendants).
 */
const OverlayDialog: React.FC<IOverlayDialogProps> = ({ onClose, width = '80rem', children }) => {
    const styles = {
        overlay: {
            position: 'fixed' as const,
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
            width,
            maxWidth: '92vw',
            maxHeight: '92vh',
            overflow: 'auto',
            position: 'relative' as const,
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '1rem',
        },
        closeButton: {
            position: 'absolute' as const,
            top: '0.5rem',
            right: '0.5rem',
            color: '#aaa',
            '&:hover': { color: '#fff' },
        },
    };

    return (
        <Portal>
            <Box sx={styles.overlay} onClick={onClose}>
                <Box sx={styles.dialog} onClick={(e) => e.stopPropagation()}>
                    <IconButton sx={styles.closeButton} onClick={onClose} aria-label="Close">
                        <CloseIcon />
                    </IconButton>
                    {children}
                </Box>
            </Box>
        </Portal>
    );
};

export default OverlayDialog;
