import React from 'react';
import { Card, CardContent, Typography, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { IBo3ScoreCardProps, ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import LobbyReadyButtons from '@/app/_components/Lobby/_subcomponents/LobbyReadyButtons/LobbyReadyButtons';
import { GamesToWinMode } from '@/app/_constants/constants';

const Bo3ScoreCard: React.FC<IBo3ScoreCardProps> = ({
    readyStatus,
    owner,
}) => {
    const { lobbyState, connectedPlayer } = useGame();

    const connectedUser = lobbyState?.users.find((u: ILobbyUserProps) => u.id === connectedPlayer);
    const opponentUser = lobbyState?.users.find((u: ILobbyUserProps) => u.id !== connectedPlayer);

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;

    // Determine if the set is complete
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && Object.values(winsPerPlayer).some((wins) => wins >= 2);

    // Get current deck name for display
    const currentDeckName = connectedUser?.deck?.name || null;

    // ------------------------STYLES------------------------//
    const styles = {
        cardStyle: {
            background: '#18325199',
            display: 'flex',
            padding: '20px',
            flexDirection: 'column',
            maxHeight: '45vh',
            backgroundColor: '#000000E6',
            backdropFilter: 'blur(20px)',
        },
        gameHeaderStyle: {
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            mb: 1,
        },
        headerStyle: {
            fontSize: '1.2rem',
            fontWeight: '600',
            color: 'white',
            mb: 1,
        },
        deckInfoStyle: {
            color: '#aaaaaa',
            fontSize: '0.9rem',
            mb: 1,
        },
        deckNameStyle: {
            color: 'white',
            fontWeight: 'bold',
        },
    };

    return (
        <Card sx={styles.cardStyle}>
            {!opponentUser ? (
                // If opponent is null, show waiting message
                <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Typography variant="h6" sx={{ marginTop: '6px' }}>
                            Waiting for opponent to rejoin...
                        </Typography>
                    </Box>
                </CardContent>
            ) : (
                <>
                    {/* Game X Header */}
                    <Typography variant="h5" sx={styles.gameHeaderStyle}>
                        Game {currentGameNumber} Setup
                    </Typography>

                    {/* Ready buttons */}
                    <LobbyReadyButtons
                        readyStatus={readyStatus}
                        isOwner={owner}
                        hasDeck={!!(connectedUser && connectedUser.deck)}
                    />

                    <Divider sx={{ mt: 1, mb: 1, borderColor: '#666' }} />

                    {/* Current deck display (read-only) */}
                    {currentDeckName && (
                        <Box sx={{ mb: 2 }}>
                            <Typography sx={styles.deckInfoStyle}>
                                Your deck: <span style={{ color: 'white', fontWeight: 'bold' }}>{currentDeckName}</span>
                            </Typography>
                        </Box>
                    )}

                    {/* Bo3 Score Table */}
                    <TableContainer>
                        <Table size="medium" sx={{ width: '100%' }}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', borderBottom: '1px solid #444', fontWeight: 'normal', fontSize: '1rem' }}>
                                        Player
                                    </TableCell>
                                    <TableCell align="center" sx={{ color: 'white', borderBottom: '1px solid #444', fontWeight: 'normal', fontSize: '1rem' }}>
                                        Wins
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {lobbyState?.users && lobbyState.users
                                    .slice()
                                    .sort((a: ILobbyUserProps, b: ILobbyUserProps) => {
                                        // Sort so that connected player comes first
                                        if (a.id === connectedPlayer) return -1;
                                        if (b.id === connectedPlayer) return 1;
                                        return 0;
                                    })
                                    .map((user: ILobbyUserProps) => {
                                        const wins = winsPerPlayer[user.id] || 0;
                                        const isCurrentPlayer = user.id === connectedPlayer;
                                        return (
                                            <TableRow key={user.id}>
                                                <TableCell
                                                    sx={{
                                                        color: 'white',
                                                        fontWeight: 'bold',
                                                        borderBottom: '1px solid #333',
                                                        fontSize: '1rem',
                                                    }}
                                                >
                                                    {user.username}{isCurrentPlayer && ' (You)'}
                                                </TableCell>
                                                <TableCell
                                                    align="center"
                                                    sx={{
                                                        color: 'white',
                                                        borderBottom: '1px solid #333',
                                                        fontSize: '1rem',
                                                    }}
                                                >
                                                    {wins}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {isBo3SetComplete && (
                        <Typography sx={{ color: '#ff9800', mt: '15px' }}>
                            Set complete! {Object.entries(winsPerPlayer).find(([, wins]) => wins >= 2)?.[0] === connectedPlayer ? 'You won the set!' : 'Your opponent won the set.'}
                        </Typography>
                    )}
                </>
            )}
        </Card>
    );
};

export default Bo3ScoreCard;
