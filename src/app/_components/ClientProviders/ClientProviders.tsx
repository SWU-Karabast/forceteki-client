"use client";

import { SidebarProvider } from "@/app/_contexts/Sidebar.context";
import { GameProvider } from "@/app/_contexts/Game.context";
import { ThemeContextProvider } from "@/app/_contexts/Theme.context";
import { UserProvider } from "@/app/_contexts/User.context";

interface ClientProvidersProps {
	children: React.ReactNode;
}

const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
	return (
		<UserProvider>
			<SidebarProvider>
				<GameProvider>
					<ThemeContextProvider>{children}</ThemeContextProvider>
				</GameProvider>
			</SidebarProvider>
		</UserProvider>
	);
};

export default ClientProviders;
