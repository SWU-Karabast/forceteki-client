'use client';
import { Box, MenuItem, Typography } from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid2';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { IDeckData } from '@/app/_utils/fetchDeckData';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import AddDeckDialog from '@/app/_components/_sharedcomponents/DeckPage/AddDeckDialog';

const sortByOptions: string[] = [
    'Recently Played',
    'Win rate',
];

const DeckPage: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const [decks, setDecks] = useState<IDeckData[]>([]);
    const [addDeckDialogOpen, setAddDeckDialogOpen] = useState<boolean>(false);
    const router = useRouter();

    // Handle successful deck addition
    const handleAddDeckSuccess = (deckData: IDeckData) => {
        setDecks(prevDecks => [...prevDecks, deckData]);
    };

    // Handler to navigate to the deck subpage using the deck's id
    const handleViewDeck = (deckId: string) => {
        router.push(`/DeckPage/${deckId}`);
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
            width:'100px'
        },
        sortByContainer:{
            display:'flex',
            flexDirection: 'row',
            width:'300px',
            alignItems:'center',
        },
        deckContainer:{
            background: '#20344280',
            width: '31rem',
            height: '13rem',
            borderRadius: '5px',
            padding:'5px',
            display:'flex',
            flexDirection: 'row',
            '&:hover': {
                backgroundColor: '#2F7DB680',
            },
            cursor: 'pointer',
        },
        gridContainer:{
            mt: '30px',
            overflowY: 'auto',
            maxHeight: '90%',
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
        }
    };

    return (
        <>
            <Box sx={styles.header}>
                <Box sx={styles.sortByContainer}>
                    <Typography variant={'h3'} sx={styles.sortBy}>Sort by</Typography>
                    <StyledTextField
                        select
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
                </Box>
                <Box>
                    <PreferenceButton variant={'standard'} text={'Add New Deck'} buttonFnc={() => setAddDeckDialogOpen(true)}/>
                </Box>
            </Box>
            <Grid container alignItems="center" spacing={1} sx={styles.gridContainer}>
                {decks.map((deck) => (
                    <Box key={deck.deckID} sx={styles.deckContainer}>
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
                                    buttonFnc={() => handleViewDeck(deck.deckID)}
                                />
                            </Box>
                        </Box>
                    </Box>
                ))}
                <AddDeckDialog
                    open={addDeckDialogOpen}
                    onClose={() => setAddDeckDialogOpen(false)}
                    onSuccess={handleAddDeckSuccess}
                />
            </Grid>
        </>
    );
};

export default DeckPage;
