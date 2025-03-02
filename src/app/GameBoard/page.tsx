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

    if (!gameState || !connectedPlayer) {
        return null;
    }

    const activePlayer = gameState.players[connectedPlayer].isActionPhaseActivePlayer;
    const phase = gameState.phase;
    // ----------------------Styles-----------------------------//
    const styles = {
        mainBoxStyle: {
            flexGrow: 1,
            pr: sidebarOpen ? '280px' : '0',
            width: '100%',
            transition: 'padding-right 0.3s ease-in-out',
            height: '100vh',
            position: 'relative',
            backgroundImage: `url(${s3ImageURL('ui/board-background-1.webp')})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        },
        centralPromptContainer: {
            position: 'absolute',
            top: '48.6%',
            left: sidebarOpen ? 'calc(50vw - 140px)' : '50vw',
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.3s ease-in-out',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '50vw',
            pointerEvents: 'none',
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
        },
        playerTurnAura: {
            height: '100px',
            width: '85%',
            position: 'absolute',
            bottom: '-100px',
            boxShadow: activePlayer === true ? '0px -20px 35px var(--initiative-blue)' : phase === 'regroup' || phase === 'setup' ? '0px -20px 35px var(--selection-yellow)' : 'none',
            transition: 'box-shadow 1.5s',
            borderRadius: '50%',
            left: '0',
            right: '0',
            marginInline: 'auto',
        },
        opponentTurnAura: {
            height: '100px',
            width: '85%',
            position: 'absolute', 
            top: '-100px',
            boxShadow: activePlayer === false ? '0px 20px 35px var(--initiative-red)' : phase === 'regroup' || phase === 'setup' ? '0px 20px 35px var(--selection-yellow)' : 'none',
            transition: 'box-shadow 1.5s',
            borderRadius: '50%',
            left: '0',
            right: '0',
            marginInline: 'auto',
        }
    };

    return (
        <Grid container sx={{ height: '100vh', overflow: 'hidden' }}>
            <Box component="main" sx={styles.mainBoxStyle}>
                <OpponentCardTray
                    trayPlayer={getOpponent(connectedPlayer)}
                    preferenceToggle={handlePreferenceToggle}
                />
                <Box sx={ styles.opponentTurnAura} />
                <Board sidebarOpen={sidebarOpen} />
                <PlayerCardTray
                    trayPlayer={connectedPlayer}
                    toggleSidebar={toggleSidebar}
                />
                <Box sx={styles.playerTurnAura} />
            </Box>


            <ChatDrawer
                sidebarOpen={sidebarOpen}
                toggleSidebar={toggleSidebar}
            />

            <Box sx={styles.centralPromptContainer}>
                <Box sx={styles.promptStyle}>
                    {gameState.players[connectedPlayer]?.promptState.menuTitle}
                    <Box sx={styles.promptShadow}/>
                </Box>
            </Box>

            <PopupShell/>
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
