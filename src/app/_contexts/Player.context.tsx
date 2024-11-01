// contexts/PlayerContext.tsx
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
import { mockPlayer } from "../_constants/mockData";
import { Participant } from "@/app/_components/Gameboard/GameboardTypes";

interface PlayerContextType {
	activePlayer: Participant;
	setActivePlayer: (player: Participant) => void;
	gameState: any;
	sendMessage: (args: any[]) => void;
	connectedPlayer: string;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
	const [activePlayer, setActivePlayer] = useState<Participant>(mockPlayer);
	const [gameState, setGameState] = useState<any>(null);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);
	const [connectedPlayer, setConnectedPlayer] = useState<string>("");

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

	return (
		<PlayerContext.Provider
			value={{
				activePlayer,
				setActivePlayer,
				gameState,
				sendMessage,
				connectedPlayer,
			}}
		>
			{children}
		</PlayerContext.Provider>
	);
};

export const usePlayer = () => {
	const context = useContext(PlayerContext);
	if (!context) {
		throw new Error("usePlayer must be used within a PlayerProvider");
	}
	return context;
};
