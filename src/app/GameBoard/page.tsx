/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, Grid2 as Grid, Typography } from '@mui/material';
import { s3ImageURL } from '../_utils/s3Utils';
import ChatDrawer from '../_components/Gameboard/_subcomponents/Overlays/ChatDrawer/ChatDrawer';
import OpponentCardTray from '../_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '../_components/Gameboard/Board/Board';
import PlayerCardTray from '../_components/Gameboard/PlayerCardTray/PlayerCardTray';
import ResourcesOverlay from '../_components/Gameboard/_subcomponents/Overlays/ResourcesOverlay/ResourcesOverlay';
import BasicPrompt from '../_components/Gameboard/_subcomponents/Overlays/Prompts/BasicPrompt';
import { useGame } from '../_contexts/Game.context';
import { useSidebar } from '../_contexts/Sidebar.context';
import PopupShell from '../_components/_sharedcomponents/Popup/Popup';
import Preferences from '@/app/_components/_sharedcomponents/Preferences/Preferences';

const GameBoard = () => {
    const { getOpponent, connectedPlayer, gameState } = useGame();
    const { sidebarOpen, toggleSidebar } = useSidebar();
    const [chatMessage, setChatMessage] = useState('');
    const [chatHistory, setChatHistory] = useState<string[]>([]);
    const [round, setRound] = useState(2);
    const drawerRef = useRef<HTMLDivElement | null>(null);
    const [drawerWidth, setDrawerWidth] = useState(0);

    // State for resource selection
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isBasicPromptOpen, setBasicPromptOpen] = useState(false);
    const [isPreferenceOpen, setPreferenceOpen] = useState(false);

    const handleChatSubmit = () => {
        if (chatMessage.trim()) {
            setChatHistory([...chatHistory, chatMessage]);
            setChatMessage('');
        }
    };

    useEffect(() => {
    // Update the drawer width when the drawer opens or closes
        if (drawerRef.current) {
            setDrawerWidth(drawerRef.current.offsetWidth);
        }
    }, [sidebarOpen]);

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleBasicPromptToggle = () => {
        setBasicPromptOpen(!isBasicPromptOpen);
    };
    const handlePreferenceToggle = () => {
        setPreferenceOpen(!isPreferenceOpen);
    }

    // ----------------------Styles-----------------------------//

    const styles = {
        mainBoxStyle: {
            flexGrow: 1,
            transition: 'margin-right 0.3s ease',
            mr: sidebarOpen ? `${drawerWidth}px` : '0',
            height: '100vh',
            position: 'relative',
            backgroundImage: `url(${s3ImageURL('game/board-background-1.png')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        centralPromptContainer: {
            position: 'absolute',
            top: '47%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50vw',
        },
        promptStyle: {
            textAlign: 'center',
            fontSize: '1.3em',
            background:
        'radial-gradient(ellipse, rgba(0,0,0, 0.9), rgba(0,0,0,0.7), rgba(0,0,0,0.0))',
        },
    };

    if (!gameState || !connectedPlayer) {
        return null;
    }

    return (
        <Grid container sx={{ height: '100vh', overflow: 'hidden' }}>
            <Box component="main" sx={styles.mainBoxStyle}>
                <OpponentCardTray
                    trayPlayer={getOpponent(connectedPlayer)}
                    preferenceToggle={handlePreferenceToggle}
                />
                <Board sidebarOpen={sidebarOpen} />
                <PlayerCardTray
                    trayPlayer={connectedPlayer}
                    handleModalToggle={handleModalToggle}
                    handleBasicPromptToggle={handleBasicPromptToggle}
                />
            </Box>

            {sidebarOpen && (
                <ChatDrawer
                    ref={drawerRef}
                    toggleSidebar={toggleSidebar}
                    chatHistory={chatHistory}
                    chatMessage={chatMessage}
                    setChatMessage={setChatMessage}
                    handleChatSubmit={handleChatSubmit}
                    sidebarOpen={sidebarOpen}
                    currentRound={round}
                />
            )}
            <Box sx={styles.centralPromptContainer}>
                <Typography sx={styles.promptStyle}>
                    {gameState.players[connectedPlayer]?.promptState.menuTitle}
                </Typography>
            </Box>
            <ResourcesOverlay
                isModalOpen={isModalOpen}
                handleModalToggle={handleModalToggle}
            />
            <BasicPrompt
                isBasicPromptOpen={isBasicPromptOpen}
                handleBasicPromptToggle={handleBasicPromptToggle}
            />
            <PopupShell/>
            <Preferences isPreferenceOpen={isPreferenceOpen} preferenceToggle={handlePreferenceToggle}/>
        </Grid>
    );
};

export default GameBoard;
