import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

interface IBo3ScoreDisplayProps {
    currentGameNumber: number;
    winsPerPlayer: Record<string, number>;
    players: Record<string, { user?: { username?: string } }>;
    connectedPlayer: string;
    isBo3SetComplete: boolean;
    containerStyle?: object;
}

function Bo3ScoreDisplay({
    currentGameNumber,
    winsPerPlayer,
    players,
    connectedPlayer,
    isBo3SetComplete,
    containerStyle = {},
}: IBo3ScoreDisplayProps) {
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
            <TableContainer>
                <Table size="medium" sx={{ maxWidth: '300px' }}>
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
                        {players && Object.keys(players)
                            .sort((a, b) => {
                                // Sort so that connected player comes first
                                if (a === connectedPlayer) return -1;
                                if (b === connectedPlayer) return 1;
                                return 0;
                            })
                            .map((playerId) => {
                                const playerName = players[playerId]?.user?.username || playerId;
                                const wins = winsPerPlayer[playerId] || 0;
                                const isCurrentPlayer = playerId === connectedPlayer;
                                return (
                                    <TableRow key={playerId}>
                                        <TableCell
                                            sx={{
                                                color: 'white',
                                                fontWeight: 'bold',
                                                borderBottom: '1px solid #333',
                                                fontSize: '1rem',
                                            }}
                                        >
                                            {playerName}{isCurrentPlayer && ' (You)'}
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
                <Typography sx={{ ...styles.typeographyStyle, color: '#ff9800', mt: '15px', ml: 0 }}>
                    Set complete! {Object.entries(winsPerPlayer).find(([, wins]) => wins >= 2)?.[0] === connectedPlayer ? 'You won the set!' : 'Your opponent won the set.'}
                </Typography>
            )}
        </Box>
    );
}

export default Bo3ScoreDisplay;
