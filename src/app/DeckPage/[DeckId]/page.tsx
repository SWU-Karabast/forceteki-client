'use client';
import React, { ChangeEvent, useState, useEffect } from 'react';
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

const sortByOptions: string[] = ['Cost','Power','Most played'];

const DeckDetails: React.FC = () => {
    const [sortBy, setSortBy] = useState<string>('');
    const router = useRouter();
    const [deckData, setDeckData] = useState<IDeckData | undefined>(undefined);
    const params = useParams();
    const deckId = params?.DeckId;

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
            height: '100%',
            justifyContent: 'center',
            backgroundColor: 'transparent',
        },

        // Example style blocks for stats
        statsContainer:{
            marginTop: '1rem',
        },
        overallStatsBox:{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '1rem',
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
    }

    return (
        <>
            <Box sx={styles.bodyRow}>
                <Box sx={styles.deckMeta}>
                    {/* Title Row */}
                    <Box sx={styles.titleContainer}>
                        <Box sx={styles.backCircle} onClick={handleBackButton}>
                            <ArrowBackIosNewIcon fontSize="small" />
                        </Box>
                        <Typography variant="h3" sx={styles.titleText}>
                            {deckData?.metadata.name}
                        </Typography>
                        <Box sx={styles.editBox} />
                    </Box>

                    {/* Leader + Base */}
                    <Box sx={styles.leaderBaseContainer}>
                        <Box sx={styles.boxGeneralStylingLeader} />
                        <Box sx={styles.boxGeneralStylingBase} />
                    </Box>

                    {/* Stats go here */}
                    <Box sx={styles.statsContainer}>
                        {/* A row for the big win % circle and quick stats */}
                        <Box sx={styles.overallStatsBox}>
                            <PercentageCircle percentage={30} size={70} strokeWidth={12} fillColor={'#367684'} trackColor={'#6CF3D3'} textColor="#FFF"/>
                            <Box>
                                <Typography variant={'h5'} sx={{ color: '#fff' }}>Games Played: 55</Typography>
                                <Typography>Games Won: 30</Typography>
                            </Box>
                        </Box>

                        {/* A table for Opposing Leaders, Wins, Losses, etc. */}
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell><Typography sx={{ color: '#fff' }}>Opposing Leader</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>Wins</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>Losses</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>Win %</Typography></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                <TableRow key={'test'}>
                                    <TableCell><Typography sx={{ color: '#fff' }}>opponent.leaderName</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>opponent.wins</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>opponent.losses</Typography></TableCell>
                                    <TableCell><Typography sx={{ color: '#fff' }}>opponent.winPercentage%</Typography></TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
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