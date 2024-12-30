import React, { useState } from 'react';
import {
    Card,
    Typography,
    CardActions,
    Button,
    Box, Divider, TextField, CardContent,
} from '@mui/material';
import Chat from '@/app/_components/_sharedcomponents/Chat/Chat';
import SetUpCard from '@/app/_components/Lobby/_subcomponents/SetUpCard/SetUpCard';
import { useGame } from '@/app/_contexts/Game.context';
import { useRouter } from 'next/navigation'
import { ILobbyUserProps } from '@/app/_components/Lobby/LobbyTypes';

const SetUp: React.FC = ({
}) => {
    const router = useRouter();
    const { lobbyState, sendLobbyMessage, connectedPlayer } = useGame();

    // find the user
    const connectedUser = lobbyState ? lobbyState.users.find((u: ILobbyUserProps) => u.id === connectedPlayer) : null;
    // setup chat mechanics
    const [chatMessage, setChatMessage] = useState('');
    const handleChatSubmit = () => {
        if (chatMessage.trim()) {
            sendLobbyMessage(['sendChatMessage',chatMessage]);
            setChatMessage('');
        }
    };

    // ------------------------STYLES------------------------//
    const mainCardStyle = {
        borderRadius: '1.1em',
        height: '100%',
        maxHeight: '72.5vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        mt: '2.0em',
        p: '1.8em',
        backgroundColor: '#00000080',
        backdropFilter: 'blur(30px)',
        overflow: 'hidden',
        '@media (max-height: 1000px)': {
            maxHeight: '67vh',
        },
        '@media (max-height: 759px)': {
            maxHeight: '60.5vh',
        },
    };

    const lobbyTextStyle ={
        fontSize: '3.0em',
        fontWeight: '600',
        color: 'white',
        alignSelf: 'flex-start',
        mb: '0.3em',
    };
    const exitCard = {
        display: 'flex',
        pr: '1.2em',
        pl: '1.2em',
        width: '100%',
        height: '10%',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
    };
    const dividerStyle = {
        backgroundColor: '#fff',
        mt: '.5vh',
        mb: '0.5vh',
    };
    const boxContainer = {
        width: '100%',
        // maxHeight: "64vh", // this is for the small screen
        height: '100%',
    };
    const handleExit = () => {
        router.push('/');
    }

    return (
        <Box sx={boxContainer}>
            <Typography sx={lobbyTextStyle}>KARABAST</Typography>
            <SetUpCard owner={lobbyState ? lobbyState.lobbyOwnerId === connectedPlayer : false} readyStatus={connectedUser ? connectedUser.ready : false}/>
            <Card sx={mainCardStyle}>
                <Chat
                    chatHistory={lobbyState ? lobbyState.gameChat : []}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    handleChatSubmit={handleChatSubmit}
                />
                <Divider sx={dividerStyle} />
                <Box sx={exitCard} onClick={() => handleExit()}>
                    <Typography variant="h5">
                        Exit Game Lobby
                    </Typography>
                    <Typography variant="h5">
                        {'<'}
                    </Typography>
                </Box>
            </Card>
        </Box>
    );
};

export default SetUp;
