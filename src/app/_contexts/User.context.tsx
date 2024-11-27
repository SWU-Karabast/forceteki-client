"use client";

import React, {
	createContext,
	useContext,
	ReactNode,
	useEffect,
	useState,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { UserContextType } from "./UserTypes";

const UserContext = createContext<UserContextType>({
	user: null,
	login: () => {},
	logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { data: session } = useSession(); // Get session from next-auth
	const [user, setUser] = useState<UserContextType["user"]>(null);

	useEffect(() => {
		// Keep context in sync with next-auth session
		if (session?.user) {
			setUser({
				id: session.user.id || null,
				name: session.user.name || null,
				email: session.user.email || null,
				image: session.user.image || null,
				provider: session.user.provider || null,
			});
		} else {
			setUser(null);
		}
	}, [session]);

	const login = (provider: "google" | "discord") => {
		console.log("Logging in with", provider);

		signIn(provider, {
			callbackUrl: "/",
		});

		console.log("Logged in with", provider);
	};

	const logout = () => {
		signOut();
		setUser(null);
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
