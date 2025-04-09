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
            mb: '1rem',
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
            borderRadius: '0.25rem',
            backgroundSize: 'cover',
            backgroundRepeat: 'no-repeat',
            aspectRatio: '1 / 1.4',
            width: '2.5rem',
            border: '1px solid rgba(255, 255, 255, 0.2)',
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
                    {lobby.host && (
                        <Box sx={styles.cardsContainer}>
                            <Box 
                                sx={{
                                    ...styles.cardPreview,
                                    backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.leader), CardStyle.Plain)})`
                                }}
                                title={`Leader: ${lobby.host.leader.id}`}
                            />
                            <Box 
                                sx={{
                                    ...styles.cardPreview,
                                    backgroundImage: `url(${s3CardImageURL(createCardObject(lobby.host.base), CardStyle.Plain)})`
                                }}
                                title={`Base: ${lobby.host.base.id}`}
                            />
                        </Box>
                    )}
                    <Typography variant="body1" sx={styles.matchType}>{lobby.name}</Typography>
                </Box>
                <Button onClick={() => joinLobby(lobby.id)}>Join Game</Button>
            </Box>
        </>
    );
};

export default JoinableGame;
