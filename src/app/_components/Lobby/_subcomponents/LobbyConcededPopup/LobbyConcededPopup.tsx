import React from 'react';
import {
    Box,
    Card,
    Typography,
    Divider,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
} from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';
import { MatchmakingType, RematchMode, Bo3SetEndedReason, IBo3SetEndResult } from '@/app/_constants/constants';

interface ILobbyConcededPopupProps {
    gameType: MatchmakingType;
}

const LobbyConcededPopup: React.FC<ILobbyConcededPopupProps> = ({ gameType }) => {
    const router = useRouter();
    const { lobbyState, connectedPlayer, sendLobbyMessage, sendMessage, resetStates, isSpectator } = useGame();

    const isQuickMatch = gameType === MatchmakingType.Quick;

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Rematch request state
    const rematchRequest = lobbyState?.rematchRequest || null;
    const isRequestInitiator = rematchRequest && rematchRequest.initiator === connectedPlayer;

    // Get display name for the player who conceded
    const getConcedePlayerName = (): string => {
        if (!setEndResult || setEndResult.endedReason !== Bo3SetEndedReason.Concede || !lobbyState?.users) return 'A player';
        
        const concedingPlayerId = setEndResult.concedingPlayerId;
        
        if (isSpectator) {
            // For spectators, show "Player 1" or "Player 2"
            const playerIndex = lobbyState.users.findIndex((u: ILobbyUserProps) => u.id === concedingPlayerId);
            return `Player ${playerIndex + 1}`;
        }
        
        // For participants
        if (concedingPlayerId === connectedPlayer) {
            return 'You';
        }
        const concedingUser = lobbyState.users.find((u: ILobbyUserProps) => u.id === concedingPlayerId);
        return concedingUser?.username || 'Your opponent';
    };

    // ------------------------ Button Handlers ------------------------//

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    };

    const handleRequeue = async () => {
        sendMessage('requeue');
        resetStates();
        router.push('/quickGame');
    };

    // For New Bo3 Set:
    const handleNewBo3RequestOrConfirm = () => {
        if (!rematchRequest) {
            sendLobbyMessage(['requestRematch', RematchMode.NewBo3]);
        } else if (rematchRequest.mode === RematchMode.NewBo3 && !isRequestInitiator) {
            sendLobbyMessage(['rematch']);
        }
    };

    // --- Determine Button State & Text ---

    // For Rematch Bo3:
    let newBo3ButtonText = 'Rematch Bo3';
    let newBo3ButtonDisabled = false;
    if (rematchRequest) {
        if (rematchRequest.mode !== RematchMode.NewBo3) {
            newBo3ButtonDisabled = true;
            newBo3ButtonText = 'Disabled';
        } else {
            if (isRequestInitiator) {
                newBo3ButtonText = 'Waiting for confirmation...';
                newBo3ButtonDisabled = true;
            } else {
                newBo3ButtonText = 'Confirm New Bo3';
            }
        }
    }

    // Check if maintenance mode is enabled
    const isMaintenanceMode = process.env.NEXT_PUBLIC_DISABLE_CREATE_GAMES === 'true';

    // ------------------------STYLES------------------------//
    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
        },
        card: {
            backgroundColor: '#1a1a2e',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '2rem',
            minWidth: '400px',
            maxWidth: '500px',
        },
        title: {
            fontSize: '1.75rem',
            fontWeight: '700',
            color: 'white',
            textAlign: 'center',
            mb: 2,
        },
        concedeNotice: {
            color: '#ff9800',
            fontWeight: 'bold',
            textAlign: 'center',
            fontSize: '1rem',
            mb: 2,
        },
        sectionTitle: {
            color: 'white',
            fontWeight: '600',
            fontSize: '1.1rem',
            mb: 1,
        },
        buttonContainer: {
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            mt: 2,
        },
        buttonRow: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
        },
        buttonDescription: {
            color: '#878787',
            fontSize: '0.85rem',
        },
    };

    return (
        <Box sx={styles.overlay}>
            <Card sx={styles.card}>
                {/* Title */}
                <Typography sx={styles.title}>
                    Best-of-Three Ended
                </Typography>

                {/* Concede Notice */}
                <Typography sx={styles.concedeNotice}>
                    {getConcedePlayerName()} conceded
                </Typography>

                <Divider sx={{ borderColor: '#444', mb: 2 }} />

                {/* Score Table */}
                <Typography sx={styles.sectionTitle}>Final Score</Typography>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ color: 'white', borderBottom: '1px solid #444' }}>
                                    Player
                                </TableCell>
                                <TableCell align="center" sx={{ color: 'white', borderBottom: '1px solid #444' }}>
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
                                    const displayName = isSpectator 
                                        ? `Player ${lobbyState.users.findIndex((u: ILobbyUserProps) => u.id === user.id) + 1}`
                                        : user.username;
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell
                                                sx={{
                                                    color: 'white',
                                                    fontWeight: 'bold',
                                                    borderBottom: '1px solid #333',
                                                }}
                                            >
                                                {displayName}{!isSpectator && isCurrentPlayer && ' (You)'}
                                            </TableCell>
                                            <TableCell
                                                align="center"
                                                sx={{
                                                    color: 'white',
                                                    borderBottom: '1px solid #333',
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

                <Divider sx={{ borderColor: '#444', mt: 2, mb: 2 }} />

                {/* Action Buttons */}
                <Typography sx={styles.sectionTitle}>Actions</Typography>
                <Box sx={styles.buttonContainer}>
                    {/* Return Home - always shown */}
                    <Box sx={styles.buttonRow}>
                        <PreferenceButton
                            variant={'concede'}
                            text={'Return Home'}
                            buttonFnc={handleReturnHome}
                        />
                        <Typography sx={styles.buttonDescription}>
                            Return to main page.
                        </Typography>
                    </Box>

                    {/* New Bo3 Set - for non-spectators */}
                    {!isSpectator && !isMaintenanceMode && (
                        <Box sx={styles.buttonRow}>
                            <PreferenceButton
                                variant={'standard'}
                                text={newBo3ButtonText}
                                buttonFnc={handleNewBo3RequestOrConfirm}
                                disabled={newBo3ButtonDisabled}
                            />
                            <Typography sx={styles.buttonDescription}>
                                {rematchRequest && rematchRequest.mode === RematchMode.NewBo3
                                    ? isRequestInitiator
                                        ? 'Waiting for opponent to confirm.'
                                        : 'Confirm Bo3 rematch.'
                                    : 'Rematch with a new best of 3 set.'}
                            </Typography>
                        </Box>
                    )}

                    {/* Requeue - for non-spectators in QuickMatch */}
                    {!isSpectator && isQuickMatch && !isMaintenanceMode && (
                        <Box sx={styles.buttonRow}>
                            <PreferenceButton
                                variant={'standard'}
                                text={'Requeue'}
                                buttonFnc={handleRequeue}
                            />
                            <Typography sx={styles.buttonDescription}>
                                Reenter the queue for a new opponent.
                            </Typography>
                        </Box>
                    )}
                </Box>
            </Card>
        </Box>
    );
};

export default LobbyConcededPopup;
