'use client';
import React, { ChangeEvent, useState, useEffect } from 'react';
import { Box, MenuItem, Typography } from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Grid from '@mui/material/Grid2';
import DeckComponent from '@/app/_components/DeckPage/DeckComponent/DeckComponent';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { useRouter, useParams } from 'next/navigation';
import { fetchDeckData } from '@/app/_utils/fetchDeckData';

const sortByOptions: string[] = [
    'Cost',
    'Power',
    'Most played',
];

const DeckDetails: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const router = useRouter();
    const [deckData, setDeckData] = useState<any>(null);
    const params = useParams();
    const deckId = params?.DeckId; // assuming your route is something like /DeckPage/[deckId]

    // Fetch the deck data when deckId changes
    useEffect(() => {
        if (deckId) {
            (async () => {
                try {
                    const data = await fetchDeckData(`https://swudb.com/deck/${deckId}`, false);
                    setDeckData(data);
                } catch (error) {
                    console.error('Error fetching deck data:', error);
                }
            })();
        }
    }, [deckId]);


    // Handler to navigate to the deck subpage using the deck's id
    const handleBackButton = () => {
        router.push('/DeckPage');
    };

    // TODO this is where we get the deck information from the backend
    const styles = {
        overlay: {
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
        },
        bodyRow:{
            height:'100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
        },
        deckMeta:{
            width: '34rem',
            height:'100%',
        },
        deckGridStyle:{
            width: '100%',
            height: '100%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },
        titleContainer:{
            width:'40rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: '7%',
            minHeight:'3rem',
        },
        editBox:{
            width: '16px',
            height: '16px',
            backgroundImage:'url(/edit.svg)',
            ml:'10px',
            cursor: 'pointer',
        },
        deckButtons:{
            width: '100%',
            height:'7%',
            minHeight:'3rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'space-between',
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
        },
        leaderBaseContainer:{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            pt: '8px',
        },
        sortBy:{
            width: '13rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
        },
        sortText:{
            width: '5rem',
            mb:'0px'
        },
        backCircle: {
            backgroundColor: '#333',     // Dark circle background
            color: '#fff',               // White arrow
            width: '34px',
            height: '34px',
            mr:'10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#444',   // Slightly lighter on hover
            },
        },
        titleText:{
            mb: '0px',
            fontSize: '1.4rem',
        },
        deckContainer:{
            width: '100%',
        }
    }
    return (
        <>
            <Box sx={styles.bodyRow}>
                <Box sx={styles.deckMeta}>
                    <Box sx={styles.titleContainer}>
                        <Box sx={styles.backCircle} onClick={handleBackButton}><ArrowBackIosNewIcon fontSize="small" /></Box>
                        <Typography variant={'h3'} sx={styles.titleText}>Fast & Furious Boba</Typography>
                        <Box sx={styles.editBox}></Box>
                    </Box>
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.boxGeneralStyling}></Box>
                        <Box sx={styles.boxGeneralStyling}></Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.deckButtons}>
                        <Box sx={styles.sortBy}>
                            <Typography sx={styles.sortText}>Sort by</Typography>
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
                    </Box>
                    <Grid sx={styles.deckGridStyle}>
                        <DeckComponent mainDeck={deckData ? deckData.deck : []} sideBoard={deckData ? deckData.sideboard : []}/>
                    </Grid>
                </Box>
            </Box>
        </>
    )
}

export default DeckDetails;