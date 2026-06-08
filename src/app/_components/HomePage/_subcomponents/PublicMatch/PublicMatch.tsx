import React from 'react';
import { Box, Button, Typography } from '@mui/material';
import { IPublicGameInProgressProps } from '../../HomePageTypes';
import { useRouter } from 'next/navigation';
import { useUser } from '@/app/_contexts/User.context';
import OverlappingCards from '../OverlappingCards/OverlappingCards';

const styles = {
    box: {
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: '2.5rem',
        pl: '10px',
        gap: '2rem',
    },
    matchItems: {
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        flex: 1,
    },
    matchType: {
        margin: 0,
        mr: '1rem',
    },
};

const PublicMatch: React.FC<IPublicGameInProgressProps> = ({ match }) => {
    const router = useRouter();
    const { user } = useUser();

    const handleSpectate = () => {
        router.push(`/spectate?lobbyId=${match.id}`);
    };

    const spectateDisabled = !user && process.env.NODE_ENV !== 'development';

    return (
        <Box sx={styles.box}>
            <Box sx={styles.matchItems}>
                <Box sx={{ position:'relative', flex: 1 }}>
                    <OverlappingCards baseCard={match.player1Base} leaderCard={match.player1Leader} />
                </Box>
                <Typography variant="body1" sx={styles.matchType}>vs</Typography>
                <Box sx={{ position:'relative', flex: 1 }}>
                    <OverlappingCards baseCard={match.player2Base} leaderCard={match.player2Leader} />
                </Box>
            </Box>
            {!match.isPrivate && (
                <span title={spectateDisabled ? 'Log in to Spectate' : ''}>
                    <Button
                        onClick={handleSpectate}
                        disabled={spectateDisabled}
                    >
                        Spectate
                    </Button>
                </span>
            )}
        </Box>
    );
};

export default PublicMatch;
