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
import { PopupSource } from '@/app/_components/_sharedcomponents/Popup/Popup.types';
import { ZoneName } from '../_constants/constants';
import { useRouter } from 'next/navigation';

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
    updateDistributionPrompt: (uuid: string, amount: number) => void;
    distributionPromptData: IDistributionPromptData | null;
    isSpectator: boolean;
    lastQueueHeartbeat: number;
}

interface IDistributionPromptData {
    type: string;
    valueDistribution: {
        uuid: string;
        amount: number;
    }[];
}

const GameContext = createContext<IGameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<any>(null);
    const lastGameIdRef = useRef<string | null>(null);
    const [lobbyState, setLobbyState] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [lastQueueHeartbeat, setLastQueueHeartbeat] = useState(Date.now());
    const [connectedPlayer, setConnectedPlayer] = useState<string>('');
    const { openPopup, clearPopups, prunePromptStatePopups } = usePopup();
    const { user, anonymousUserId } = useUser();
    const [isSpectator, setIsSpectator] = useState<boolean>(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [distributionPromptData, setDistributionPromptData] = useState<IDistributionPromptData | null>(null);

    useEffect(() => {
        const lobbyId = searchParams.get('lobbyId');
        const connectedPlayerId = user?.id || anonymousUserId || '';
        if (!connectedPlayerId) return;
        setConnectedPlayer(connectedPlayerId);
        clearPopups();
        const spectatorParam = searchParams.get('spectator');
        const isSpectatorMode = spectatorParam === 'true';
        setIsSpectator(isSpectatorMode);

        const newSocket = io(`${process.env.NEXT_PUBLIC_ROOT_URL}`, {
            path: '/ws',
            query: {
                user: JSON.stringify(user ? user : { username: 'anonymous '+anonymousUserId?.substring(0,6), id: anonymousUserId }),
                lobby: JSON.stringify({ lobbyId:lobbyId ? lobbyId : null }),
                spectator: isSpectatorMode ? 'true' : 'false'
            },
        });

        const cardSelectableZones = (gamestate: any) => {
            const playerState = gamestate.players[connectedPlayerId];
            const zones = [];
            if (playerState.leader.selectable || playerState.base.selectable) {
                zones.push(ZoneName.Base);
            }
            for (const zoneName in playerState.cardPiles) {
                if (playerState.cardPiles[zoneName].some((card: any) => card.selectable)) {
                    zones.push(zoneName);
                }
            }
            return zones
        }

        const handleGameStatePopups = (gameState: any) => {
            if (!connectedPlayerId || isSpectatorMode) return;
            if (gameState.players?.[connectedPlayerId].promptState) {
                setDistributionPromptData(null);
                const promptState = gameState.players?.[connectedPlayerId].promptState;
                const { buttons, menuTitle,promptTitle, promptUuid, selectCardMode, promptType, dropdownListOptions, perCardButtons, displayCards } = promptState;
                prunePromptStatePopups(promptUuid);
                if (promptType === 'actionWindow') return;
                else if (promptType === 'distributeAmongTargets') {
                    setDistributionPromptData({ type: promptState.distributeAmongTargets.type, valueDistribution: [] });
                    return;
                }
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
                        source: PopupSource.PromptState
                    });
                }
                else if (buttons.length > 0 && menuTitle && promptUuid && !selectCardMode) {
                    // make an exception for
                    return openPopup('default', {
                        uuid: promptUuid,
                        title: menuTitle,
                        buttons,
                        source: PopupSource.PromptState
                    });
                }
                else if (dropdownListOptions.length > 0 && menuTitle && promptUuid && !selectCardMode) {
                    return openPopup('dropdown', {
                        uuid: promptUuid,
                        title: promptTitle,
                        description: menuTitle,
                        options: dropdownListOptions,
                        source: PopupSource.PromptState
                    });
                }
            }
            const cardSelectionZones = cardSelectableZones(gameState);
            if (cardSelectionZones.length === 1) {
                const { buttons, menuTitle } = gameState.players[connectedPlayerId].promptState;
                switch (cardSelectionZones[0]) {
                    case 'resources':
                        openPopup('pile', {
                            uuid: `${connectedPlayerId}-resources`,
                            title: 'Your Resources',
                            subtitle: menuTitle,
                            cards: gameState?.players[connectedPlayerId]?.cardPiles['resources'],
                            source: PopupSource.PromptState,
                            buttons: buttons,
                        });
                        break;
                    case 'discard':
                        openPopup('pile', {
                            uuid: `${connectedPlayerId}-discard`,
                            title: 'Your Discard',
                            subtitle: menuTitle,
                            cards: gameState?.players[connectedPlayerId]?.cardPiles['discard'],
                            source: PopupSource.PromptState,
                            buttons: buttons,
                        });
                        break;
                }
            }
        };

        newSocket.on('connection_error', (error: any) => {
            console.error('Connection error:', error);
            router.push('/');
        });

        newSocket.on('matchmakingFailed', (error: any) => {
            console.error('Matchmaking failed with error, requeueing:', error);
            resetStates();
        });

        newSocket.on('gamestate', (gameState: any) => {
            if(isSpectatorMode){
                setConnectedPlayer(Object.keys(gameState.players)[0])
            }
            if (gameState?.id && gameState.id !== lastGameIdRef.current) {
                clearPopups();
                lastGameIdRef.current = gameState.id;
            }
            setGameState(gameState);
            if (process.env.NODE_ENV === 'development') {
                console.log('Game state received:', gameState);
            }
            handleGameStatePopups(gameState);
        });

        newSocket.on('lobbystate', (lobbyState: any) => {
            setLobbyState(lobbyState);
            if (process.env.NODE_ENV === 'development') {
                console.log('Lobby state received:', lobbyState);
            }
        })
        
        newSocket.on('queueHeartbeat', (timestamp) => {
            setLastQueueHeartbeat(timestamp);
        });

        setSocket(newSocket);

        return () => {
            newSocket?.disconnect();
        };
    }, [user, anonymousUserId, openPopup, clearPopups, prunePromptStatePopups]);

    const sendMessage = (message: string, args: any[] = []) => {
        socket?.emit(message, ...args);
    };

    const sendGameMessage = (args: any[]) => {
        if (args[0] === 'statefulPromptResults') {
            args = [args[0], distributionPromptData, args[2]]
            setDistributionPromptData({ type: distributionPromptData?.type || '', valueDistribution: distributionPromptData?.valueDistribution || [] });
        }
        socket?.emit('game', ...args);
    };

    const sendLobbyMessage = (args: any[]) => {
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

    const updateDistributionPrompt = (uuid: string, amount: number) => {
        const totalAmount = gameState.players[connectedPlayer].promptState.distributeAmongTargets?.amount;

        setDistributionPromptData((prevData) => {
            if (!prevData) return null;
            const targets = prevData.valueDistribution;
            const currentTotal = targets.reduce((sum, item) => sum + item.amount, 0);
            if (currentTotal + amount > totalAmount) return prevData;
    

            const newTargetData = targets.map(item =>
                item.uuid === uuid ? { ...item, amount: item.amount + amount } : item
            ).filter(item => item.amount > 0);
    
            if (!targets.some(item => item.uuid === uuid) && amount > 0) {
                newTargetData.push({ uuid, amount });
            }
    
            return { ...prevData, valueDistribution: newTargetData };
        });
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
                resetStates,
                getConnectedPlayerPrompt,
                updateDistributionPrompt,
                distributionPromptData,
                isSpectator,
                lastQueueHeartbeat
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