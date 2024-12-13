export interface IUser {
	id: string | null;
	name: string | null;
	email: string | null;
	image: string | null;
	provider: string | null;
}

export interface IUserContextType {
	user: IUser | null;
	login: (provider: "google" | "discord") => void;
	logout: () => void;
}
