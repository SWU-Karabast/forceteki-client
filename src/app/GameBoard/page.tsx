/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Box, Grid2 as Grid, Typography } from '@mui/material';
import ChatDrawer from '../_components/Gameboard/_subcomponents/Overlays/ChatDrawer/ChatDrawer';
import OpponentCardTray from '../_components/Gameboard/OpponentCardTray/OpponentCardTray';
import Board from '../_components/Gameboard/Board/Board';
import PlayerCardTray from '../_components/Gameboard/PlayerCardTray/PlayerCardTray';
import { useGame } from '../_contexts/Game.context';
import { useUser } from '../_contexts/User.context';
import PopupShell from '../_components/_sharedcomponents/Popup/Popup';
import PreferencesComponent from '@/app/_components/_sharedcomponents/Preferences/PreferencesComponent';
import { useRouter } from 'next/navigation';
import { Bo3SetEndedReason, GamesToWinMode, IBo3SetEndResult, MatchmakingType } from '@/app/_constants/constants';
import { useCosmetics } from '../_contexts/CosmeticsContext';
import { Play } from 'next/font/google';
import RichText from '../_components/_sharedcomponents/RichText/RichText';

// Custom Popup Imports
import { ConcedePopup } from '../_components/_sharedcomponents/Popup/PopupVariant/ConcedePopup';
import { contentStyle } from '../_components/_sharedcomponents/Popup/Popup.styles';

