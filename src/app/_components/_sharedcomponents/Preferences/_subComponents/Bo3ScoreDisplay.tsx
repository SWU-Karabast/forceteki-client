import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bo3SetEndedReason, IBo3SetEndResult } from '@/app/_constants/constants';
import { scoreTableStyles, sortPlayersConnectedFirst } from '@/app/_components/_sharedcomponents/Bo3/Bo3ScoreTable.styles';

interface IBo3ScoreDisplayProps {
    currentGameNumber: number;
    winsPerPlayer: Record<string, number>;
    players: Record<string, { user?: { username?: string } }>;
    connectedPlayer: string;
    isBo3SetComplete: boolean;
    containerStyle?: object;
    setEndResult?: IBo3SetEndResult | null;
    isSpectator?: boolean;
    getOpponent?: (playerId: string) => string;
    playerNames?: Record<string, string>;
}

const Bo3ScoreDisplay: React.FC<IBo3ScoreDisplayProps> = ({
    currentGameNumber,
    winsPerPlayer,
    players,
    connectedPlayer,
    isBo3SetComplete,
    containerStyle = {},
    setEndResult = null,
    isSpectator = false,
    getOpponent,
    playerNames = {},
}) => {
    // Get display name for a player (spectator-aware)
    // Falls back to playerNames from winHistory if player is no longer in players list
    const getDisplayName = (playerId: string): string => {
        const playerName = players[playerId]?.user?.username || playerNames[playerId] || 'Opponent';
        if (isSpectator && getOpponent) {
            const opponentId = getOpponent(connectedPlayer);
            if (playerId === connectedPlayer) return 'Player 1';
            if (playerId === opponentId) return 'Player 2';
        }
        return playerName;
    };

    // Check if the set ended due to concede
    const isConcede = setEndResult?.endedReason === Bo3SetEndedReason.Concede;
    const concedingPlayerId = isConcede ? setEndResult.concedingPlayerId : null;

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer: {
            mb: '3.5rem',
            ...containerStyle,
        },
        typeographyStyle: {
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
    };

    return (
        <Box sx={styles.functionContainer}>
            <Typography sx={styles.typographyContainer} variant={'h3'}>
                Best-of-Three Score (Game {currentGameNumber})
            </Typography>
            <Divider sx={{ mb: '20px' }} />
            {/* Show concede notice above the table */}
            {concedingPlayerId && (
                <Typography sx={scoreTableStyles.concedeNotice}>
                    {concedingPlayerId === connectedPlayer ? 'You conceded the Bo3 set' : `${getDisplayName(concedingPlayerId)} conceded the Bo3 set`}
                </Typography>
            )}
            <TableContainer>
                <Table size="medium" sx={scoreTableStyles.table}>
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
                        {Object.keys(winsPerPlayer)
                            .sort(sortPlayersConnectedFirst(connectedPlayer))
                            .map((playerId) => {
                                const displayName = getDisplayName(playerId);
                                const wins = winsPerPlayer[playerId] || 0;
                                const isCurrentPlayer = playerId === connectedPlayer;
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
                <Typography sx={{ ...styles.typeographyStyle, ...scoreTableStyles.setCompleteNotice, ml: 0 }}>
                    Set complete! {concedingPlayerId
                        ? (concedingPlayerId === connectedPlayer ? 'You conceded the set.' : 'Your opponent conceded the set.')
                        : (Object.entries(winsPerPlayer).find(([, wins]) => wins >= 2)?.[0] === connectedPlayer ? 'You won the set!' : 'Your opponent won the set.')}
                </Typography>
            )}
        </Box>
    );
};

export default Bo3ScoreDisplay;
