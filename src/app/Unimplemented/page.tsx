'use client';
import React, { useEffect, useState } from 'react';
import {
    Box,
    Card,
    Typography,
    Popover,
    PopoverOrigin,
    MenuItem, Divider
} from '@mui/material';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { IPreviewCard } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';

const UnimplementedPage = () => {
    const [anchorElement, setAnchorElement] = React.useState<HTMLElement | null>(null);
    const [previewImage, setPreviewImage] = React.useState<string | null>(null);
    const [previewCardType, setPreviewCardType] = React.useState<string | null>(null);
    const [unimplementedCards, setUnimplementedCards] = React.useState<IPreviewCard[]>([]);
    const [filteredCards, setFilteredCards] = React.useState<IPreviewCard[]>([]);
    const [availableSets, setAvailableSets] = React.useState<string[]>([]);
    const hoverTimeout = React.useRef<number | undefined>(undefined);
    const open = Boolean(anchorElement);
    const router = useRouter();

    // Filter states
    const [setFilter, setSetFilter] = useState('All');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        // Fetch unimplemented cards
        const fetchUnimplementedCards = async () => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/get-unimplemented`);
                if (!response.ok) {
                    throw new Error(`Error fetching cards: ${response.statusText}`);
                }
                const data = await response.json();
                setUnimplementedCards(data);
                setFilteredCards(data);

                // Extract unique sets for the filter dropdown
                const sets = data.reduce((acc: string[], card: IPreviewCard) => {
                    if (card.setId && card.setId.set && !acc.includes(card.setId.set)) {
                        acc.push(card.setId.set.toUpperCase());
                    }
                    return acc;
                }, []);

                setAvailableSets(sets);
            } catch (error) {
                console.error('Error fetching cards:', error);
            }
        };

        fetchUnimplementedCards();
    }, []);

    // Apply filters whenever filter criteria change
    useEffect(() => {
        let results = unimplementedCards;

        // Apply set filter if not "All"
        if (setFilter !== 'All') {
            results = results.filter((card: IPreviewCard) =>
                card.setId && card.setId.set.toUpperCase() === setFilter
            );
        }

        // Apply search query filter if not empty
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            results = results.filter((card: IPreviewCard) => {
                const titleAndSubtitle = card.titleAndSubtitle?.toLowerCase() || '';
                return titleAndSubtitle.includes(query);
            });
        }

        setFilteredCards(results);
    }, [unimplementedCards, setFilter, searchQuery]);

    // Handle back button click
    const handleBackClick = () => {
        router.push('/');
    };

    // Hover handlers for card preview
    const handlePreviewOpen = (event: React.MouseEvent<HTMLElement>, cardType: string) => {
        const target = event.currentTarget;
        const imageUrl = target.getAttribute('data-card-url');

        if (!imageUrl) return;

        hoverTimeout.current = window.setTimeout(() => {
            setAnchorElement(target);
            setPreviewImage(`url(${imageUrl})`);
            setPreviewCardType(cardType);
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
        headerRow: {
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1rem',
            position: 'relative' as const,
        },
        backButton: {
            position: 'absolute' as const,
            left: '10px',
            height:'100%'
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
        leaderStyleCard:{
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: '10rem',
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        cardPreview: {
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '16rem',
        },
        cardLeaderBasePreview:{
            borderRadius: '.38em',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1.4 / 1',
            width: '21rem',
        },
        filterBox:{
            display:'flex',
            alignItems: 'center',
            justifyContent: 'center',
            ml: '4rem',
        },
        resultsCount: {
            color: 'white',
            textAlign: 'center',
            margin: '0.5rem 0',
        }
    };

    return (
        <Box sx={styles.pageContainer}>
            {/* Header with Back button */}
            <Box sx={styles.headerRow}>
                <Box sx={styles.backButton}>
                    <PreferenceButton
                        variant={'standard'}
                        text="Back"
                        buttonFnc={handleBackClick}
                    />
                </Box>
                <Typography variant={'h5'} color="white">
                    Unimplemented Cards
                </Typography>
            </Box>

            {/* Filters */}
            <Box sx={styles.filterRow}>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Set filter</Typography>
                    <StyledTextField
                        select
                        value={setFilter}
                        onChange={(e) => setSetFilter(e.target.value)}
                        sx={{ width: 150, ml: '10px' }}
                    >
                        <MenuItem value="All">All</MenuItem>
                        {availableSets.map((set) => (
                            <MenuItem key={set} value={set}>{set}</MenuItem>
                        ))}
                    </StyledTextField>
                </Box>
                <Box sx={styles.filterBox}>
                    <Typography variant={'h3'}>Find card</Typography>
                    <StyledTextField
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by name..."
                        sx={{ width: '300px', ml: '10px' }}
                    />
                </Box>
            </Box>

            <Divider sx={{ width:'100%' }} />

            {/* Results count */}
            <Typography variant="body1" sx={styles.resultsCount}>
                Showing {filteredCards.length} of {unimplementedCards.length} cards
            </Typography>

            {/* Main card area */}
            <Box sx={styles.cardOuter}>
                <Card sx={styles.cardStyle}>
                    <Box sx={styles.mainContainerStyle}>
                        {filteredCards.map((card: IPreviewCard) => (
                            <Box sx={styles.cardContainer} key={card.id}>
                                <Box
                                    sx={card.types === 'leader' || card.types === 'base' ? {
                                        ...styles.leaderStyleCard,
                                        backgroundImage: `url(${s3CardImageURL(card)})`,
                                    } : {
                                        ...styles.styleCard,
                                        backgroundImage: `url(${s3CardImageURL(card)})`,
                                    }}
                                    onMouseEnter={(e) => handlePreviewOpen(e, card.types)}
                                    onMouseLeave={handlePreviewClose}
                                    data-card-url={s3CardImageURL(card)}
                                />
                            </Box>
                        ))}
                    </Box>
                </Card>
            </Box>

            {/* Card preview popover */}
            <Popover
                id="mouse-over-popover"
                sx={{ pointerEvents: 'none' }}
                open={open}
                anchorEl={anchorElement}
                onClose={handlePreviewClose}
                disableRestoreFocus
                disableAutoFocus={true}
                disableEnforceFocus={true}
                keepMounted
                slotProps={{
                    paper: {
                        sx: { backgroundColor: 'transparent' },
                    },
                }}
                {...popoverConfig()}
            >
                <Box
                    sx={
                        previewCardType === 'leader' || previewCardType === 'base'
                            ? { ...styles.cardLeaderBasePreview, backgroundImage: previewImage }
                            : { ...styles.cardPreview, backgroundImage: previewImage }
                    }
                    tabIndex={-1}
                    aria-hidden="true"
                />
            </Popover>
        </Box>
    );
}

export default UnimplementedPage;