const GameBoard = () => {
    const { getOpponent, connectedPlayer, gameState, lobbyState, isSpectator, sendGameMessage } = useGame();
    const { user } = useUser();
    const router = useRouter();
    const { getBackground, getPlaymat } = useCosmetics();
    const sidebarState = localStorage.getItem('sidebarState') !== null ? localStorage.getItem('sidebarState') === 'true' : true;
    const [sidebarOpen, setSidebarOpen] = useState(sidebarState);
    const [isPreferenceOpen, setPreferenceOpen] = useState(false);
    const [userClosedWinScreen, setUserClosedWinScreen] = useState(false);
    const [isConcedeConfirmOpen, setIsConcedeConfirmOpen] = useState(false);

    // Playmat and Background Logic
    const playerUser = gameState?.players[connectedPlayer]?.user;
    const background = getBackground(isSpectator ? null : playerUser?.cosmetics?.background ?? null);
    const playMatsDisabled = isSpectator ? true : playerUser?.cosmetics?.disablePlaymats ?? true;
    const myPlaymatId = !playMatsDisabled ? playerUser?.cosmetics?.playmat : 'none';
    const myPlaymat = myPlaymatId && myPlaymatId !== 'none' ? getPlaymat(myPlaymatId) : null;
    const opponentId = getOpponent(connectedPlayer);
    const opponentUser = gameState?.players[opponentId]?.user;
    const theirPlaymatId = !playMatsDisabled ? opponentUser?.cosmetics?.playmat : null;
    const theirPlaymat = !playMatsDisabled && theirPlaymatId ? getPlaymat(theirPlaymatId) : null;

    useEffect(() => {
        if(lobbyState && !lobbyState.gameOngoing && (lobbyState.gameType !== MatchmakingType.Quick || lobbyState.winHistory.gamesToWinMode === GamesToWinMode.BestOfThree)) {
            router.push('/lobby');
        }
    }, [lobbyState, router]);

    useEffect(() => {
        const hasWinners = !!gameState?.winners.length;
        if (hasWinners && !userClosedWinScreen) {
            setPreferenceOpen(true);
        } else if (!hasWinners && userClosedWinScreen) {
            setUserClosedWinScreen(false);
        }
    }, [gameState?.winners, userClosedWinScreen]);

    const toggleSidebar = () => {
        localStorage.setItem('sidebarState', !sidebarOpen ? 'true' : 'false');
        setSidebarOpen(!sidebarOpen);
    }

    const handlePreferenceToggle = useCallback(() => {
        if (!!gameState?.winners.length) {
            setUserClosedWinScreen(true);
        }
        setPreferenceOpen((prev) => !prev);
    }, [gameState?.winners.length]);

    const handleGlobalKeyDown = useCallback((event: KeyboardEvent) => {
        // 1. Safety check for typing
        const isTyping = event.target instanceof HTMLInputElement || 
                         event.target instanceof HTMLTextAreaElement;
        if (isTyping) return;

        // 2. Define shortcuts from user preferences
        const menuShortcut = user?.preferences?.keyboardShortcuts?.menu || 'ESC';
        const concedeShortcut = user?.preferences?.keyboardShortcuts?.concede || 'A';
        const leaderShortcut = user?.preferences?.keyboardShortcuts?.leaderAbility || 'L';
        
        // 3. Define the pressed key (fixes scoping issues)
        const pressedKey = event.key === 'Escape' ? 'ESC' : event.key.toUpperCase();

        // --- MENU / ESC LOGIC ---
        if (pressedKey === menuShortcut) {
            event.preventDefault();
            if (isConcedeConfirmOpen) {
                setIsConcedeConfirmOpen(false);
            } else {
                handlePreferenceToggle();
            }
            return;
        }

        // --- CONCEDE LOGIC ---
        if (pressedKey === concedeShortcut) {
            if (!gameState?.winners?.length && !isSpectator) {
                event.preventDefault();
                setIsConcedeConfirmOpen(true);
            }
            return;
        }

        // --- LEADER ACTION / DEPLOY LOGIC ---
        if (pressedKey === leaderShortcut) {
            const playerPrompt = gameState?.players[connectedPlayer]?.promptState;
            
            // Check if the Leader Menu (Select Cards Popup) is already open
            const leaderBtn = playerPrompt?.perCardButtons?.find(
                (b: any) => b.arg === 'leaderAbility' || b.arg === 'deployLeader'
            );

            if (leaderBtn) {
                event.preventDefault();
                sendGameMessage([leaderBtn.command, leaderBtn.arg, leaderBtn.uuid || '']);
            } else {
                // If menu is NOT open, find the leader card and click it
                const leaderCard = gameState?.players[connectedPlayer]?.leader;
                if (leaderCard?.uuid) {
                    event.preventDefault();
                    sendGameMessage(['cardClicked', leaderCard.uuid]);
                }
            }
            return;
        }

        // --- CUSTOMIZABLE CHAT MACRO ---
        // Fallback to 'W' and 'Good luck, have fun!' if preferences aren't set yet
        const welcomeShortcut = user?.preferences?.keyboardShortcuts?.welcomeMsgKey || 'W';
        const customWelcomeText = user?.preferences?.welcomeMessageText || 'Good luck, have fun!';

        if (pressedKey === welcomeShortcut) {
            event.preventDefault();
    
            sendGameMessage(['chat', { 
                message: customWelcomeText, 
                type: 'player' 
            }]);
            return;
        }
    }, [user, isConcedeConfirmOpen, gameState, connectedPlayer, isSpectator, handlePreferenceToggle, sendGameMessage]);

    useEffect(() => {
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [handleGlobalKeyDown]);

    const winners = !!gameState?.winners.length ? gameState.winners : undefined;
    const preferenceTabs = winners
        ? ['endGame','keyboardShortcuts','soundOptions']
        : ['currentGame','keyboardShortcuts','soundOptions'];

    // Bo3 Logic
    const winHistory = lobbyState?.winHistory;
    const isBo3Mode = winHistory?.gamesToWinMode === GamesToWinMode.BestOfThree;
    const currentGameNumber = winHistory?.currentGameNumber || 1;
    const isBo3SetComplete = isBo3Mode && !!winHistory?.setEndResult;
    const gameEndedTitle = isBo3Mode
        ? (isBo3SetComplete ? 'Best-of-Three Set Ended' : `Game ${currentGameNumber} ended`)
        : 'Game ended';

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

    const styles = {
        mainBoxStyle: {
            pr: sidebarOpen ? 'min(20%, 280px)' : '0',
            width: '100%',
            transition: 'padding-right 0.3s ease-in-out',
            height: '100dvh',
            position: 'relative',
            backgroundImage: `url(${background.path}?v=2)`,
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
            bottom: 0,
            left: '2rem',
            right: sidebarOpen ? 'calc(min(20%, 280px) + 2rem)' : '2rem',
            height: '47dvh',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            zIndex: 1,
            transition: 'right 0.3s ease-in-out',
            pointerEvents: 'none',
        },
        opponentPlaymat: {
            position: 'absolute',
            top: 0,
            left: '2rem',
            right: sidebarOpen ? 'calc(min(20%, 280px) + 2rem)' : '2rem',
            height: '47dvh',
            backgroundSize: 'cover',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat',
            borderRadius: '8px',
            zIndex: 1,
            transition: 'right 0.3s ease-in-out',
            pointerEvents: 'none',
        },
        concedePopupContainer: {
            position: 'absolute',
            left: sidebarOpen ? '42.5%' : '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: sidebarOpen ? 'calc(100% - min(20%, 280px))' : '100%',
            transition: 'width 0.3s ease-in-out',
            pointerEvents: 'auto',
        }
    };

    return (
        <Grid container sx={{ height: '100dvh', overflow: 'hidden' }}>
            <Box component="main" sx={styles.mainBoxStyle} data-testid="gameboard-main-box">
                {theirPlaymat && (
                    <Box
                        sx={{
                            ...styles.opponentPlaymat,
                            backgroundImage: `url("${theirPlaymat.path}")`,
                        }}
                    />
                )}
                {myPlaymat && (
                    <Box
                        sx={{
                            ...styles.playerPlaymat,
                            backgroundImage: `url("${myPlaymat.path}")`,
                        }}
                    />
                )}
                <Box sx={{ height: '15dvh' }}>
                    <OpponentCardTray
                        trayPlayer={getOpponent(connectedPlayer)}
                        preferenceToggle={handlePreferenceToggle}
                    />
                </Box>
                <Box sx={{ height: '67dvh', position: 'relative', zIndex: 2 }}>
                    <Board sidebarOpen={sidebarOpen} />
                </Box>
                <Box sx={{ height: '18dvh' }}>
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
                    {menuTitle && <RichText text={menuTitle}/>}
                    <Box sx={styles.promptShadow}/>
                </Box>
            </Box>

            {isConcedeConfirmOpen && (
                <Box sx={styles.concedePopupContainer}>
                    <Box sx={{ ...contentStyle(0), width: '50%', display: 'flex', justifyContent: 'center' }}>
                        <ConcedePopup onClose={() => setIsConcedeConfirmOpen(false)} />
                    </Box>
                </Box>
            )}

            <PopupShell sidebarOpen={sidebarOpen}/>
            {isPreferenceOpen && <PreferencesComponent
                sidebarOpen={sidebarOpen}
                isPreferenceOpen={isPreferenceOpen}
                preferenceToggle={handlePreferenceToggle}
                tabs={preferenceTabs}
                title={winners ? gameEndedTitle : 'PREFERENCES'}
                subtitle={winners ? winners.length > 1 ? 'Game ended in a draw' : `Winner is ${getWinnerDisplayName(winners[0])}` : undefined}
            />}
        </Grid>
    );
};

export default GameBoard;
