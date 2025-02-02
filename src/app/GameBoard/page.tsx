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
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import { useRouter } from 'next/navigation';
import { MatchType } from '@/app/_constants/constants';


const GameBoard = () => {
    const { getOpponent, connectedPlayer, gameState, lobbyState } = useGame();

    const router = useRouter();
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
        if(lobbyState && !lobbyState.gameOngoing && lobbyState.gameType !== MatchType.Quick) {
            router.push('/lobby');
        }
    }, [sidebarOpen, gameState, lobbyState, router]);

    useEffect(() => {
        if (gameState?.winner) {
            setPreferenceOpen(true);
        }else{
            setPreferenceOpen(false);
        }
    }, [gameState?.winner]);

    const handleModalToggle = () => {
        setIsModalOpen(!isModalOpen);
    };

    const handleBasicPromptToggle = () => {
        setBasicPromptOpen(!isBasicPromptOpen);
    };
    const handlePreferenceToggle = () => {
        setPreferenceOpen(!isPreferenceOpen);
    }

    // check if game ended already.
    const winners = gameState?.winner ? gameState.winner : undefined;
    // const winners = ['order66']
    // we set tabs
    const preferenceTabs = winners
        ? ['endGame','keyboardShortcuts','cardSleeves','gameOptions']
        :['currentGame','keyboardShortcuts','cardSleeves','gameOptions']

    if (!gameState || !connectedPlayer) {
        return null;
    }
    // ----------------------Styles-----------------------------//
    const styles = {
        mainBoxStyle: {
            flexGrow: 1,
            transition: 'margin-right 0.3s ease',
            mr: sidebarOpen ? `${drawerWidth}px` : '0',
            height: '100vh',
            position: 'relative',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
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
            padding: '1rem',
            position: 'relative',
        },
        promptShadow: {
            position: 'absolute',
            top: '22%',
            left: 0,
            width: '100%',
            height: '60%',
            zIndex: -1,
            background: 'rgba(0, 0, 0, 0.5)',
            filter: 'blur(10px)',
            WebkitFilter: 'blur(10px)'
        }
    };

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
                    <Box sx={styles.promptShadow}/>
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
            <PreferencesComponent
                isPreferenceOpen={isPreferenceOpen}
                preferenceToggle={handlePreferenceToggle}
                tabs={preferenceTabs}
                title={winners ? 'Game ended' : 'PREFERENCES'}
                subtitle={winners ? winners.length > 1 ? 'Game ended in a draw' : `Winner is ${winners[0]}` : undefined}
            />
        </Grid>
    );
};

export default GameBoard;
