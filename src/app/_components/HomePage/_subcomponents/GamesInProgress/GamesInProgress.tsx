import React, { useEffect, useState } from 'react';
import { Box, Divider, Typography } from '@mui/material';
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

const fetchOngoingGames = async (setGamesData: (games: OngoingGamesData | null) => void,
    sortByRecent: 'asc' | 'desc') => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/ongoing-games`);

        if (!response.ok) {
            throw new Error(`Failed to fetch ongoing games: ${response.status} ${response.statusText}`);
        }

        const fetchedData: OngoingGamesData = await response.json();
        fetchedData.ongoingGames.sort((a, b) => Number(a.isPrivate) - Number(b.isPrivate));
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
    };

    return (
        <>
            <Box sx={styles.headerBox}>
                <Typography variant="h3">Games in Progress</Typography>
                <Typography variant="h3" sx={styles.activeGamesNumber}>{gamesData?.numberOfOngoingGames || 0}</Typography>
            </Box>
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '5px'
            }}>
                <Typography variant="body2">Sort By:</Typography>
                <select
                    value={sortByRecent}
                    onChange={e => setSortByRecent(e.target.value as 'asc' | 'desc')}
                >
                    <option value="asc">Oldest First</option>
                    <option value="desc">Newest First</option>
                </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2">Filter by Leader:</Typography>
                <input
                    value={sortByLeader}
                    onChange={e => setSortByLeader(e.target.value)}
                    style={{ maxWidth: '40%' }}
                ></input>
            </div>
            <Divider sx={styles.divider} />
            <Box>
                {gamesData?.ongoingGames.filter((match) => match.player1Leader.name?.includes(sortByLeader) || match.player2Leader
                    .name?.includes(sortByLeader)).map((match, index) => (
                    <PublicMatch key={index} match={match} />
                ))}
            </Box>
        </>
    );
};

export default GamesInProgress;
