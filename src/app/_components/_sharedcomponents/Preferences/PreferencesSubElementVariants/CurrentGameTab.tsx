import React, {
    useState,
    useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider, TextField, Tooltip } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import Bo3ScoreDisplay from '@/app/_components/_sharedcomponents/Preferences/_subComponents/Bo3ScoreDisplay';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import BugReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BugReportDialog';
import { GamesToWinMode, Bo3SetEndedReason, IBo3SetEndResult, MatchmakingType } from '@/app/_constants/constants';
import PlayerReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PlayerReportDialog';

enum PhaseName {
    Action = 'action',
    Regroup = 'regroup',
    Setup = 'setup',
}

function CurrentGameTab() {
    const { sendGameMessage, getOpponent, connectedPlayer, gameState, isSpectator, lobbyState, isAnonymousPlayer } = useGame();
    const isDev = process.env.NODE_ENV === 'development';
    const router = useRouter();
    const currentPlayer = gameState.players[connectedPlayer];
    const currentPlayerName = currentPlayer?.name;
    const [confirmConcede, setConfirmConcede] = useState<boolean>(false);
    const [bugReportOpen, setBugReportOpen] = useState<boolean>(false);
    const [playerReportOpen, setPlayerReportOpen] = useState<boolean>(false);
    const [showSpectateLinkTooltip, setShowSpectateLinkTooltip] = useState<boolean>(false);

    const isPrivateLobby = lobbyState?.gameType === MatchmakingType.PrivateLobby;
    const allowSpectators = lobbyState?.settings?.allowSpectators ?? false;
    const spectateLink = lobbyState?.spectateLink;
    const opponentId = getOpponent(connectedPlayer);
    const isAnonymousOpponent = isAnonymousPlayer(opponentId);
    const canReportOpponent = !isAnonymousPlayer(connectedPlayer) && (!!opponentId && !isAnonymousOpponent);
    const canReportBug = !isAnonymousPlayer(connectedPlayer);

    // Bo3 state from lobbyState
    const winHistory = lobbyState?.winHistory || null;
    const gamesToWinMode = winHistory?.gamesToWinMode || GamesToWinMode.BestOfOne;
    const winsPerPlayer: Record<string, number> = winHistory?.winsPerPlayer || {};
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const setEndResult: IBo3SetEndResult | null = winHistory?.setEndResult || null;

    // Determine if we're in Bo3 mode and if the set is complete
    const isBo3Mode = gamesToWinMode === GamesToWinMode.BestOfThree;
    const isBo3SetComplete = isBo3Mode && (
        setEndResult?.endedReason === Bo3SetEndedReason.WonTwoGames ||
        setEndResult?.endedReason === Bo3SetEndedReason.Concede
    );

    useEffect(() => {
        if(confirmConcede){
            const timer = setTimeout(() => setConfirmConcede(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [confirmConcede]);

    // Click handler for the Concede button.
    const handleConcede = () => {
        if (!confirmConcede) {
            setConfirmConcede(true);
        } else {
            // Send the game message only on the second click
            sendGameMessage(['concede', currentPlayerName]);
            // Reset the confirmation
            setConfirmConcede(false);
        }
    };

    // Click handler for the undo button
    const handleUndoPhase = (phaseName: PhaseName.Action | PhaseName.Regroup) => {
        sendGameMessage(['rollbackToSnapshot', {
            type: 'phase',
            phaseName
        }])
    }

    const handleUndoRegroup = () => {
        handleUndoPhase(PhaseName.Regroup);
    }

    const handleUndoAction = () => {
        handleUndoPhase(PhaseName.Action);
    }

    // Handler for opening the bug report dialog
    const handleOpenBugReport = () => {
        setBugReportOpen(true);

        // reset the action timer when opening the bug report dialog to give people breathing room to type
        sendGameMessage(['resetActionTimer']);
    };

    // Handler for opening the bug report dialog
    const handleOpenPlayerReport = () => {
        setPlayerReportOpen(true);

        // reset the action timer when opening the bug report dialog to give people breathing room to type
        sendGameMessage(['resetActionTimer']);
    };

    // Handler for closing the bug report dialog
    const handleCloseBugReport = () => {
        setBugReportOpen(false);
    };

    // Handler for closing the bug report dialog
    const handleClosePlayerReport = () => {
        setPlayerReportOpen(false);
    };

    // Handler for spectators to leave the game
    const handleLeaveSpectatorMode = () => {
        router.push('/');
    };

    // Handler for copying spectate link
    const handleCopySpectateLink = () => {
        if (!spectateLink) return;
        navigator.clipboard.writeText(spectateLink)
            .then(() => {
                setShowSpectateLinkTooltip(true);
                setTimeout(() => setShowSpectateLinkTooltip(false), 1000);
            })
            .catch(err => console.error('Failed to copy spectate link', err));
    };

    const styles = {
        typographyContainer: {
            mb: '0.5rem',
        },
        functionContainer:{
            mb:'3.5rem',
        },
        typeographyStyle:{
            ml: '2rem',
            color: '#878787',
            lineHeight: '15.6px',
            size: '13px',
            weight: '500',
        },
        contentContainer:{
            display:'flex',
            flexDirection:'row',
            alignItems: 'center'
        },
        spectateLinkContainer: {
            display: 'flex',
            alignItems: 'stretch',
            mt: '1rem',
        },
        spectateTextFieldStyle: {
            backgroundColor: '#fff2',
            '& .MuiOutlinedInput-root': {
                height: '100%',
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
            },
            '& .MuiInputBase-input': {
                color: '#fff',
                paddingRight: '1rem',
            },
            '& .MuiInputBase-input.Mui-disabled': {
                WebkitTextFillColor: '#aaaaaa',
            },
        },
    }

    return (
        <>
            {isSpectator ? (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Leave</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton variant={'concede'} text={'Leave game'} buttonFnc={handleLeaveSpectatorMode}/>
                        <Typography sx={styles.typeographyStyle}>
                            Stop spectating the game and return to the homepage.
                        </Typography>
                    </Box>
                </Box>
            ):(
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Concede</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton 
                            variant={'concede'}
                            text={confirmConcede ? 'Are you sure?' : 'Concede Game'}
                            buttonFnc={handleConcede}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Yield current game. This game will count as a loss.
                        </Typography>
                    </Box>
                </Box>
            )}
            {/* Spectate Link Section - only show for non-spectators */}
            {!isSpectator && (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Invite Spectators</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Typography sx={styles.typeographyStyle}>
                        Share this link with others to let them spectate the game.
                    </Typography>
                    <Box sx={styles.spectateLinkContainer}>
                        <TextField
                            sx={styles.spectateTextFieldStyle}
                            value={spectateLink ?? 'No spectation link'}
                            disabled={!allowSpectators || !spectateLink}
                            slotProps={{ htmlInput: { readOnly: true } }}
                        />
                        <Tooltip
                            open={showSpectateLinkTooltip}
                            title="Copied!"
                            arrow
                            placement="top"
                        >
                            <Box sx={{ ml: '-10px' }}>
                                <PreferenceButton 
                                    variant={'standard'}
                                    text={'Copy'}
                                    buttonFnc={handleCopySpectateLink}
                                    disabled={!allowSpectators || !spectateLink}
                                />
                            </Box>
                        </Tooltip>
                    </Box>
                </Box>
            )}
            {/* Bo3 Score Section */}
            {isBo3Mode && gameState?.players && (
                <Bo3ScoreDisplay
                    currentGameNumber={currentGameNumber}
                    winsPerPlayer={winsPerPlayer}
                    players={gameState.players}
                    connectedPlayer={connectedPlayer}
                    isBo3SetComplete={isBo3SetComplete}
                    setEndResult={setEndResult}
                    isSpectator={isSpectator}
                    getOpponent={getOpponent}
                    playerNames={winHistory?.playerNames}
                />
            )}
            {(isDev || gameState.undoEnabled) && isPrivateLobby && (
                <Box sx={styles.functionContainer}>
                    <Typography sx={styles.typographyContainer} variant={'h3'}>Advanced Undo</Typography>
                    <Divider sx={{ mb: '20px' }}/>
                    <Box sx={{ ...styles.contentContainer, mb: '20px' }}>
                        <PreferenceButton
                            variant={'standard'}
                            text={'Action Phase'}
                            buttonFnc={handleUndoAction}
                            disabled={currentPlayer['availableSnapshots']?.actionPhaseSnapshots === 0}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Revert to the start of the most recent action phase
                        </Typography>
                    </Box>
                    <Box sx={styles.contentContainer}>
                        <PreferenceButton 
                            variant={'standard'} 
                            text={'Regroup Phase'} 
                            buttonFnc={handleUndoRegroup}
                            disabled={currentPlayer['availableSnapshots']?.regroupPhaseSnapshots === 0}
                            sx={{ minWidth: '140px' }}
                        />
                        <Typography sx={styles.typeographyStyle}>
                            Revert to the start of the most recent regroup phase
                        </Typography>
                    </Box>
                </Box>
            )}
            <Box sx={{ ...styles.functionContainer, mb:'0px' }}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Thanks for playing</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Typography sx={styles.typeographyStyle}>
                    If you run into any issues, please let us know in
                    <MuiLink
                        href="https://discord.gg/hKRaqHND4v"
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ ml: '4px' }}
                    >
                        Discord
                    </MuiLink>. Thanks!
                </Typography>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={'Report Bug'}
                        buttonFnc={handleOpenBugReport}
                        sx={{ minWidth: '140px' }}
                        disabled={!canReportBug}
                    />
                    <Typography sx={styles.typeographyStyle}>
                        { canReportBug ? 'Report a bug to the developer team' : 'Please log in to submit reports' }
                    </Typography>
                </Box>
            

                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton
                        variant={'standard'}
                        text={'Report Opponent'}
                        buttonFnc={handleOpenPlayerReport}
                        sx={{ minWidth: '140px' }}
                        disabled ={!canReportOpponent}
                    />
                    <Typography sx={styles.typeographyStyle}>
                        {isAnonymousPlayer(connectedPlayer)
                            ? 'Please log in to submit reports'
                            : isAnonymousOpponent
                                ? 'Cannot submit reports for anonymous opponents'
                                : 'Report opponent to the developer team'
                        }
                    </Typography>
                </Box>

            </Box>
            {/* Bug Report Dialog */}
            <BugReportDialog
                open={bugReportOpen}
                onClose={handleCloseBugReport}
            />
            {/* Player Report Dialog */}
            <PlayerReportDialog
                open={playerReportOpen}
                onClose={handleClosePlayerReport}
            />
        </>
    );
}
export default CurrentGameTab;
