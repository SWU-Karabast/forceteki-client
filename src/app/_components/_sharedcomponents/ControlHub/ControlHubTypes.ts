export interface ControlHubProps {
	path?: string;
	sidebarOpen?: boolean;
	toggleSidebar?: () => void;
	user?: string | null;
	logout?: () => void;
}
