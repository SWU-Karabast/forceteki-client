"use client";

import { SidebarProvider } from "@/app/_contexts/Sidebar.context";
import { ThemeContextProvider } from "@/app/_contexts/Theme.context";
import { UserProvider } from "@/app/_contexts/User.context";
import { SessionProvider } from "next-auth/react";

interface ClientProvidersProps {
	children: React.ReactNode;
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
	return (
		<SessionProvider>
			<UserProvider>
				<SidebarProvider>
					<ThemeContextProvider>{children}</ThemeContextProvider>
				</SidebarProvider>
			</UserProvider>
		</SessionProvider>
	);
};

export default ClientProviders;
