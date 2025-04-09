import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { IJoinableGameProps } from '../../HomePageTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { CardStyle, ISetCode } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { ILobbyCardData } from '../../HomePageTypes';

const JoinableGame: React.FC<IJoinableGameProps> = ({ lobby }) => {
    const router = useRouter();
    const { user } = useUser();
    const joinLobby = async (lobbyId: string) => {
        // we need to set the user
        try {
            const payload = {
                lobbyId: lobbyId,
                user: { id: user?.id || localStorage.getItem('anonymousUserId'),
                    username:user?.username || 'anonymous '+ localStorage.getItem('anonymousUserId')?.substring(0,6) },
            };
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/join-lobby`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error joining lobby:', errorData.message);
                alert(errorData.message);
                return;
            }
            router.push('/lobby');
        } catch (error) {
            console.error('Error joining lobby:', error);
        }
    };

    // ------------------------STYLES------------------------//

    const styles = {
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignContent: 'center',
            alignItems: 'center',
            mb: '1.25rem',
            padding: '0.5rem 0',
        },
        matchType: {
            margin: 0,
        },
        cardsContainer: {
            display: 'flex',
            gap: '0.5rem',
            alignItems: 'center',
        },
        cardPreview: {
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)', // Match the Games in Progress size
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        lobbyInfo: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
    };

    // Helper function to create a card object compatible with s3CardImageURL
    const createCardObject = (cardData: ILobbyCardData): ISetCode => {
        const setCode = cardData.id.split('_')[0];
        const cardNumber = parseInt(cardData.id.split('_')[1], 10);
        
        return {
            id: cardData.id,
            setId: {
                set: setCode,
                number: cardNumber
            },
            type: 'unit', // Default type, adjust if needed
            types: ['unit'] // Default types, adjust if needed
        };
    };

    return (
        <>
            <Box sx={styles.box} key={lobby.id}>
                <Box sx={styles.lobbyInfo}>
                    <Typography variant="body1" sx={styles.matchType}>{lobby.name}</Typography>
                    {lobby.host && (
                        <Box sx={styles.cardsContainer}>
                            <Box 
                                sx={{
                                    ...styles.cardPreview,
                                    backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.leader), CardStyle.PlainLeader)})`
                                }}
                                title={`Leader: ${lobby.host.leader.id}`}
                            >
                            </Box>
                            <Box 
                                sx={{
                                    ...styles.cardPreview,
                                    backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.base), CardStyle.Plain)})`
                                }}
                                title={`Base: ${lobby.host.base.id}`}
                            >
                            </Box>
                        </Box>
                    )}
                </Box>
                <Button onClick={() => joinLobby(lobby.id)}>Join Game</Button>
            </Box>
        </>
    );
};

export default JoinableGame;
