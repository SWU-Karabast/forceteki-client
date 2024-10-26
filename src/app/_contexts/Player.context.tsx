// contexts/PlayerContext.tsx
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

interface PlayerContextType {
	activePlayer: Participant;
	setActivePlayer: (player: Participant) => void;
	gameState: any;
	sendMessage: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
	const [activePlayer, setActivePlayer] = useState<Participant>(mockPlayer);
	const [gameState, setGameState] = useState<any>(null);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);

	useEffect(() => {
		const newSocket = io("http://localhost:9500", {
			query: {
				user: JSON.stringify({
					username: 'Order66'
				})
			}
		});

		newSocket.on("connect", () => {
			console.log("Connected to server");
		});
		newSocket.on("gamestate", (gameState) => {
			setGameState(gameState);
			console.log("Game state received:", gameState);
		});

		setSocket(newSocket);

		return () => {
			newSocket?.disconnect();
		};
	}, []);

	const sendMessage = () => {
		const uuid = gameState.players['Order66'].buttons[0].uuid;
		socket?.emit("game", "menuButton", 0, uuid);
	}

	return (
		<PlayerContext.Provider value={{ activePlayer, setActivePlayer, gameState, sendMessage }}>
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
