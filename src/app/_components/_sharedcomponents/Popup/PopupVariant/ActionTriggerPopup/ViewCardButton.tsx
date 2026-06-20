import { MouseEvent, useState } from 'react';
import { Box, IconButton, Popover } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';

const styles = {
    iconButton: {
        position: 'absolute',
        top: '0.35rem',
        right: '0.35rem',
        zIndex: 2,
        color: 'white',
        backgroundColor: 'rgba(3, 12, 19, 0.72)',
        border: '1px solid rgba(255, 255, 255, 0.38)',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
        transition: 'opacity 140ms ease, background-color 140ms ease',
        '&:hover': {
            backgroundColor: 'rgba(3, 12, 19, 0.9)',
        },
    },
    popoverPaper: {
        backgroundColor: 'transparent',
        boxShadow: 'none',
    },
    card: {
        borderRadius: '.38em',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        aspectRatio: '1 / 1.4',
        width: 'clamp(200px, 60vw, 16rem)',
    }
}

export default function ViewCardButton({ imageUrl, isLandscape = false }: { imageUrl: string; isLandscape?: boolean }) {
    const [previewAnchorElement, setPreviewAnchorElement] = useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const previewOpen = Boolean(previewAnchorElement);

    const handlePreviewOpen = (event: MouseEvent<HTMLElement>) => {
        setPreviewAnchorElement(event.currentTarget);
        setPreviewImage(`url(${imageUrl})`);
    };

    const handlePreviewClose = () => {
        setPreviewAnchorElement(null);
        setPreviewImage(null);
    };

    return (
        <>
            <IconButton
                className="trigger-card-preview-button"
                aria-label="View card details"
                size="small"
                onClick={(event) => {
                    event.stopPropagation();
                    handlePreviewOpen(event);
                }}
                onMouseEnter={(event) => handlePreviewOpen(event)}
                onMouseLeave={handlePreviewClose}
                sx={styles.iconButton}
            >
                <VisibilityIcon fontSize="small" />
            </IconButton>
            <Popover
                id="trigger-card-preview-popover"
                sx={{ pointerEvents: 'none' }}
                open={previewOpen}
                anchorEl={previewAnchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                slotProps={{ paper: { sx: styles.popoverPaper, tabIndex: -1 } }}
                anchorOrigin={{
                    vertical: 'center',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'center',
                    horizontal: 'left',
                }}
            >
                <Box
                    sx={[
                        styles.card,
                        isLandscape && {
                            aspectRatio: '1.39',
                            width: 'clamp(250px, 70vw, 24rem)',
                        },
                        { backgroundImage: previewImage },
                    ]}
                />
            </Popover>
        </>

    )
}
