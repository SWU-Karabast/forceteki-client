// contexts/GameContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";
import io, { Socket } from "socket.io-client";
import { usePopup } from "./Popup.context";
import { useUser } from "./User.context";

interface IGameContextType {
    gameState: any;
    sendMessage: (message: string, args?: any[]) => void;
    sendGameMessage: (args: any[]) => void;
    getOpponent: (player: string) => string;
    connectedPlayer: string;
    connectedDeck: any;
    updateDeck: (args: any[]) => void;
}

const GameContext = createContext<IGameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
    const [gameState, setGameState] = useState<any>(null);
    const [socket, setSocket] = useState<Socket | undefined>(undefined);
    const [connectedPlayer, setConnectedPlayer] = useState<string>("");
    const [connectedDeck, setDeck] = useState<any>(null);
    const { openPopup } = usePopup();
    const { user } = useUser();

    useEffect(() => {
        if (!user) return;
        setConnectedPlayer(user.id || "");
        const newSocket = io("http://localhost:9500", {
            query: {
                user: JSON.stringify(user),
            },
        });

        const handleGameStatePopups = (gameState: any) => {
            if (!user.id) return;
            if (gameState.players?.[user.id].promptState) {
                const promptState = gameState.players?.[user.id].promptState;
                const { buttons, menuTitle, promptUuid, selectCard, promptType } =
                    promptState;
                if (buttons.length > 0 && menuTitle && promptUuid && !selectCard) {
                    openPopup("default", {
                        uuid: promptUuid,
                        title: menuTitle,
                        promptType: promptType,
                        buttons,
                    });
                }
            }
        };

        newSocket.on("connect", () => {
            console.log(`Connected to server as ${user.username}`);
        });
        newSocket.on("deckData", (deck: any) => {
            setDeck(deck);
        });
        newSocket.on("gamestate", (gameState: any) => {
            setGameState(gameState);
            console.log("Game state received:", gameState);
            handleGameStatePopups(gameState);
        });

        newSocket.on("deckData", (deck: any) => {
            setDeck(deck);
        });

        setSocket(newSocket);
        return () => {
            newSocket?.disconnect();
        };
    }, [user]);

    const sendMessage = (message: string, args: any[] = []) => {
        console.log("sending message", message, args);
        socket?.emit(message, ...args);
    };

    const sendGameMessage = (args: any[]) => {
        console.log("sending game message", args);
        socket?.emit("game", ...args);
    };

    const updateDeck = (args: any[]) => {
        console.log("move card message", args);
        socket?.emit("updateDeck", ...args);
    };

    const getOpponent = (player: string) => {
        if (!gameState) return "";
        const playerNames = Object.keys(gameState.players);
        return playerNames.find((name) => name !== player) || "";
    };

    return (
        <GameContext.Provider
            value={{
                gameState,
                sendGameMessage,
                sendMessage,
                connectedPlayer,
                connectedDeck,
                getOpponent,
                updateDeck,
            }}
        >
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) {
        throw new Error("useGame must be used within a GameProvider");
    }
    return context;
};
