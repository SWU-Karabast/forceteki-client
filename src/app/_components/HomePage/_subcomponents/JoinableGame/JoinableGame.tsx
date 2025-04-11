import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import { IJoinableGameProps } from '../../HomePageTypes';
import { CardStyle, ISetCode } from '@/app/_components/_sharedcomponents/Cards/CardTypes';
import { ILobbyCardData } from '../../HomePageTypes';
import CardHoverPreview from '@/app/_components/_sharedcomponents/Cards/CardHoverPreview';
import { s3CardImageURL } from '@/app/_utils/s3Utils';

const JoinableGame: React.FC<IJoinableGameProps> = ({ lobby }) => {
    const router = useRouter();
    const { user } = useUser();
    const joinLobby = async (lobbyId: string) => {
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
            fontWeight: 'bold',
        },
        cardsContainer: {
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '10px',
        },
        parentBoxStyling: {
            position: 'absolute',
            left: '-15px',
            top: '24px',
        },
        cardPreview: {
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)',
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

    const createCardObject = (cardData: ILobbyCardData): ISetCode => {
        if (!cardData || !cardData.id) {
            return {
                id: 'unknown',
                setId: {
                    set: 'unknown',
                    number: 0
                },
                type: 'unit',
                types: ['unit']
            };
        }
        
        const parts = cardData.id.split('_');
        const setCode = parts.length > 0 ? parts[0] : 'unknown';
        const cardNumber = parts.length > 1 ? parseInt(parts[1], 10) : 0;
        
        return {
            id: cardData.id,
            setId: {
                set: setCode,
                number: cardNumber
            },
            type: 'unit',
            types: ['unit']
        };
    };

    return (
        <>
            <Box sx={styles.box} key={lobby.id}>
                <Box sx={styles.lobbyInfo}>
                    {lobby.host && (
                        <Box sx={styles.cardsContainer}>
                            <Box sx={{ position: 'relative' }}>
                                <Box>
                                    <CardHoverPreview 
                                        card={createCardObject(lobby.host.base)}
                                        cardStyle={CardStyle.Plain}
                                        title={`Base: ${lobby.host.base.id}`}
                                        sx={styles.cardPreview}
                                    />
                                </Box>
                                <Box sx={styles.parentBoxStyling}>
                                    <CardHoverPreview 
                                        card={createCardObject(lobby.host.leader)}
                                        cardStyle={CardStyle.PlainLeader}
                                        title={`Leader: ${lobby.host.leader.id}`}
                                        sx={styles.cardPreview}
                                    />
                                </Box>
                            </Box>
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
