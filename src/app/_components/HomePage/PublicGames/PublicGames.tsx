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
            boxShadow: 'inset 2px 0 0 0 rgba(46, 160, 80, 1), inset 6px 0 12px -4px rgba(46, 160, 80, 0.4)',
            overflow: 'auto',
        },
        cardContent: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        divider: {
            my: '.7em',
            background: 'linear-gradient(to right, rgba(46, 160, 80, 0.9), rgba(46, 160, 80, 0.4))',
            height: '3px',
            border: 'none',
        },
        emptyState: {
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.35)',
            fontStyle: 'italic',
            py: '1.5rem',
        },
    };

    return (
        <Card variant="black" sx={styles.publicGamesWrapper}>
            <CardContent sx={styles.cardContent}>
                <Typography variant="h2" sx={{ fontSize: { xs: '2.1rem', md: '1.50rem' } }}>Public Games</Typography>
                <Typography variant="h3" sx={{ fontSize: { xs: '1.8rem', md: '1.15rem' } }}>Available Lobbies</Typography>
                <Divider sx={styles.divider} />
                {lobbies.length === 0 && (
                    <Typography variant="body1" sx={styles.emptyState}>No available lobbies at the moment.</Typography>
                )}
                {lobbies.filter((lobby) => lobby.format === SwuGameFormat.Premier).map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                {lobbies.filter((lobby) => lobby.format === SwuGameFormat.NextSetPreview).map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                {lobbies.filter((lobby) => lobby.format === SwuGameFormat.Open).map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                <GamesInProgress />
            </CardContent>
        </Card>
    );
};

export default PublicGames;
