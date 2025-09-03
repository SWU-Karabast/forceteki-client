import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Divider, TextField, Typography } from '@mui/material';
import PublicMatch from '../PublicMatch/PublicMatch';
import { ICardData } from '@/app/_components/_sharedcomponents/Cards/CardTypes';

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
        setLeaderData(fetchedData.sort());
    } catch (err) {
        console.error('Error fetching ongoing games:', err);
        setLeaderData(null); // Handle error case
    }
}

const GamesInProgress: React.FC = () => {
    const [gamesData, setGamesData] = useState<OngoingGamesData | null>(null);
    const [sortByLeader, setSortByLeader] = useState<string | null>(null);
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
        if (!sortByLeader) return true; // No filter applied, show all matches

        const leader1 = leaderData.find(leader => leader.id === match.player1Leader.id);
        const leader2 = leaderData.find(leader => leader.id === match.player2Leader.id);
        if (!leader1 || !leader2) return false; // leader not found in data, exclude match

        return leader1.id === sortByLeader || leader2.id === sortByLeader;
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
    };

    return (
        <>
            <Box sx={styles.headerBox}>
                <Typography variant="h3">Games in Progress</Typography>
                <Typography variant="h3" sx={styles.activeGamesNumber}>{gamesData?.numberOfOngoingGames || 0}</Typography>
            </Box>
            <Box sx={styles.sortFilterRow}>
                <Autocomplete
                    fullWidth
                    options={leaderData || []}
                    getOptionLabel={(option) =>
                        option.subtitle ? `${option.name} - ${option.subtitle}` : option.name
                    }
                    value={leaderData?.find(l => l.id === sortByLeader) || null}
                    onChange={(_, newValue) => setSortByLeader(newValue ? newValue.id : null)}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    renderInput={(params) => (
                        <TextField {...params} label="Filter by Leader" variant="outlined" />
                    )}
                />
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
