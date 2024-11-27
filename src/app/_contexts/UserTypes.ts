export interface User {
	id: string | null;
	name: string | null;
	email: string | null;
	image: string | null;
	provider: string | null;
}

export interface UserContextType {
	user: User | null;
	login: (provider: "google" | "discord") => void;
	logout: () => void;
}
