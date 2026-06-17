'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */
// gameState/lobbyState mirror the live board state, which is typed `any`
// (same as Game.context.tsx which disables this rule).
import { useContext } from 'react';
import { GameContext } from '@/app/_contexts/Game.context';
import { ReplayContext } from '@/app/_contexts/Replay.context';
import { IChatEntry } from '@/app/_components/_sharedcomponents/Chat/ChatTypes';

export interface IBoardState {
    gameState: any;
    connectedPlayer: string;
    getOpponent: (player: string) => string;
    isSpectator: boolean;
    gameMessages: IChatEntry[];
    gameIsEnded: () => boolean;
    lobbyState: any;
}

export function useBoardState(): IBoardState {
    const replayContext = useContext(ReplayContext);
    const gameContext = useContext(GameContext);

    if (replayContext) {
        return {
            gameState: replayContext.gameState,
            connectedPlayer: replayContext.connectedPlayer,
            getOpponent: replayContext.getOpponent,
            isSpectator: replayContext.isSpectator,
            gameMessages: replayContext.gameMessages,
            gameIsEnded: replayContext.gameIsEnded,
            lobbyState: replayContext.lobbyState,
        };
    }

    if (gameContext) {
        return {
            gameState: gameContext.gameState,
            connectedPlayer: gameContext.connectedPlayer,
            getOpponent: gameContext.getOpponent,
            isSpectator: gameContext.isSpectator,
            gameMessages: gameContext.gameMessages,
            gameIsEnded: gameContext.gameIsEnded,
            lobbyState: gameContext.lobbyState,
        };
    }

    throw new Error('useBoardState must be used within a ReplayProvider or GameProvider');
}
