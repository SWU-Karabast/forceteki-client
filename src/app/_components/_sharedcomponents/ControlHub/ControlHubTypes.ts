import { IUser } from "./../../../_contexts/UserTypes";

export interface IControlHubProps {
	path?: string;
	sidebarOpen?: boolean;
	toggleSidebar?: () => void;
	user?: IUser | null;
	logout?: () => void;
}
