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
import { DefaultCosmeticId, MatchType } from '@/app/_constants/constants';
import { useUser } from '../_contexts/User.context';
import { useCosmetics } from '../_contexts/CosmeticsContext';

const GameBoard = () => {
    const { getOpponent, connectedPlayer, gameState, lobbyState, isSpectator } = useGame();
    const router = useRouter();
    const { getBackground, getPlaymat } = useCosmetics();
    const sidebarState = localStorage.getItem('sidebarState') !== null ? localStorage.getItem('sidebarState') === 'true' : true;
    const [sidebarOpen, setSidebarOpen] = useState(sidebarState);
    const [isPreferenceOpen, setPreferenceOpen] = useState(false);
    const [userClosedWinScreen, setUserClosedWinScreen] = useState(false);
    const { user, updateUserPreferences } = useUser();
    const background = getBackground(user?.preferences.cosmetics?.background ?? DefaultCosmeticId.Background);
    const playMatsDisabled = user?.preferences.cosmetics?.disablePlaymats ?? false;
    const myPlaymatId = !playMatsDisabled ? user?.preferences.cosmetics?.playmat : 'none';
    const myPlaymat = myPlaymatId && myPlaymatId !== 'none' ? getPlaymat(myPlaymatId) : null;
    const opponentId = getOpponent(connectedPlayer);
    const theirPlaymatId = !playMatsDisabled ? gameState?.players[opponentId]?.user?.cosmetics?.playmat : 'none';
    const theirPlaymat = !playMatsDisabled && theirPlaymatId && theirPlaymatId !== 'none' ? getPlaymat(theirPlaymatId) : null;

    useEffect(() => {
        if(lobbyState && !lobbyState.gameOngoing && lobbyState.gameType !== MatchType.Quick) {
            router.push('/lobby');
        }
    }, [lobbyState, router]);

    useEffect(() => {
        // open preferences automatically if game ended and user hasn't closed it themselves yet.
        if (!!gameState?.winners.length && !userClosedWinScreen) {
            setPreferenceOpen(true);
        }
    }, [gameState?.winners, userClosedWinScreen]);

    const toggleSidebar = () => {
        localStorage.setItem('sidebarState', !sidebarOpen ? 'true' : 'false');
        setSidebarOpen(!sidebarOpen);
    }

    const handlePreferenceToggle = () => {
        if(!!gameState?.winners.length) {
            setUserClosedWinScreen(true);
        }
        setPreferenceOpen(!isPreferenceOpen);
    };

    // check if game ended already.
    const winners = !!gameState?.winners.length ? gameState.winners : undefined;
    // const winners = ['order66']
    // we set tabs
    // ['endGame','keyboardShortcuts','cardSleeves','gameOptions']
    const cosmeticsInGame = false; // disable cosmetics in-game for now
    const preferenceTabs = winners
        ? ['endGame','soundOptions']
        : ['currentGame','soundOptions'].concat(user && cosmeticsInGame ? ['cosmetics'] : []);

    // Get display name for winner (spectator-aware)
    const getWinnerDisplayName = (winnerName: string): string => {
        if (isSpectator && gameState?.players) {
            const player1Name = gameState.players[connectedPlayer]?.user?.username;
            const opponentId = getOpponent(connectedPlayer);
            const player2Name = gameState.players[opponentId]?.user?.username;

            if (winnerName === player1Name) return 'Player 1';
            if (winnerName === player2Name) return 'Player 2';
        }
        return winnerName;
    };

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
            backgroundImage: `url(${background.path})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            flexDirection: 'column',
            '&::before': { }
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
                ? 'radial-gradient(ellipse 90% 65% at center 55%, rgba(0, 123, 255, 1) 0%, rgba(0, 123, 255, 0.6) 60%, transparent 100%)'
                : 'radial-gradient(ellipse 90% 65% at center 55%, rgba(220, 53, 69, 0.8) 0%, rgba(220, 53, 69, 0.4) 60%, transparent 100%)',
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
        },
        playerPlaymat: {
            position: 'absolute',
            bottom: 0, // Touch bottom edge
            left: '2rem', // Add left margin to constrain width
            right: sidebarOpen ? 'calc(min(20%, 280px) + 2rem)' : '2rem', // Add right margin to match
            height: '47vh', // Reduced height for middle spacing
            backgroundSize: 'cover', // Fill container width, crop overflow edges
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px', // Add subtle rounded corners
            opacity: 0.54, // Subtle transparency
            zIndex: 1, // Above background and darkening overlay, below UI elements
            transition: 'right 0.3s ease-in-out',
            pointerEvents: 'none',
            '&::before': { }
        },
        opponentPlaymat: {
            position: 'absolute',
            top: 0, // Touch top edge
            left: '2rem', // Add left margin to constrain width
            right: sidebarOpen ? 'calc(min(20%, 280px) + 2rem)' : '2rem', // Add right margin to match
            height: '47vh', // Reduced height for middle spacing
            backgroundSize: 'cover', // Fill container width, crop overflow edges
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px', // Add subtle rounded corners
            opacity: 0.54, // Subtle transparency
            zIndex: 1, // Above background and darkening overlay, below UI elements
            transition: 'right 0.3s ease-in-out',
            pointerEvents: 'none',
            '&::before': { }
        }
    };

    if(background.darkened) {
        styles.mainBoxStyle = {
            ...styles.mainBoxStyle,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(10, 10, 10, 0.57)',
                zIndex: 0,
            }
        };
    }

    if(myPlaymat?.darkened) {
        styles.playerPlaymat = {
            ...styles.playerPlaymat,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(10, 10, 10, 0.57)',
                borderRadius: '8px',
                zIndex: 1,
            }
        };
    }

    if(theirPlaymat?.darkened) {
        styles.opponentPlaymat = {
            ...styles.opponentPlaymat,
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'rgba(10, 10, 10, 0.57)',
                borderRadius: '8px',
                zIndex: 1,
            }
        };
    }

    return (
        <Grid container sx={{ height: '100vh', overflow: 'hidden' }}>
            <Box component="main" sx={styles.mainBoxStyle} data-testid="gameboard-main-box">
                {/* Opponent Playmat - top half */}
                {theirPlaymat && (
                    <Box
                        sx={{
                            ...styles.opponentPlaymat,
                            backgroundImage: `url("${theirPlaymat.path}")`,
                        }}
                    />
                )}

                {/* Player Playmat - bottom half */}
                {myPlaymat && (
                    <Box
                        sx={{
                            ...styles.playerPlaymat,
                            backgroundImage: `url("${myPlaymat.path}")`,
                        }}
                        onError={(e) => {
                            console.error('Playmat image failed to load:', myPlaymat.path);
                        }}
                    />
                )}                <Box sx={{ height: '15vh' }}>
                    <OpponentCardTray
                        trayPlayer={getOpponent(connectedPlayer)}
                        preferenceToggle={handlePreferenceToggle}
                    />
                </Box>
                <Box sx={{ height: '67vh', position: 'relative', zIndex: 2 }}>
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
            {isPreferenceOpen && <PreferencesComponent
                sidebarOpen={sidebarOpen}
                isPreferenceOpen={isPreferenceOpen}
                preferenceToggle={handlePreferenceToggle}
                tabs={preferenceTabs}
                title={winners ? 'Game ended' : 'PREFERENCES'}
                subtitle={winners ? winners.length > 1 ? 'Game ended in a draw' : `Winner is ${getWinnerDisplayName(winners[0])}` : undefined}
            />}
        </Grid>
    );
};

export default GameBoard;
