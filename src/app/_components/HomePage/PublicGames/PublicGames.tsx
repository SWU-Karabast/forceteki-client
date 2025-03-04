import React, { useEffect, useState } from 'react';
import { Card, CardContent, Typography, Divider } from '@mui/material';
import JoinableGame from '../_subcomponents/JoinableGame/JoinableGame';
import GamesInProgress from '../_subcomponents/GamesInProgress/GamesInProgress';
import { ILobby } from '../HomePageTypes';
import { SwuGameFormat } from '@/app/_constants/constants';

const PublicGames: React.FC = () => {
    const [lobbies, setLobbies] = useState<ILobby[]>([]);
    useEffect(() => {
        // Fetch unfilled lobbies from the server
        const fetchLobbies = async () => {
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
        fetchLobbies();
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
                <Typography variant="h3">Premier</Typography>
                <Divider sx={styles.divider} />
                { lobbies.filter((lobby) => lobby.format === SwuGameFormat.Premier).map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                <Typography variant="h3">Next Set Preview</Typography>
                <Divider sx={styles.divider} />
                { lobbies.filter((lobby) => lobby.format === SwuGameFormat.NextSetPreview).map((lobby) => (
                    <JoinableGame key={lobby.id} lobby={lobby} />
                ))}
                <GamesInProgress />
            </CardContent>
        </Card>
    );
};

export default PublicGames;
