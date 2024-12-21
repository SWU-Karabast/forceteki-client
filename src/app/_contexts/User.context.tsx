"use client";

import React, {
	createContext,
	useContext,
	ReactNode,
	useEffect,
	useState,
	useCallback,
} from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { IUserContextType } from "./UserTypes";

const UserContext = createContext<IUserContextType>({
	user: null,
	login: () => {},
	devLogin: () => {},
	logout: () => {},
});

export const UserProvider: React.FC<{ children: ReactNode }> = ({
	children,
}) => {
	const { data: session } = useSession(); // Get session from next-auth
	const [user, setUser] = useState<IUserContextType["user"]>(null);
	const router = useRouter();

	useEffect(() => {
		// Keep context in sync with next-auth session
		if (session?.user) {
			setUser({
				id: session.user.id || null,
				username: session.user.name || null,
				email: session.user.email || null,
				provider: session.user.provider || null,
			});
		} else {
			setUser(null);
		}
	}, [session]);

	const login = (provider: "google" | "discord") => {
		signIn(provider, {
			callbackUrl: "/",
		});
	};

	const handleSetUser = (user: "Order66" | "ThisIsTheWay") => {
		if (user === "Order66") {
			setUser({
				id: "66",
				username: "Order66",
				email: null,
				provider: null,
			});
		} else if (user === "ThisIsTheWay") {
			setUser({
				id: "Mandalorian",
				username: "ThisIsTheWay",
				email: null,
				provider: null,
			});
		}
	}

	const devLogin = (user: "Order66" | "ThisIsTheWay") => {
		handleSetUser(user);
		localStorage.setItem("devUser", user);
		router.push("/");
	};
	
	useEffect(() => {
		if (process.env.NODE_ENV === "development" && !user ) {
			const storedUser = localStorage.getItem("devUser");
			if (storedUser === "Order66" || storedUser === "ThisIsTheWay") {
				handleSetUser(storedUser);
			}
		}
	}, [user]);

	const logout = () => {
		signOut();
		localStorage.removeItem("devUser");
		setUser(null);
	};

	return (
		<UserContext.Provider value={{ user, login, devLogin, logout }}>
			{children}
		</UserContext.Provider>
	);
};

export const useUser = () => {
	return useContext(UserContext);
};
