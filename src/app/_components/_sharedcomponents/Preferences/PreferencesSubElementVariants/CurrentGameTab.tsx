import React, {
    useState,
    useEffect,
} from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import MuiLink from '@mui/material/Link';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation';
import BugReportDialog from '@/app/_components/_sharedcomponents/Preferences/_subComponents/BugReportDialog';

enum PhaseName {
    Action = 'action',
    Regroup = 'regroup',
    Setup = 'setup',
}

function CurrentGameTab() {
    const { sendGameMessage, connectedPlayer, gameState, isSpectator } = useGame();
    const isDev = process.env.NODE_ENV === 'development';
    const router = useRouter();
    const currentPlayer = gameState.players[connectedPlayer];
    const currentPlayerName = currentPlayer?.name;
    const [confirmConcede, setConfirmConcede] = useState<boolean>(false);
    const [bugReportOpen, setBugReportOpen] = useState<boolean>(false);


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

    // Handler for closing the bug report dialog
    const handleCloseBugReport = () => {
        setBugReportOpen(false);
    };

    // Handler for spectators to leave the game
    const handleLeaveSpectatorMode = () => {
        router.push('/');
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
        }
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
                            Yield  current game and abandon. This match will count as a loss.
                        </Typography>
                    </Box>
                </Box>
            )}
            {(isDev || gameState.undoEnabled) && (
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
                    />
                    <Typography sx={styles.typeographyStyle}>
                        Report a bug to the developer team
                    </Typography>
                </Box>
            </Box>
            {/* Bug Report Dialog */}
            <BugReportDialog
                open={bugReportOpen}
                onClose={handleCloseBugReport}
            />
        </>
    );
}
export default CurrentGameTab;
