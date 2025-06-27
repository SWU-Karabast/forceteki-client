/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useRef, useEffect, useContext } from 'react';
import { Box, Grid2 as Grid, Typography } from '@mui/material';
import { s3ImageURL } from '../_utils/s3Utils';
import ChatDrawer from '../_components/Gameboard/_subcomponents/Overlays/ChatDrawer/ChatDrawer';
import OpponentCardTray from '../_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '../_components/Gameboard/Board/Board';
import PlayerCardTray from '../_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { useGame } from '../_contexts/Game.context';
import PopupShell from '../_components/_sharedcomponents/Popup/Popup';
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import { useRouter } from 'next/navigation';
import { MatchType } from '@/app/_constants/constants';


const GameBoard = () => {
    const { getOpponent, connectedPlayer, gameState, lobbyState } = useGame();
    const router = useRouter();

    const sidebarState = localStorage.getItem('sidebarState') !== null ? localStorage.getItem('sidebarState') === 'true' : true;
    const [sidebarOpen, setSidebarOpen] = useState(sidebarState);
    const [isPreferenceOpen, setPreferenceOpen] = useState(false);

    useEffect(() => {
        if(lobbyState && !lobbyState.gameOngoing && lobbyState.gameType !== MatchType.Quick) {
            router.push('/lobby');
        }
    }, [lobbyState, router]);

    useEffect(() => {
        if (gameState?.winner) {
            setPreferenceOpen(true);
        }else{
            setPreferenceOpen(false);
        }
    }, [gameState?.winner]);

    const toggleSidebar = () => {
        localStorage.setItem('sidebarState', !sidebarOpen ? 'true' : 'false');
        setSidebarOpen(!sidebarOpen);
    }

    const handlePreferenceToggle = () => {
        setPreferenceOpen(!isPreferenceOpen);
    }

    // check if game ended already.
    const winners = gameState?.winner ? gameState.winner : undefined;
    // const winners = ['order66']
    // we set tabs
    // ['endGame','keyboardShortcuts','cardSleeves','gameOptions']
    const preferenceTabs = winners
        ? ['endGame']
        :['currentGame']

    if (!gameState || !connectedPlayer || (!(connectedPlayer in gameState?.players) && !(connectedPlayer in gameState?.spectators))) {
        return null;
    }

    const promptTitle = gameState?.players[connectedPlayer].promptState.promptTitle;
    const menuTitle = gameState?.players[connectedPlayer].promptState.menuTitle;
    // ----------------------Styles-----------------------------//
    const styles = {
        mainBoxStyle: {
            pr: sidebarOpen ? 'min(20%, 280px)' : '0',
            width: '100%',
            transition: 'padding-right 0.3s ease-in-out',
            height: '100vh',
            position: 'relative',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
        },
        centralPromptContainer: {
            position: 'absolute',
            top: '48.6%',
            left: sidebarOpen ? 'calc(50vw - min(10%, 140px))' : '50vw',
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.3s ease-in-out',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50vw',
            pointerEvents: 'none',
            zIndex: '1',
        },
        promptStyle: {
            textAlign: 'center',
            fontSize: '1.3em',
            textShadow: '1px 1px 6px black',
            padding: '0.5rem',
            position: 'relative',
            borderRadius: '20px',
            background: !menuTitle ? 'transparent' : promptTitle 
                ? 'radial-gradient(ellipse 90% 50% at center 55%, rgba(0, 123, 255, 1) 0%, rgba(0, 123, 255, 0.6) 60%, transparent 100%)' 
                : 'radial-gradient(ellipse 90% 50% at center 55%, rgba(220, 53, 69, 0.8) 0%, rgba(220, 53, 69, 0.4) 60%, transparent 100%)',
        },
        promptShadow: {
            position: 'absolute',
            top: '27%',
            left: 0,
            width: '100%',
            height: '60%',
            zIndex: -1,
            background: 'rgba(0, 0, 0, .9)',
            filter: 'blur(10px)',
            WebkitFilter: 'blur(10px)'
        }
    };

    return (
        <Grid container sx={{ height: '100vh', overflow: 'hidden' }}>
            <Box component="main" sx={styles.mainBoxStyle}>
                <Box sx={{ height: '15vh' }}>
                    <OpponentCardTray
                        trayPlayer={getOpponent(connectedPlayer)}
                        preferenceToggle={handlePreferenceToggle}
                    />
                </Box>
                <Box sx={{ height: '67vh' }}>
                    <Board sidebarOpen={sidebarOpen} />
                </Box>
                <Box sx={{ height: '18vh' }}>
                    <PlayerCardTray
                        trayPlayer={connectedPlayer}
                        toggleSidebar={toggleSidebar}
                    />
                </Box>
            </Box>


            <ChatDrawer
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            <Box sx={styles.centralPromptContainer}>
                <Box sx={styles.promptStyle}>
                    {menuTitle}
                    <Box sx={styles.promptShadow}/>
                </Box>
            </Box>

            <PopupShell sidebarOpen={sidebarOpen}/>
            <PreferencesComponent
                sidebarOpen={sidebarOpen}
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
