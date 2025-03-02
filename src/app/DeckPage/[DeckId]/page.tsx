'use client';
import React, { ChangeEvent, useState, useEffect, useMemo } from 'react';
import {
    Box, MenuItem, Typography,
    Table, TableHead, TableBody, TableRow, TableCell
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Grid from '@mui/material/Grid2';
import DeckComponent from '@/app/_components/DeckPage/DeckComponent/DeckComponent';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';
import { useRouter, useParams } from 'next/navigation';
import { fetchDeckData, IDeckData } from '@/app/_utils/fetchDeckData';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import PercentageCircle from '@/app/_components/DeckPage/DeckComponent/PercentageCircle';
import AnimatedStatsTable from '@/app/_components/DeckPage/DeckComponent/AnimatedStatsTable';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';

const sortByOptions: string[] = ['Cost','Power','Most played'];

const DeckDetails: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const router = useRouter();
    const [deckData, setDeckData] = useState<IDeckData | undefined>(undefined);
    const params = useParams();
    const deckId = params?.DeckId;

    const opponentData = useMemo(() => {
        // List of sample leader names
        const leaderNames = [
            'Ahsoka Tano', 'Boba Fett', 'Captain Rex', 'Darth Maul',
            'Emperor Palpatine', 'General Grievous', 'Han Solo', 'Leia Organa',
            'Luke Skywalker', 'Mace Windu', 'Obi-Wan Kenobi', 'Qui-Gon Jinn',
            'Rey Skywalker', 'Thrawn', 'Yoda', 'Darth Vader',
            'Kylo Ren', 'Ezra Bridger', 'Kanan Jarrus', 'Asajj Ventress'
        ];

        return leaderNames.sort().map(leader => {
            const wins = Math.floor(Math.random() * 10);
            const losses = Math.floor(Math.random() * 10);
            const total = wins + losses;
            const winPercentage = total > 0 ? Math.round((wins / total) * 100) : 0;

            return {
                leader,
                wins,
                losses,
                winPercentage
            };
        });
    }, []);

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

    const handleBackButton = () => {
        router.push('/DeckPage');
    };

    const styles = {
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
        leaderBaseContainer:{
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            pt: '8px',
        },
        boxGeneralStylingLeader: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundImage: deckData ? `url(${s3CardImageURL(deckData.leader)})` : 'none',
            width: '14rem',
            height: '10.18rem',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
        },
        boxGeneralStylingBase: {
            backgroundColor: 'transparent',
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundImage: deckData ? `url(${s3CardImageURL(deckData.base)})` : 'none',
            width: '14rem',
            height: '10.18rem',
            backgroundRepeat: 'no-repeat',
            cursor: 'pointer',
        },
        titleContainer:{
            width:'40rem',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: '7%',
            minHeight:'3rem',
        },
        titleText:{
            mb: '0px',
            fontSize: '1.4rem',
        },
        editBox:{
            width: '16px',
            height: '16px',
            backgroundImage:'url(/edit.svg)',
            ml:'10px',
            cursor: 'pointer',
        },
        backCircle: {
            backgroundColor: '#333',
            color: '#fff',
            width: '34px',
            height: '34px',
            mr:'10px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            '&:hover': {
                backgroundColor: '#444',
            },
        },
        deckButtons:{
            width: '100%',
            height:'7%',
            minHeight:'3rem',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
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
        deckContainer:{
            width: '100%',
        },
        deckGridStyle:{
            width: '100%',
            height: '95%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },

        // Example style blocks for stats
        statsContainer:{
            marginTop: '1rem',
            height:'69%',
            overflowY: 'auto',
        },
        overallStatsBox:{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
            ml:'5px',
        },
        winCircle:{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#3f51b5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px',
        },
        gamesCircle:{
            width:'25px',
            height: '25px',
            mr:'15px',
            borderRadius: '50%',
        },
        gamesRow:{
            ml:'30px',
            display:'flex',
            flexDirection:'row',
            alignItems:'center',
            mb:'5px',
        },
        tableContainer: {
            height: '100%',         // Use available height in parent
            maxHeight: '25vh',      // Limit maximum height
            width: '100%',          // Take full width
            overflow: 'auto',       // Enable scrolling when needed
            display: 'flex',        // Use flex to maintain structure
            flexDirection: 'column', // Stack header and body
        },
        tableWrapper: {
            overflowY: 'auto',      // This is where scrolling happens
            flex: '1 1 auto',       // Take remaining space
        },
        tableHead: {
            backgroundColor: '#333',
        },
        editButtons:{
            display:'flex',
            width: '15rem',
            alignItems: 'center',
            justifyContent: 'space-between',
        },
        titleTextContainer:{
            ml:'10px',
            display:'flex',
            flexDirection: 'row',
            alignItems:'center',
        }
    }

    return (
        <>
            <Box sx={styles.bodyRow}>
                <Box sx={styles.deckMeta}>
                    {/* Title Row */}
                    <Box sx={styles.titleContainer}>
                        <PreferenceButton variant={'standard'} buttonFnc={handleBackButton}/>
                    </Box>

                    {/* Leader + Base */}
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.boxGeneralStylingLeader} />
                        <Box sx={styles.boxGeneralStylingBase} />
                    </Box>
                    <Box sx={styles.titleTextContainer}>
                        <Typography variant="h3" sx={styles.titleText}>
                            {deckData?.metadata.name}
                        </Typography>
                        <Box sx={styles.editBox} />
                    </Box>

                    {/* Stats go here */}
                    <Box sx={styles.statsContainer}>
                        {/* A row for the big win % circle and quick stats */}
                        <Box sx={styles.overallStatsBox}>
                            <PercentageCircle percentage={30} size={70} strokeWidth={12} fillColor={'#6CF3D3'} trackColor={'#367684'} textColor="#FFF"/>
                            <Box>
                                <Box sx={styles.gamesRow}>
                                    <Box sx={{ ...styles.gamesCircle, backgroundColor:'#367684' }} />
                                    <Typography variant={'h5'} sx={{ color: '#fff' }}>Games Played: 55</Typography>
                                </Box>
                                <Box sx={styles.gamesRow}>
                                    <Box sx={{ ...styles.gamesCircle, backgroundColor:'#6CF3D3' }} />
                                    <Typography variant={'h5'}>Games Won: 30</Typography>
                                </Box>
                            </Box>
                        </Box>
                        {/* A table for Opposing Leaders, Wins, Losses, etc. */}
                        <AnimatedStatsTable
                            data={opponentData}
                            animationDuration={2000}
                            staggerDelay={100}
                        />
                    </Box>
                </Box>

                {/* Right side: Sort dropdown & deck cards */}
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
                        <Box sx={styles.editButtons}>
                            <PreferenceButton variant={'standard'} text={'View Deck on SWDB'} />
                            <PreferenceButton variant={'concede'} text={'Delete'} />
                        </Box>
                    </Box>
                    <Grid sx={styles.deckGridStyle}>
                        <DeckComponent mainDeck={deckData} />
                    </Grid>
                </Box>
            </Box>
        </>
    );
};

export default DeckDetails;