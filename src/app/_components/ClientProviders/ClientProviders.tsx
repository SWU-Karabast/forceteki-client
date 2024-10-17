"use client";

import { SidebarProvider } from "@/app/_contexts/Sidebar.context";
import { PlayerProvider } from "@/app/_contexts/Player.context";
import { ThemeContextProvider } from "@/app/_contexts/Theme.context";
import { UserProvider } from "@/app/_contexts/User.context";

interface ClientProvidersProps {
	children: React.ReactNode;
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
	return (
		<UserProvider>
			<SidebarProvider>
				<PlayerProvider>
					<ThemeContextProvider>{children}</ThemeContextProvider>
				</PlayerProvider>
			</SidebarProvider>
		</UserProvider>
	);
};

export default ClientProviders;
