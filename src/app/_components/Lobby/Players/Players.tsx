// Players.tsx
import React from 'react';
import { Card, Box, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ILobbyUserProps, IPlayersProps } from '../LobbyTypes';
import LeaderBaseCard from '@/app/_components/_sharedcomponents/Cards/LeaderBaseCard';
import { useGame } from '@/app/_contexts/Game.context';

const Players: React.FC<IPlayersProps> = ({ isLobbyView }) => {
    // ------------------------STYLES------------------------//
    const { connectedPlayer, lobbyState } = useGame();
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    const opponentUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer) : null;

    // set connectedPlayer
    const playerLeader = connectedUser ? connectedUser.deck ? connectedUser.deck.leader[0].card : null : null;
    const playerBase = connectedUser ? connectedUser.deck ? connectedUser.deck.base[0].card : null : null;

    // set opponent
    const titleOpponent = opponentUser ? opponentUser.username : null;
    const opponentLeader = opponentUser ? opponentUser.deck ? opponentUser.deck.leader[0].card : null : null;
    const opponentBase = opponentUser ? opponentUser.deck ? opponentUser.deck.base[0].card : null : null;
    const cardStyle = {
        borderRadius: '1.1em',
        borderColor: '#FFFFFF00',
        height:'90vh',  // For small screens and up (600px and above)
        width: '80%',
        minWidth: '212px',
        display: 'flex',
        flexDirection: isLobbyView ? 'column' : 'row',
        justifyContent: isLobbyView ? 'flex-start' : 'center',
        pt: '.8em',
        backgroundColor: '#00000080',
        backdropFilter: 'blur(30px)',
        '@media (max-height: 759px)': {
            height: '84vh',
        },
        '@media (max-height: 1000px)': {
            maxHeight: '85.5vh',
        },
    };

    const typographyStyle = {
        fontSize: '2.0em',
        fontWeight: 'bold',
        color: 'white',
        ml: '30px',
        mb: '0px'
    };

    const lobbyLeaderBaseContainer = {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        gap: '10px'
    }
    const containerStyle = {
        height: '100%',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center'
    };
    const rowStyle = {
        flexGrow: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        display: 'flex'
    };
    const titleTypographyStyle = {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '600',
        fontSize: '1.5em',
        textAlign: 'left',
        color: 'white',
    };
    const titleTypographyStyleOpponent = {
        fontFamily: 'var(--font-barlow), sans-serif',
        fontWeight: '600',
        fontSize: '1.5em',
        textAlign: 'left' as const,
        color: 'white',
        opacity: '15%',
    }
    return (
        <Card sx={cardStyle}>
            <Box sx={{ width: '100%' }}>
                <Typography sx={typographyStyle}>Players</Typography>
                <Grid container direction="column" sx={containerStyle}>
                    <Grid sx={rowStyle}>
                        <Box sx={lobbyLeaderBaseContainer}>
                            <Typography
                                variant="subtitle1"
                                sx={titleTypographyStyle}
                            >
                                {connectedUser ? connectedUser.username : connectedPlayer}
                            </Typography>
                            <LeaderBaseCard
                                title={connectedUser ? connectedUser.username : connectedPlayer}
                                card={playerLeader}
                                disabled={true}
                            />
                            <LeaderBaseCard card={playerBase} disabled={true}></LeaderBaseCard>
                        </Box>
                    </Grid>
                    <Grid sx={rowStyle}>
                        <Box sx={lobbyLeaderBaseContainer}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    ...(opponentUser ? titleTypographyStyle : titleTypographyStyleOpponent),
                                    ...(opponentUser?.ready && { color: 'green' }),
                                }}
                            >
                                {opponentUser ? opponentUser.username : 'Opponent'}
                            </Typography>
                            <LeaderBaseCard
                                title={titleOpponent}
                                card={opponentLeader}
                                disabled={true}
                            />
                            <LeaderBaseCard card={opponentBase} disabled={true}></LeaderBaseCard>
                        </Box>
                    </Grid>
                </Grid>
            </Box>
        </Card>
    );
};

export default Players;
