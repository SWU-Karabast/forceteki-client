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
import { usePathname } from "next/navigation";

interface GameContextType {
	gameState: any;
	sendMessage: (args: any[]) => void;
	getOpponent: (player: string) => string;
	connectedPlayer: string;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider = ({ children }: { children: ReactNode }) => {
	const [gameState, setGameState] = useState<any>(null);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [connectedPlayer, setConnectedPlayer] = useState<string>("");
	const path = usePathname();

	if (path !== "/lobby" && path !== "/GameBoard") {
		return <>{children}</>;
	};

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

		setSocket(newSocket);

		return () => {
			newSocket?.disconnect();
		};
	}, []);

	const sendMessage = (args: any[]) => {
		socket?.emit("game", ...args);
	};

	const getOpponent = (player: string) => {
		const playerNames = Object.keys(gameState.players);
		return playerNames.find((name) => name !== player) || "";
	};

	return (
		<GameContext.Provider
			value={{
				gameState,
				sendMessage,
				connectedPlayer,
				getOpponent
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
