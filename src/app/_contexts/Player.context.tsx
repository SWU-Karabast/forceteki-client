// contexts/PlayerContext.tsx
"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import io, { Socket } from "socket.io-client";
import { mockPlayer } from "../_constants/mockData";

interface PlayerContextType {
	activePlayer: Participant;
	setActivePlayer: (player: Participant) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export const PlayerProvider = ({ children }: { children: ReactNode }) => {
	const [activePlayer, setActivePlayer] = useState<Participant>(mockPlayer);
	let socket: Socket | undefined;

	useEffect(() => {
		socket = io("http://localhost:9500", {
			query: {
				user: {
					username: 'Order66'
				}
			}
		});
		socket.on("connect", () => {
			console.log("Connected to server");
		});
		return () => {
			socket?.disconnect();
		};
	}, []);

	return (
		<PlayerContext.Provider value={{ activePlayer, setActivePlayer }}>
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
