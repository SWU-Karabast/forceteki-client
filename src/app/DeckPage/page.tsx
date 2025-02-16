'use client';
import { Box, Button, MenuItem, Typography } from '@mui/material';
import React, { ChangeEvent, useState } from 'react';
import { useRouter } from 'next/navigation'
import Grid from '@mui/material/Grid2';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

const sortByOptions: string[] = [
    'Recently Played',
    'Win rate',
];

const DeckPage: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const router = useRouter();

    // Handler to navigate to the deck subpage using the deck's id
    const handleViewDeck = (deckId: string) => {
        router.push(`/DeckPage/${deckId}`);
    };

    // ----------------------Styles-----------------------------//
    const styles = {
        lobbyTextStyle:{
            ml:'30px',
            fontSize: '3.0em',
            fontWeight: '600',
            color: 'white',
            alignSelf: 'flex-start',
            mb: '0px',
            cursor: 'pointer',
        },
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
                    <Button>Add New Deck</Button>
                </Box>
            </Box>
            <Grid container alignItems="center" spacing={1} sx={styles.gridContainer}>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('1')}/>
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('2')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('3')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('4')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('5')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('6')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>

                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('7')} />
                        </Box>
                    </Box>
                </Box>
                <Box sx={styles.deckContainer}>
                    <Box sx={styles.leaderBaseHolder}>
                        <Box sx={styles.CardSetContainerStyle}>
                            <Box>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                            <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'26px' }}>
                                <Box sx={styles.boxGeneralStyling}/>
                            </Box>
                        </Box>
                    </Box>
                    <Box sx={styles.deckMetaContainer}>
                        <Typography sx={styles.deckTitle} variant={'h3'}>Top 8 - [BN]LegoPizza - SCG Con Columbus</Typography>
                        <Box sx={styles.viewDeckButton}>
                            <PreferenceButton variant={'standard'} text={'View Deck'} buttonFnc={() => handleViewDeck('8')} />
                        </Box>
                    </Box>
                </Box>
            </Grid>
        </>
    );
};

export default DeckPage;
