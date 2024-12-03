// contexts/GameContext.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, {
	createContext,
	useContext,
	useState,
	ReactNode,
	useEffect,
} from "react";
import io, { Socket } from "socket.io-client";

interface GameContextType {
	gameState: any;
	sendMessage: (message: string, args?: any[]) => void;
	sendGameMessage: (args: any[]) => void;
	getOpponent: (player: string) => string;
	connectedPlayer: string;
	connectedDeck: any,
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
	const [gameState, setGameState] = useState<any>(null);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [connectedPlayer, setConnectedPlayer] = useState<string>("");
	const [connectedDeck, setDeck] = useState<any>(null);

	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const playerName = urlParams.get("player") || "Order66";
		setConnectedPlayer(playerName);
		const newSocket = io("http://localhost:9500", {
			query: {
				user: JSON.stringify({
					username: playerName,
				}),
			},
		});

		newSocket.on("connect", () => {
			console.log(`Connected to server as ${playerName}`);
		});
		newSocket.on("gamestate", (gameState: any) => {
			setGameState(gameState);
			console.log("Game state received:", gameState);
		});
		newSocket.on("deckData", (deck:any) =>{
			setDeck(deck);
		});

		setSocket(newSocket);

		return () => {
			newSocket?.disconnect();
		};
	}, []);

	const sendMessage = (message: string, args: any[] = []) => {
		console.log("sending message", message, args);
		socket?.emit(message, ...args);
	};

	const sendGameMessage = (args: any[]) => {
		console.log("sending game message", args);
		socket?.emit("game", ...args);
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
				getOpponent
			}}
		>
			{children}
		</GameContext.Provider>
	);
};

export const useGame = () => {
	const context = useContext(GameContext);
	console.log(context);
	if (!context) {
		throw new Error("useGame must be used within a GameProvider");
	}
	return context;
};
