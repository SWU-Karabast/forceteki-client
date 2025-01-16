// contexts/GameContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, {
    createContext,
    useContext,
    useState,
    ReactNode,
    useEffect,
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
    sendManualDisconnectMessage: () => void;
}

const GameContext = createContext<IGameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<any>(null);
    const [lobbyState, setLobbyState] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [connectedPlayer, setConnectedPlayer] = useState<string>('');
    const { openPopup } = usePopup();
    const { user } = useUser();
    const searchParams = useSearchParams();

    useEffect(() => {
        const lobbyId = searchParams.get('lobbyId');
        // we get the lobbyId
        const storedUnknownUserId = localStorage.getItem('unknownUserId') || (lobbyId ? lobbyId + '-GuestId2' : null);
        // we set the username of the player based on whether it is in the localStorage or not.
        const username = localStorage.getItem('unknownUsername') || 'Player2';
        const connectedPlayerId = user?.id || storedUnknownUserId || '';
        setConnectedPlayer(connectedPlayerId);

        const newSocket = io('http://localhost:9500', {
            query: {
                user: JSON.stringify(user ? user : { username:username, id:storedUnknownUserId }),
                lobby: JSON.stringify({ lobbyId:lobbyId ? lobbyId : null })
            },
        });

        const handleGameStatePopups = (gameState: any) => {
            if (!user || user.id == null) return; // TODO currently this doesn't support private lobbies where players aren't logged in.
            if (gameState.players?.[user.id].promptState) {
                const promptState = gameState.players?.[user.id].promptState;
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
                    });
                }
                else if (buttons.length > 0 && menuTitle && promptUuid && !selectCard) {
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

        newSocket.on('connect', () => {
            console.log(`Connected to server as ${user ? user.username : ''}`);
        });
        newSocket.on('gamestate', (gameState: any) => {
            setGameState(gameState);
            console.log('Game state received:', gameState);
            handleGameStatePopups(gameState);
        });
        newSocket.on('connectedUser', () =>{
            localStorage.removeItem('unknownUserId');
            localStorage.removeItem('unknownUsername');
        });
        newSocket.on('lobbystate', (lobbyState: any) => {
            setLobbyState(lobbyState);
            console.log('Lobby state received:', lobbyState);
        })

        setSocket(newSocket);

        return () => {
            newSocket?.disconnect();
        };
    }, [user]);

    const sendMessage = (message: string, args: any[] = []) => {
        console.log('sending message', message, args);
        socket?.emit(message, ...args);
    };

    const sendManualDisconnectMessage = () =>{
        console.log('sending manual disconnect message');
        socket?.emit('manualDisconnect')
    }

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
                sendManualDisconnectMessage
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