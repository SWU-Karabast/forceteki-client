// contexts/GameContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
    useRef,
} from 'react';
import io, { Socket } from 'socket.io-client';
import { useUser } from './User.context';
import { useSearchParams } from 'next/navigation';
import { usePopup } from './Popup.context';

interface IGameContextType {
    gameState: any;
    lobbyState: any;
    sendMessage: (message: string, args?: any[]) => void;
    sendGameMessage: (args: any[]) => void;
    getOpponent: (player: string) => string;
    connectedPlayer: string;
    sendLobbyMessage: (args: any[]) => void;
    resetStates: () => void;
    getConnectedPlayerPrompt: () => any;
}

const GameContext = createContext<IGameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<any>(null);
    const lastGameIdRef = useRef<string | null>(null);
    const [lobbyState, setLobbyState] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [connectedPlayer, setConnectedPlayer] = useState<string>('');
    const { openPopup, clearPopups } = usePopup();
    const { user, anonymousUserId } = useUser();
    const searchParams = useSearchParams();

    useEffect(() => {
        const lobbyId = searchParams.get('lobbyId');
        const connectedPlayerId = user?.id || anonymousUserId || '';
        console.log('connectedPlayerId', connectedPlayerId);
        if (!connectedPlayerId) return;
        setConnectedPlayer(connectedPlayerId);
        clearPopups();



        const newSocket = io(`${process.env.NEXT_PUBLIC_ROOT_URL}`, {
            path: '/ws',
            query: {
                user: JSON.stringify(user ? user : { username: '', id: anonymousUserId }),
                lobby: JSON.stringify({ lobbyId:lobbyId ? lobbyId : null })
            },
        });

        const handleGameStatePopups = (gameState: any) => {
            if (!connectedPlayerId) return;
            if (gameState.players?.[connectedPlayerId].promptState) {
                const promptState = gameState.players?.[connectedPlayerId].promptState;
                const { buttons, menuTitle,promptTitle, promptUuid, selectCard, promptType, dropdownListOptions, perCardButtons, displayCards } =
                    promptState;
                if (promptType === 'actionWindow') return;
                else if (promptType === 'displayCards') {
                    const cards = displayCards.map((card: any) => {
                        return {
                            ...card,
                            uuid: card.cardUuid,
                        };
                    });
                    return openPopup('select', {
                        uuid: promptUuid,
                        title: promptTitle,
                        description: menuTitle,
                        cards: cards,
                        perCardButtons: perCardButtons,
                        buttons: buttons,
                    });
                }
                else if (buttons.length > 0 && menuTitle && promptUuid && !selectCard) {
                    // make an exception for
                    return openPopup('default', {
                        uuid: promptUuid,
                        title: menuTitle,
                        buttons,
                    });
                }
                else if (dropdownListOptions.length > 0 && menuTitle && promptUuid && !selectCard) {
                    return openPopup('dropdown', {
                        uuid: promptUuid,
                        title: promptTitle,
                        description: menuTitle,
                        options: dropdownListOptions,
                    });
                }
            }
        };

        newSocket.on('gamestate', (gameState: any) => {
            if (gameState?.id && gameState.id !== lastGameIdRef.current) {
                clearPopups();
                lastGameIdRef.current = gameState.id;
            }
            setGameState(gameState);
            console.log('Game state received:', gameState);
            handleGameStatePopups(gameState);
        });
        newSocket.on('lobbystate', (lobbyState: any) => {
            setLobbyState(lobbyState);
            console.log('Lobby state received:', lobbyState);
        })

        setSocket(newSocket);

        return () => {
            newSocket?.disconnect();
        };
    }, [user, anonymousUserId, openPopup, clearPopups]);

    const sendMessage = (message: string, args: any[] = []) => {
        console.log('sending message', message, args);
        socket?.emit(message, ...args);
    };

    const sendGameMessage = (args: any[]) => {
        console.log('sending game message', args);
        socket?.emit('game', ...args);
    };

    const sendLobbyMessage = (args: any[]) => {
        console.log('sending lobby message', args);
        socket?.emit('lobby', ...args);
    }

    const getOpponent = (player: string) => {
        if (!gameState) return '';
        const playerNames = Object.keys(gameState.players);
        return playerNames.find((name) => name !== player) || '';
    };

    const resetStates = () => {
        setLobbyState(null);
        setGameState(null);
    }


    const getConnectedPlayerPrompt = () => {
        if (!gameState) return '';
        return gameState.players[connectedPlayer]?.promptState;
    }

    return (
        <GameContext.Provider
            value={{
                gameState,
                lobbyState,
                sendGameMessage,
                sendMessage,
                connectedPlayer,
                getOpponent,
                sendLobbyMessage,
                resetStates,
                getConnectedPlayerPrompt
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};  