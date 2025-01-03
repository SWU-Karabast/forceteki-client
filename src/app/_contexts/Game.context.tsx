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

interface IGameContextType {
    gameState: any;
    lobbyState: any;
    sendMessage: (message: string, args?: any[]) => void;
    sendGameMessage: (args: any[]) => void;
    getOpponent: (player: string) => string;
    connectedPlayer: string;
    sendLobbyMessage: (args: any[]) => void;
}

const GameContext = createContext<IGameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<any>(null);
    const [lobbyState, setLobbyState] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [connectedPlayer, setConnectedPlayer] = useState<string>('');
    const { user } = useUser();
    const searchParams = useSearchParams();

    useEffect(() => {
        const lobbyId = searchParams.get('lobbyId');
        // we get the lobbyId
        const storedUnknownUserId = localStorage.getItem('unknownUserId') || lobbyId+'-GuestId2';
        setConnectedPlayer(user ? user.id || '' : storedUnknownUserId ? storedUnknownUserId : '');
        const newSocket = io('http://localhost:9500', {
            query: {
                user: JSON.stringify(user ? user : { id:storedUnknownUserId }),
                lobbyId: lobbyId ? lobbyId : null
            },
        });

        newSocket.on('connect', () => {
            console.log(`Connected to server as ${user ? user.username : ''}`);
        });
        newSocket.on('gamestate', (gameState: any) => {
            setGameState(gameState);
            console.log('Game state received:', gameState);
        });
        newSocket.on('connectedUser', () =>{
            localStorage.removeItem('unknownUserId');
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
                sendLobbyMessage
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
