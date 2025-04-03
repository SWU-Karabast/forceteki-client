'use client';
import { Box, MenuItem, Typography } from '@mui/material';
import React, { ChangeEvent, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid2';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { IDeckData } from '@/app/_utils/fetchDeckData';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import AddDeckDialog from '@/app/_components/_sharedcomponents/DeckPage/AddDeckDialog';
import ConfirmationDialog from '@/app/_components/_sharedcomponents/DeckPage/ConfirmationDialog';
import { DisplayDeck } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import {
    convertToDisplayDecks, deleteDecks, loadDecks, toggleFavouriteDeck,
} from '@/app/_utils/DeckStorageUtils';
import { useUser } from '@/app/_contexts/User.context';



const sortByOptions: string[] = [
    'Favourites',
    'Deck builder',
    'Name'
];

const DeckPage: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('Favourites');
    const [decks, setDecks] = useState<DisplayDeck[]>([]);
    const [addDeckDialogOpen, setAddDeckDialogOpen] = useState<boolean>(false);
    const [selectedDecks, setSelectedDecks] = useState<string[]>([]); // Track selected decks
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const [ConfirmationDialogMessage, setConfirmationDialogMessage] = useState<string>('');
    const router = useRouter();
    const { user } = useUser();

    // Load decks from localStorage on component mount
    useEffect(() => {
        fetchDecks();
    }, []);

    // Function to load decks from localStorage and server
    const fetchDecks = async () => {
        try {
            // Call the loadDecks function and await the result
            const fetchedDecks = await loadDecks();
            // Update state with the fetched decks converted to display format
            // Default to favourites first if sort option is unrecognized
            fetchedDecks.sort((a, b) => {
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return 0;
            });
            setDecks(convertToDisplayDecks(fetchedDecks));
        } catch (error) {
            console.error('Error fetching decks:', error);
        }
    };

    // sort function
    const sortDecks = (sort:string) => {
        const sortedDecks = [...decks]; // Create a new array to avoid modifying state directly

        switch (sort) {
            case 'Favourites':
                sortedDecks.sort((a, b) => {
                    // Favourite decks first
                    if (a.favourite && !b.favourite) return -1;
                    if (!a.favourite && b.favourite) return 1;
                    // Then sort by name
                    return a.metadata.name.localeCompare(b.metadata.name);
                });
                break;

            case 'Deck builder':
                sortedDecks.sort((a, b) => {
                    // First by builder
                    const sourceCompare = a.source.localeCompare(b.source);
                    // If sources are different, sort by source
                    if (sourceCompare !== 0) return sourceCompare;
                    // Finally by name within each group
                    return a.metadata.name.localeCompare(b.metadata.name);
                });
                break;

            case 'Name':
                sortedDecks.sort((a, b) => {
                    // Alphabetically by name
                    return a.metadata.name.localeCompare(b.metadata.name);
                });
                break;

            default:
                // Default to favourites first if sort option is unrecognized
                sortedDecks.sort((a, b) => {
                    if (a.favourite && !b.favourite) return -1;
                    if (!a.favourite && b.favourite) return 1;
                    return 0;
                });
        }
        setDecks(sortedDecks);
    };

    // Handle successful deck addition
    const handleAddDeckSuccess = (deckData: IDeckData, deckLink: string) => {
        const source = deckLink.includes('swustats.net') ? 'SWUSTATS' : 'SWUDB';
        const newDeck: DisplayDeck = {
            deckID: deckData.deckID,
            leader: { id: deckData.leader.id, types:['leader'] },
            base: { id: deckData.base.id, types:['base'] },
            metadata: { name: deckData.metadata?.name || 'Untitled Deck' },
            favourite: false,
            source: source,
            deckLink: deckLink,
        };

        // Add the new deck and re-sort to maintain favorites first
        setDecks(prevDecks => {
            if(prevDecks.some(deck => deck.deckID === newDeck.deckID)) return prevDecks;

            const updatedDecks = [...prevDecks, newDeck];
            return updatedDecks.sort((a, b) => {
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return 0;
            });
        });
    };

    // Handler to navigate to the deck subpage using the deck's id
    const handleViewDeck = (deckId: string) => {
        router.push(`/DeckPage/${deckId}`);
    };

    const handleRedirect = (deckLink: string, e:React.MouseEvent) => {
        e.stopPropagation();
        if (deckLink) {
            window.open(deckLink, '_blank');
        }
    }

    // Handle deck selection
    const toggleDeckSelection = (deckId: string) => {
        setSelectedDecks(prevSelected => {
            // Check if the deck is already selected
            if (prevSelected.includes(deckId)) {
                // Remove from selection
                return prevSelected.filter(id => id !== deckId);
            } else {
                // Add to selection
                return [...prevSelected, deckId];
            }
        });
    };

    // Toggle favorite status for a deck
    const toggleFavorite = async (deckId: string, e:React.MouseEvent) => {
        e.stopPropagation();
        // we call the response
        const deckFav = !decks.find((deck) => deck.deckID === deckId)?.favourite;
        try {
            await toggleFavouriteDeck(deckId,deckFav)
            // Update in state and resort
            const updatedDecks = decks.map(deck =>
                deck.deckID === deckId
                    ? { ...deck, favourite: deckFav }
                    : deck
            );

            // Re-sort to ensure favorites appear first
            const sortedDecks = [...updatedDecks].sort((a, b) => {
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;
                return 0;
            });

            setDecks(sortedDecks);
        }catch(error){
            // TODO throw error to user
            console.log(error)
        }
    };

    // Open delete confirmation dialog
    const openDeleteDialog = () => {
        if (selectedDecks.length > 0) {
            setConfirmationDialogMessage(`Are you sure you want to delete ${selectedDecks.length} deck${selectedDecks.length > 1 ? 's' : ''}? This action cannot be undone.`)
            setDeleteDialogOpen(true);
        }
    };

    // Delete selected decks
    const handleDeleteSelectedDecks = async () => {
        // Delete each selected deck from localStorage
        try{
            await deleteDecks(selectedDecks);
            // Update deck list in state
            setDecks(prevDecks => prevDecks.filter(deck => !selectedDecks.includes(deck.deckID)));
            // Reset selection
            setSelectedDecks([]);
        } catch (error){
            console.log(error);
            setConfirmationDialogMessage('There was an error when deleting decks. Try again later. '+error);
        }
        // Close dialog
        setDeleteDialogOpen(false);
    };

    // Handle sort option change
    const handleSortChange = (e: ChangeEvent<HTMLInputElement>) => {
        setSortBy(e.target.value);
        sortDecks(e.target.value);
    };

    // ----------------------Styles-----------------------------//
    const styles = {
        header:{
            width: '100%',
            flexDirection: 'row',
            display:'flex',
            justifyContent: 'space-between',
        },
        sortBy:{
            minWidth:'100px'
        },
        sortByContainer:{
            display:'flex',
            flexDirection: 'row',
            alignItems:'center',
        },
        dropdown:{
            maxWidth:'10rem',
        },
        deckContainer: (isSelected: boolean) => ({
            background: isSelected ? '#2F7DB680' : '#20344280',
            width: '31rem',
            height: '13rem',
            borderRadius: '5px',
            padding:'5px',
            display:'flex',
            flexDirection: 'row',
            border: '2px solid transparent',
            '&:hover': {
                backgroundColor: '#2F7DB680',
            },
            cursor: 'pointer',
            position: 'relative',
        }),
        gridContainer:{
            mt: '30px',
            overflowY: 'auto',
            maxHeight: '84%',
        },
        CardSetContainerStyle:{
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
            width: '15.2rem',
            height: '12.1rem'
        },
        parentBoxStyling: {
            position:'absolute',
        },
        boxGeneralStyling: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            width: '14rem',
            height: '10.18rem',
            backgroundImage: 'url(/leaders/boba.webp)',
            backgroundRepeat: 'no-repeat',
            textAlign: 'center' as const,
            color: 'white',
            display: 'flex',
            cursor: 'pointer',
            position: 'relative' as const,
            ml: '15px',
        },
        leaderBaseHolder:{
            display:'flex',
            alignItems:'center',
            height:'100%',
            width: 'calc(55% - 5px)'
        },
        deckMetaContainer:{
            display:'flex',
            flexDirection:'column',
            width:'calc(45% - 5px)',
            height:'100%',
            justifyContent: 'space-between',
        },
        deckTitle:{
            mt: '14%',
        },
        viewDeckButton:{
            display:'flex',
            marginBottom: '7%',
            gap: '0.5rem',
            width:'fit-content',
        },
        favoriteIcon: {
            position: 'absolute',
            top: '10px',
            right: '10px',
            fontSize: '24px',
            color: 'gold',
            cursor: 'pointer',
            zIndex: 10,
        },
        deleteIcon: {
            position: 'absolute',
            top: '10px',
            right: '40px',
            fontSize: '20px',
            color: '#FF5555',
            cursor: 'pointer',
            zIndex: 10,
        },
        noDecksMessage: {
            color: 'white',
            width: '100%',
            textAlign: 'center',
            marginTop: '2rem',
        },
        addNewDeck:{
            width:'350px',
            ml:'40px'
        },
        selectionInfo: {
            color: 'white',
            margin: '0 20px',
        },
        // New style for the selection checkmark
        selectionCheckmark: {
            position: 'absolute',
            bottom: '34px',
            right: '10px',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            backgroundColor: '#66E5FF',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
        },
        checkmarkSymbol: {
            color: '#1E2D32',
            fontWeight: 'bold',
            fontSize: '16px',
        },
        sourceTag: {
            padding: '4px 10px',
            borderRadius: '15px',
            fontSize: '0.75rem',
            fontWeight: '500',
            display: 'inline-block',
            marginTop: '8px',
            marginBottom: '12px',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            border: '1px solid',
            boxShadow: '0 0 5px',
            width:'fit-content',
        },
        swuStatsTag: {
            borderColor: '#FFD700', // Blue for SWUStats
            color: '#FFD700',
            '&:hover': {
                backgroundColor: '#FFD700',
                color: '#000000',
            },
            boxShadow: '0 0 5px #FFD700',
        },
        swudbTag: {
            borderColor: '#4CB5FF', // Purple for SWUDB
            color: '#4CB5FF',
            '&:hover': {
                backgroundColor: '#4CB5FF',
                color: '#000000',
            },
            boxShadow: '0 0 5px #4CB5FF',
        },
    };

    return (
        <>
            <Box sx={styles.header}>
                <Box sx={styles.sortByContainer}>
                    <Typography variant={'h3'} sx={styles.sortBy}>Sort by</Typography>
                    <StyledTextField
                        select
                        sx={styles.dropdown}
                        value={sortBy}
                        placeholder="Sort by"
                        onChange={handleSortChange}
                    >
                        {sortByOptions.map((sortOption) => (
                            <MenuItem key={sortOption} value={sortOption}>
                                {sortOption}
                            </MenuItem>
                        ))}
                    </StyledTextField>
                    <Box sx={styles.addNewDeck}>
                        <PreferenceButton variant={'standard'} text={'Add New Deck'} buttonFnc={() => setAddDeckDialogOpen(true)}/>
                    </Box>
                </Box>
                <Box>
                    <PreferenceButton
                        variant={'concede'}
                        text={'Delete deck(s)'}
                        buttonFnc={openDeleteDialog}
                        disabled={selectedDecks.length === 0}
                    />
                </Box>
            </Box>
            <Grid container alignItems="center" spacing={1} sx={styles.gridContainer}>
                {decks.length > 0 ? (
                    decks.map((deck) => {
                        const isSelected = selectedDecks.includes(deck.deckID);
                        return (
                            <Box
                                key={deck.deckID}
                                sx={styles.deckContainer(isSelected)}
                                onClick={() => toggleDeckSelection(deck.deckID)}
                            >
                                {/* Favorite Icon */}
                                <Box
                                    component="span"
                                    sx={styles.favoriteIcon}
                                    onClick={(e) => toggleFavorite(deck.deckID, e)}
                                >
                                    {deck.favourite ? '★' : '☆'}
                                </Box>
                                {isSelected && (
                                    <Box sx={styles.selectionCheckmark}>
                                        <Typography sx={styles.checkmarkSymbol}>✓</Typography>
                                    </Box>
                                )}
                                <Box sx={styles.leaderBaseHolder}>
                                    <Box sx={styles.CardSetContainerStyle}>
                                        <Box>
                                            <Box sx={{ ...styles.boxGeneralStyling, backgroundImage:`url(${s3CardImageURL({ id: deck.base.id, count:0 })})` }} />
                                        </Box>
                                        <Box sx={{ ...styles.parentBoxStyling, left: '-15px', top: '26px' }}>
                                            <Box sx={{ ...styles.boxGeneralStyling, backgroundImage:`url(${s3CardImageURL({ id: deck.leader.id, count:0 })})` }} />
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={styles.deckMetaContainer}>
                                    <Typography sx={styles.deckTitle} variant="h3">
                                        {deck.metadata.name}
                                    </Typography>
                                    {deck.source && (
                                        <Typography
                                            sx={{
                                                ...styles.sourceTag,
                                                ...(deck.source === 'SWUSTATS' ? styles.swuStatsTag : styles.swudbTag)
                                            }}
                                            onClick={(e) => handleRedirect(deck.deckLink, e)}
                                        >
                                            {deck.source}
                                        </Typography>
                                    )}
                                    <Box sx={styles.viewDeckButton} onClick={(e) => e.stopPropagation()}>
                                        <PreferenceButton
                                            variant="standard"
                                            text="View Deck"
                                            buttonFnc={() => handleViewDeck(deck.deckID)}
                                        />
                                    </Box>
                                </Box>
                            </Box>
                        );
                    })
                ) : (
                    <Typography variant="h3" sx={styles.noDecksMessage}>
                        No decks found. Add a deck to get started!
                    </Typography>
                )}
            </Grid>

            {/* Dialogs */}
            <AddDeckDialog
                open={addDeckDialogOpen}
                onClose={() => setAddDeckDialogOpen(false)}
                onSuccess={handleAddDeckSuccess}
            />

            <ConfirmationDialog
                open={deleteDialogOpen}
                title="Delete Decks"
                message={ConfirmationDialogMessage}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteSelectedDecks}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
            />
        </>
    );
};

export default DeckPage;