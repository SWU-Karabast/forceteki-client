import React, { ChangeEvent, useEffect, useState } from 'react';
import { Box, Divider, Typography } from '@mui/material';
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

interface LeaderNameData {
    name: string;
    subtitle?: string;
    id: string;
}

const includesLeaderName = (leaderData: LeaderNameData, searchTerm: string): boolean => {
    const nameIncludes = leaderData.subtitle
        ? `${leaderData.name} ${leaderData.subtitle}`
        : leaderData.name;
    return nameIncludes.toLowerCase().includes(searchTerm);
};

const fetchOngoingGames = async (setGamesData: (games: OngoingGamesData | null) => void) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/ongoing-games`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ongoing games: ${response.status} ${response.statusText}`);
        }

        const fetchedData: OngoingGamesData = await response.json();
        setGamesData(fetchedData);
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setGamesData(null); // Handle error case
    }
};

const fetchLeaderData = async (setLeaderData: (leaders: LeaderNameData[] | null) => void) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/all-leaders`);

        if (!response.ok) {
            throw new Error(`Failed to fetch leader data: ${response.status} ${response.statusText}`);
        }

        const fetchedData: LeaderNameData[] = await response.json();
        setLeaderData(fetchedData);
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setLeaderData(null); // Handle error case
    }
}


const GamesInProgress: React.FC = () => {
    const [gamesData, setGamesData] = useState<OngoingGamesData | null>(null);
    const [sortByLeader, setSortByLeader] = useState<string>('');
    const [leaderData, setLeaderData] = useState<LeaderNameData[] | null>(null);

    useEffect(() => {
        let count = 0;
        let intervalId: NodeJS.Timeout;

        const fetchData = () => {
            fetchOngoingGames(setGamesData);
            count++;

            if (count === 6) {
                clearInterval(intervalId);
                intervalId = setInterval(() => {
                    fetchOngoingGames(setGamesData);
                    count++;
                    if (count === 15) {
                        clearInterval(intervalId);
                    }
                }, 60000); // Fetch once per minute
            }
        };

        fetchLeaderData(setLeaderData);
        fetchData();
        intervalId = setInterval(fetchData, 10000); // Fetch every 10 seconds

        return () => clearInterval(intervalId);
    }, []);

    const filterByLeader = (match: GameCardData): boolean => {
        if (!leaderData) return true; // If leader data isn't loaded yet, show all matches

        if (sortByLeader === '') return true; // No filter applied, show all matches

        const leader1 = leaderData.find(leader => leader.id === match.player1Leader.id);
        const leader2 = leaderData.find(leader => leader.id === match.player2Leader.id);

        if (!leader1 || !leader2) return false; // leader not found in data, exclude match

        return includesLeaderName(leader1, sortByLeader) || includesLeaderName(leader2, sortByLeader);
    };

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
            marginTop: '1vh'
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
                {gamesData?.ongoingGames
                    .filter((match) => filterByLeader(match))
                    .map((match, index) => (
                        <PublicMatch key={index} match={match} />
                    ))}
            </Box>
        </>
    );
};

export default GamesInProgress;
