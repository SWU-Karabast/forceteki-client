import React from 'react';
import { Card, CardContent, Typography, Box, Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useGame } from '@/app/_contexts/Game.context';
import { IBo3ScoreCardProps, ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import LobbyReadyButtons from '@/app/_components/Lobby/_subcomponents/LobbyReadyButtons/LobbyReadyButtons';
import { GamesToWinMode, IBo3SetEndResult } from '@/app/_constants/constants';
import { scoreTableStyles, sortPlayersConnectedFirst } from '@/app/_components/_sharedcomponents/Bo3/Bo3ScoreTable.styles';

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
    const playerNames: Record<string, string> = winHistory?.playerNames || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Determine if the set is complete - use setEndResult if available, otherwise fallback to wins check
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && (setEndResult !== null || Object.values(winsPerPlayer).some((wins) => wins >= 2));

    // Helper to get player name with fallback to playerNames from winHistory
    const getPlayerName = (playerId: string): string => {
        const user = lobbyState?.users?.find((u: ILobbyUserProps) => u.id === playerId);
        return user?.username || playerNames[playerId] || 'Opponent';
    };

    // Get sorted player IDs (connected player first)
    const sortedPlayerIds = Object.keys(winsPerPlayer).sort(sortPlayersConnectedFirst(connectedPlayer));

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
        waitingContainer: {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        waitingText: {
            marginTop: '6px',
        },
        divider: {
            mt: 1,
            mb: 1,
            borderColor: '#666',
        },
        deckContainer: {
            mb: 2,
        },
    };

    return (
        <Card sx={styles.cardStyle}>
            {!opponentUser ? (
                // If opponent is null, show waiting message
                <CardContent>
                    <Box sx={styles.waitingContainer}>
                        <Typography variant="h6" sx={styles.waitingText}>
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

                    <Divider sx={styles.divider} />

                    {/* Current deck display (read-only) */}
                    {currentDeckName && (
                        <Box sx={styles.deckContainer}>
                            <Typography sx={styles.deckInfoStyle}>
                                Your deck: <span style={{ color: 'white', fontWeight: 'bold' }}>{currentDeckName}</span>
                            </Typography>
                        </Box>
                    )}

                    {/* Bo3 Score Table */}
                    <TableContainer>
                        <Table size="medium" sx={scoreTableStyles.tableFullWidth}>
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={scoreTableStyles.headerCell}>
                                        Player
                                    </TableCell>
                                    <TableCell align="center" sx={scoreTableStyles.headerCell}>
                                        Wins
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sortedPlayerIds.map((playerId) => {
                                    const wins = winsPerPlayer[playerId] || 0;
                                    const isCurrentPlayer = playerId === connectedPlayer;
                                    const displayName = getPlayerName(playerId);
                                    return (
                                        <TableRow key={playerId}>
                                            <TableCell sx={scoreTableStyles.bodyCell}>
                                                {displayName}{isCurrentPlayer && ' (You)'}
                                            </TableCell>
                                            <TableCell align="center" sx={scoreTableStyles.bodyCellWins}>
                                                {wins}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    {isBo3SetComplete && (
                        <Typography sx={scoreTableStyles.setCompleteNotice}>
                            Set complete! {Object.entries(winsPerPlayer).find(([, wins]) => wins >= 2)?.[0] === connectedPlayer ? 'You won the set!' : 'Your opponent won the set.'}
                        </Typography>
                    )}
                </>
            )}
        </Card>
    );
};

export default Bo3ScoreCard;
