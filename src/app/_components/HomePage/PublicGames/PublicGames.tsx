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
            borderLeft: '2px solid rgba(0, 212, 255, 0.4)',
            boxShadow: 'inset 3px 0 12px -4px rgba(0, 212, 255, 0.15)',
            overflow: 'auto',
        },
        cardContent: {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
        },
        divider: {
            my: '.7em',
            background: 'linear-gradient(to right, rgba(0, 212, 255, 0.3), transparent)',
            height: '1px',
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
                <Typography variant="h2">Public Games</Typography>
                <Typography variant="h3">Available Lobbies</Typography>
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
