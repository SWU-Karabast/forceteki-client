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

// Define interfaces for deck data
interface StoredDeck {
    leader: { id: string };
    base: { id: string };
    name: string;
    favourite: boolean;
    deckLink: string;
    deckID: string;
}

interface DisplayDeck {
    deckID: string;
    leader: { id: string, types:string[] };
    base: { id: string, types:string[] };
    metadata: { name: string };
    favourite: boolean;
}

const sortByOptions: string[] = [
    'Recently Played',
    'Win rate',
];

const DeckPage: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const [decks, setDecks] = useState<DisplayDeck[]>([]);
    const [addDeckDialogOpen, setAddDeckDialogOpen] = useState<boolean>(false);
    const [selectedDecks, setSelectedDecks] = useState<string[]>([]); // Track selected decks
    const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
    const router = useRouter();

    // Load decks from localStorage on component mount
    useEffect(() => {
        loadDecksFromStorage();
    }, []);

    // Function to load decks from localStorage
    const loadDecksFromStorage = () => {
        try {
            const displayDecks: DisplayDeck[] = [];

            // Get all localStorage keys
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                // Check if this is a deck key
                if (key && key.startsWith('swu_deck_')) {
                    const deckID = key.replace('swu_deck_', '');
                    const deckDataJSON = localStorage.getItem(key);

                    if (deckDataJSON) {
                        const deckData = JSON.parse(deckDataJSON) as StoredDeck;

                        // Convert to display format
                        displayDecks.push({
                            deckID,
                            leader: { id: deckData.leader.id, types:['leader'] },
                            base: { id: deckData.base.id, types:['base'] },
                            metadata: { name: deckData.name },
                            favourite: deckData.favourite
                        });
                    }
                }
            }

            // Sort decks to show favorites first
            const sortedDecks = [...displayDecks].sort((a, b) => {
                // If one is favorite and other is not, favorite comes first
                if (a.favourite && !b.favourite) return -1;
                if (!a.favourite && b.favourite) return 1;

                // Otherwise maintain original order or sort by name if needed
                return 0;
            });

            setDecks(sortedDecks);
        } catch (error) {
            console.error('Error loading decks from localStorage:', error);
        }
    };

    // Handle successful deck addition
    const handleAddDeckSuccess = (deckData: IDeckData) => {
        const newDeck: DisplayDeck = {
            deckID: deckData.deckID,
            leader: { id: deckData.leader.id, types:['leader'] },
            base: { id: deckData.base.id, types:['base'] },
            metadata: { name: deckData.metadata?.name || 'Untitled Deck' },
            favourite: false
        };

        // Add the new deck and re-sort to maintain favorites first
        setDecks(prevDecks => {
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
        // Only navigate if no decks are selected
        if (selectedDecks.length === 0) {
            router.push(`/DeckPage/${deckId}`);
        }
    };

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
    const toggleFavorite = (deckId: string, e:React.MouseEvent) => {
        e.stopPropagation();
        // Update in state and resort
        const updatedDecks = decks.map(deck =>
            deck.deckID === deckId
                ? { ...deck, favourite: !deck.favourite }
                : deck
        );

        // Re-sort to ensure favorites appear first
        const sortedDecks = [...updatedDecks].sort((a, b) => {
            if (a.favourite && !b.favourite) return -1;
            if (!a.favourite && b.favourite) return 1;
            return 0;
        });

        setDecks(sortedDecks);

        // Update in localStorage
        try {
            const storageKey = `swu_deck_${deckId}`;
            const deckDataJSON = localStorage.getItem(storageKey);

            if (deckDataJSON) {
                const deckData = JSON.parse(deckDataJSON) as StoredDeck;
                deckData.favourite = !deckData.favourite;
                localStorage.setItem(storageKey, JSON.stringify(deckData));
            }
        } catch (error) {
            console.error('Error updating favorite status:', error);
        }
    };

    // Open delete confirmation dialog
    const openDeleteDialog = () => {
        if (selectedDecks.length > 0) {
            setDeleteDialogOpen(true);
        }
    };

    // Delete selected decks
    const handleDeleteSelectedDecks = () => {
        // Delete each selected deck from localStorage
        selectedDecks.forEach(deckId => {
            try {
                const storageKey = `swu_deck_${deckId}`;
                localStorage.removeItem(storageKey);
            } catch (error) {
                console.error(`Error deleting deck ${deckId}:`, error);
            }
        });

        // Update deck list in state
        setDecks(prevDecks => prevDecks.filter(deck => !selectedDecks.includes(deck.deckID)));

        // Reset selection
        setSelectedDecks([]);

        // Close dialog
        setDeleteDialogOpen(false);
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
        }
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
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            setSortBy(e.target.value)
                        }
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
                                            <Box sx={{ ...styles.boxGeneralStyling, backgroundImage:`url(${s3CardImageURL(deck.base)})` }} />
                                        </Box>
                                        <Box sx={{ ...styles.parentBoxStyling, left: '-15px', top: '26px' }}>
                                            <Box sx={{ ...styles.boxGeneralStyling, backgroundImage:`url(${s3CardImageURL(deck.leader)})` }} />
                                        </Box>
                                    </Box>
                                </Box>
                                <Box sx={styles.deckMetaContainer}>
                                    <Typography sx={styles.deckTitle} variant="h3">
                                        {deck.metadata.name}
                                    </Typography>
                                    <Box sx={styles.viewDeckButton}>
                                        <PreferenceButton
                                            variant="standard"
                                            text="View Deck"
                                            buttonFnc={() => {
                                                handleViewDeck(deck.deckID);
                                            }}
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
                message={`Are you sure you want to delete ${selectedDecks.length} deck${selectedDecks.length > 1 ? 's' : ''}? This action cannot be undone.`}
                onCancel={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteSelectedDecks}
                confirmButtonText="Delete"
                cancelButtonText="Cancel"
            />
        </>
    );
};

export default DeckPage;