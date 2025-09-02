import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, Divider, FormControl, Typography, MenuItem } from '@mui/material';
import PublicMatch from '../PublicMatch/PublicMatch';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import StyledTextField from '@/app/_components/_sharedcomponents/_styledcomponents/StyledTextField';

interface GameCardData {
    id: string;
    isPrivate: boolean;
    player1Leader: ICardData;
    player1Base: ICardData;
    player2Leader: ICardData;
    player2Base: ICardData;
}

interface OngoingGamesData {
    numberOfOngoingGames: number;
    ongoingGames: GameCardData[];
}

const fetchOngoingGames = async (setGamesData: (games: OngoingGamesData | null) => void,
    sortByRecent: 'asc' | 'desc') => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/ongoing-games`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ongoing games: ${response.status} ${response.statusText}`);
        }

        const fetchedData: OngoingGamesData = await response.json();
        if (sortByRecent === 'desc') {
            fetchedData.ongoingGames.reverse();
        }
        setGamesData(fetchedData);
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setGamesData(null); // Handle error case
    }
};


const GamesInProgress: React.FC = () => {
    const [gamesData, setGamesData] = useState<OngoingGamesData | null>(null);
    const [sortByRecent, setSortByRecent] = useState<'asc' | 'desc'>('asc');
    const [sortByLeader, setSortByLeader] = useState<string>('');

    useEffect(() => {
        let count = 0;
        let intervalId: NodeJS.Timeout;

        const fetchData = () => {
            fetchOngoingGames(setGamesData, sortByRecent);
            count++;

            if (count === 6) {
                clearInterval(intervalId);
                intervalId = setInterval(() => {
                    fetchOngoingGames(setGamesData, sortByRecent);
                    count++;
                    if (count === 15) {
                        clearInterval(intervalId);
                    }
                }, 60000); // Fetch once per minute
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 10000); // Fetch every 10 seconds

        return () => clearInterval(intervalId);
    }, [sortByRecent]);

    const styles = {
        headerBox: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            alignContent: 'center',
            mt: 1,
        },
        divider: {
            mt: '.5vh',
            mb: '1vh',
        },
        activeGamesNumber: {
            fontWeight: 400,
        },
        sortFilterRow: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '2px',
        },
        spectateInput: {
            width: 'fit-content',
        }
    };

    return (
        <>
            <Box sx={styles.headerBox}>
                <Typography variant="h3">Games in Progress</Typography>
                <Typography variant="h3" sx={styles.activeGamesNumber}>{gamesData?.numberOfOngoingGames || 0}</Typography>
            </Box>
            <Box sx={{ ...styles.sortFilterRow, marginTop: '1vh' }}>
                <Typography variant="body1">Sort By:</Typography>
                <StyledTextField
                    select
                    value={sortByRecent}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSortByRecent(e.target.value as 'asc' | 'desc')
                    }
                    sx={styles.spectateInput}
                >
                    <MenuItem key="asc" value="asc">
                        Oldest First
                    </MenuItem>
                    <MenuItem key="desc" value="desc">
                        Newest First
                    </MenuItem>
                </StyledTextField>
            </Box>
            <Box sx={styles.sortFilterRow}>
                <Typography variant="body1">Filter By Leader:</Typography>
                <StyledTextField
                    input
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                        setSortByLeader(e.target.value.toLowerCase())
                    }
                    sx={styles.spectateInput}
                >
                </StyledTextField>
            </Box>
            <Divider sx={styles.divider} />
            <Box>
                {gamesData?.ongoingGames.filter((match) => match.player1Leader.name?.toLowerCase().includes(sortByLeader) || match.player2Leader
                    .name?.toLowerCase().includes(sortByLeader)).map((match, index) => (
                    <PublicMatch key={index} match={match} />
                ))}
            </Box>
        </>
    );
};

export default GamesInProgress;
