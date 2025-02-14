'use client';
import { Box, Button, MenuItem, Typography } from '@mui/material';
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import React, { ChangeEvent, useState } from 'react';
import { s3ImageURL } from '@/app/_utils/s3Utils';
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
        mainContainer:{
            height: '100vh',
            overflow: 'hidden',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display:'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        disclaimer: {
            position: 'absolute',
            bottom: 0,
            width: '100%',
            padding: '1rem',
            textAlign: 'center',
            fontSize: '0.90rem',
        },
        overlayStyle:{
            padding: '30px',
            zIndex: 10,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            border: '3px solid transparent',
            backdropFilter: 'blur(30px)',

            borderRadius:'15px',
            width: '95vw',
            justifySelf:'center',
            height: '81vh',
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
        <Box sx={styles.mainContainer}>
            <Box sx={styles.overlayStyle}>
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
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
                                <PreferenceButton variant={'standard'} text={'View Deck'} />
                            </Box>
                        </Box>
                    </Box>

                </Grid>
            </Box>
            <Typography variant="body1" sx={styles.disclaimer}>
                Karabast is in no way affiliated with Disney or Fantasy Flight Games.
                Star Wars characters, cards, logos, and art are property of Disney
                and/or Fantasy Flight Games.
            </Typography>
        </Box>
    );
};

export default DeckPage;
