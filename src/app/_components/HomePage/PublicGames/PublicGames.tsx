import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Divider } from '@mui/material';
import JoinableGame from '../_subcomponents/JoinableGame/JoinableGame';
import GamesInProgress from '../_subcomponents/GamesInProgress/GamesInProgress';
import { ILobby } from '../HomePageTypes';
import { SwuGameFormat } from '@/app/_constants/constants';

const fetchLobbies = async (setLobbies: (lobbies: ILobby[]) => void) => {
    try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/available-lobbies`);
        if (!response.ok) {
            throw new Error(`Error fetching lobbies: ${response.statusText}`);
        }
        const data: ILobby[] = await response.json();
        setLobbies(data);
    } catch (error) {
        console.error('Error fetching lobbies:', error);
    }
};

const PublicGames: React.FC = () => {
    const [lobbies, setLobbies] = useState<ILobby[]>([]);

    useEffect(() => {
        let count = 0;
        let intervalId: NodeJS.Timeout;

        const fetchData = () => {
            fetchLobbies(setLobbies);
            count++;

            if (count === 6) {
                clearInterval(intervalId);
                intervalId = setInterval(() => {
                    fetchLobbies(setLobbies);
                    count++;
                    if (count === 15) {
                        clearInterval(intervalId);
                    }
                }, 60000);
            }
        };

        fetchData();
        intervalId = setInterval(fetchData, 10000);

        return () => clearInterval(intervalId);
    }, []);

    const styles = {
        publicGamesWrapper: {
            height: '100%',
        },
        cardContent: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        divider: {
            backgroundColor: '#fff',
            my: '.7em',
        },
    };

    return (
        <Card variant="black" sx={styles.publicGamesWrapper}>
            <CardContent sx={styles.cardContent}>
                <Typography variant="h2">Public Games</Typography>
                <Typography variant="h3">Open Lobbies</Typography>
                <Divider sx={styles.divider} />
                {lobbies.map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                <GamesInProgress />
            </CardContent>
        </Card>
    );
};

export default PublicGames;
