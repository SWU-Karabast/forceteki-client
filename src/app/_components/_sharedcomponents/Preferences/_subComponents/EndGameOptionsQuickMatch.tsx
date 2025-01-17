import * as React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Divider } from '@mui/material';
import PreferenceButton from '@/app/_components/_sharedcomponents/Preferences/_subComponents/PreferenceButton';
import { useRouter } from 'next/navigation';
import { useGame } from '@/app/_contexts/Game.context';
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';

function EndGameOptionsQuickMatch() {
    const router = useRouter();
    const { sendLobbyMessage, sendMessage, resetStates, lobbyState, connectedPlayer } = useGame();

    const handleReturnHome = () => {
        sendMessage('manualDisconnect');
        router.push('/');
    }

    const handleRequeue = async () => {
        sendMessage('requeue');
        resetStates();
        router.push('/quickGame');
        // const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null
        // we need to call this since we clear the socket beforehand.


        /* try {
            const payload = {
                user: connectedUser,
                deck: connectedUser.deck ? connectedUser.deck : null,
            };
            const response = await fetch('http://localhost:9500/api/enter-queue',
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                throw new Error('Failed to create game');
            }
            router.push('/quickGame');
        } catch (error) {
            console.error(error);
        }*/
    }

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
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Home</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'concede'} text={'Return Home'} buttonFnc={handleReturnHome} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to main page.
                    </Typography>
                </Box>
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Rematch</Typography>
                <Divider sx={{ mb: '20px' }}/>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'New Quick Match'} buttonFnc={handleRequeue}/>
                    <Typography sx={styles.typeographyStyle}>
                        Reenter the queue for a new opponent.
                    </Typography>
                </Box>
                <Box sx={{ ...styles.contentContainer, mb:'20px' }}>
                    <PreferenceButton variant={'standard'} text={'Request Rematch'} buttonFnc={() => sendLobbyMessage(['regularRematch'])} />
                    <Typography sx={styles.typeographyStyle}>
                        Return to lobby to start a new game with the same opponent.
                    </Typography>
                </Box>
            </Box>
            <Box sx={styles.functionContainer}>
                <Typography sx={styles.typographyContainer} variant={'h3'}>Statistics</Typography>
                <Divider sx={{ mb: '20px' }}/>
            </Box>
        </>
    );
}
export default EndGameOptionsQuickMatch;
