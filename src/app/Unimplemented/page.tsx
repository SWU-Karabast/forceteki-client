'use client';
import React, { useEffect } from 'react';
import {
    Box,
    Card,
    Typography,
    Popover,
    PopoverOrigin,
    TextField,
    MenuItem, Divider
} from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';

const UnimplementedPage = () => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [unimplementedCards, setUnimplementedCards] = React.useState<any>([]);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);

    useEffect(() => {
        // Fetch unimplemented cards
        const fetchUnimplementedCards = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-unimplemented`);
                if (!response.ok) {
                    throw new Error(`Error fetching lobbies: ${response.statusText}`);
                }
                const data = await response.json();
                setUnimplementedCards(data);
            } catch (error) {
                console.error('Error fetching lobbies:', error);
            }
        };

        fetchUnimplementedCards();
    }, []);

    // Example filter states
    const [factionFilter, setFactionFilter] = React.useState('All');

    // Hover handlers for card preview
    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        // Start a small delay so we don't open immediately on every hover
        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
        }, 500);
    };

    const handlePreviewClose = () => {
        clearTimeout(hoverTimeout.current);
        setAnchorElement(null);
        setPreviewImage(null);
    };

    // Popover placement
    const popoverConfig = (): { anchorOrigin: PopoverOrigin; transformOrigin: PopoverOrigin } => ({
        anchorOrigin: {
            vertical: 'center',
            horizontal: -5,
        },
        transformOrigin: {
            vertical: 'center',
            horizontal: 'right',
        },
    });
    // ------------------------STYLES------------------------//
    const styles = {
        pageContainer: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            overflowY: 'hidden',
        },
        filterRow: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
        },
        cardOuter: {
            width: '100%',
            height: '100%',
            overflowY: 'auto',
            flex: 1,
        },
        cardStyle: {
            borderRadius: '1.1em',
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column' as const,
            backgroundColor: 'transparent',
        },
        mainContainerStyle: {
            display: 'flex',
            flexWrap: 'wrap' as const,
            gap: '1em',
            padding: '1em',
        },
        cardContainer: {
            backgroundColor: 'black',
            borderRadius: '0.5rem',
            width: '8rem',
            display: 'flex',
            flexDirection: 'column' as const,
            alignItems: 'center',
        },
        styleCard: {
            borderRadius: '0.5rem',
            position: 'relative' as const,
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '0.718',
            width: '100%',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer',
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '16rem',
        },
        filterBox:{
            display:'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: '1rem',
        }
    };

    return (
        <Box sx={styles.pageContainer}>
            {/* Filter row (top) */}
            <Box sx={styles.filterRow}>
                <Typography variant={'h5'} color="white" sx={{ mr: 2 }}>
                    Unimplemented Cards
                </Typography>
                {/* More filters, search bars, etc., can go here */}
            </Box>
            <Box sx={styles.filterRow}>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Set filter</Typography>
                    <StyledTextField
                        select
                        value={factionFilter}
                        onChange={(e) => setFactionFilter(e.target.value)}
                        sx={{ width: 150, ml: '5px' }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        <MenuItem value="Light">Light</MenuItem>
                        <MenuItem value="Dark">Dark</MenuItem>
                    </StyledTextField>
                </Box>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Find card</Typography>
                    <StyledTextField
                        value={factionFilter}
                        onChange={(e) => setFactionFilter(e.target.value)}
                        sx={{ width: 150, ml: '5px' }}
                    >
                    </StyledTextField>
                </Box>
            </Box>
            <Divider sx={{ width:'100%' }} />
            {/* Main card area */}
            <Box sx={styles.cardOuter}>
                <Card sx={styles.cardStyle}>
                    <Box sx={styles.mainContainerStyle}>
                        {unimplementedCards.map((card) => (
                            <Box sx={styles.cardContainer} key={card.id}>
                                <Box
                                    sx={{
                                        ...styles.styleCard,
                                        backgroundImage: '',
                                    }}
                                    onMouseEnter={handlePreviewOpen}
                                    onMouseLeave={handlePreviewClose}
                                    data-card-url={''}
                                />
                                <Popover
                                    id="mouse-over-popover"
                                    sx={{ pointerEvents: 'none' }}
                                    open={open}
                                    anchorEl={anchorElement}
                                    onClose={handlePreviewClose}
                                    disableRestoreFocus
                                    slotProps={{
                                        paper: {
                                            sx: { backgroundColor: 'transparent' },
                                        },
                                    }}
                                    {...popoverConfig()}
                                >
                                    <Box
                                        sx={{
                                            ...styles.cardPreview,
                                            backgroundImage: previewImage,
                                        }}
                                    />
                                </Popover>
                                {/* Card name under the image (optional) */}
                                <Typography variant="body2" sx={{ color: 'white', mt: '0.5rem' }}>
                                    {card.name}
                                </Typography>
                            </Box>
                        ))}
                    </Box>
                </Card>
            </Box>
        </Box>
    );
}
export default UnimplementedPage;