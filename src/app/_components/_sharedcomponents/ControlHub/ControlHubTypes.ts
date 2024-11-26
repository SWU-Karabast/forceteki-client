import { User } from "./../../../_contexts/UserTypes";

export interface ControlHubProps {
	path?: string;
	sidebarOpen?: boolean;
	toggleSidebar?: () => void;
	user?: User | null;
	logout?: () => void;
}
