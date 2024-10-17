"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

const UserContext = createContext<UserContextType>({
	user: null,
	login: () => {},
	logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<string | null>(null);

	const login = (username: string) => {
		setUser(username);
		console.log("User logged in:", username);
	};

	const logout = () => {
		setUser(null);
		console.log("User logged out");
	};

	return (
		<UserContext.Provider value={{ user, login, logout }}>
			{children}
		</UserContext.Provider>
	);
};

export const useUser = () => {
	return useContext(UserContext);
};
