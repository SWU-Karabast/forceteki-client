import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import GameInProgressPlayer from '../GameInProgressPlayer/GameInProgressPlayer';
import { IPublicGameInProgressProps } from '../../HomePageTypes';
import { s3CardImageURL } from '@/app/_utils/s3Utils';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';

const PublicMatch: React.FC<IPublicGameInProgressProps> = ({ match }) => {
    const router = useRouter();
    const { user, anonymousUserId } = useUser();

    const handleSpectate = async () => {
        try {
            // Register as a spectator with the server
            const response = await fetch(`${process.env.NEXT_PUBLIC_ROOT_URL}/api/spectate-game`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    gameId: match.id,
                    user: user || { id: anonymousUserId, username: 'Anonymous' + anonymousUserId?.substring(0, 6) },
                }),
            });

            const data = await response.json();
            if (data.success) {
                // Navigate to the game as a spectator
                router.push('/GameBoard?spectator=true');
            } else {
                console.error('Failed to join as spectator:', data.message);
            }
        } catch (error) {
            console.error('Error joining as spectator:', error);
        }
    };

    const styles = {
        box: {
            width: '100%',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: '2.5rem',
            pl: '10px',
        },
        matchItems: {
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
        },
        matchType: {
            margin: 0,
            mr: '1rem',
        },
        leaderStyleCard:{
            borderRadius: '0.5rem',
            backgroundSize: 'cover',
            width: 'clamp(3rem, 7vw, 10rem)', // Min 5rem, max 10rem, scales with viewport
            aspectRatio: '1.39',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
            border: '2px solid transparent',
            boxSizing: 'border-box',
            cursor: 'pointer'
        },
        parentBoxStyling: {
            position:'absolute',
        },
    };

    return (
        <Box sx={styles.box}>
            <Box sx={styles.matchItems}>
                <Box sx={{ position:'relative' }}>
                    <Box>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Base)})` }}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player1Leader)})` }}/>
                    </Box>
                </Box>
                <Typography variant="body1" sx={styles.matchType}>vs</Typography>
                <Box sx={{ position:'relative' }}>
                    <Box>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Base)})` }}/>
                    </Box>
                    <Box sx={{ ...styles.parentBoxStyling,left:'-15px',top:'24px' }}>
                        <Box sx={{ ...styles.leaderStyleCard,backgroundImage:`url(${s3CardImageURL(match.player2Leader)})` }}/>
                    </Box>
                </Box>
            </Box>
            {!match.isPrivate && (
                <Button onClick={handleSpectate}>Spectate</Button>
            )}
        </Box>
    );
};

export default PublicMatch;
