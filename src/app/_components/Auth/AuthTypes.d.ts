interface LoginProps {
	username: string;
	setUsername: (value: string) => void;
	password: string;
	setPassword: (value: string) => void;
	rememberMe: boolean;
	setRememberMe: (value: boolean) => void;
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	toggleAuth: () => void;
}

interface SignUpProps {
	email: string;
	setEmail: (value: string) => void;
	password: string;
	setPassword: (value: string) => void;
	confirmPassword: string;
	setConfirmPassword: (value: string) => void;
	passwordError: boolean;
	passwordMatchError: boolean;
	handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
	toggleAuth: () => void;
}

interface StyledTextFieldProps {
	variant?: "outlined" | "filled" | "standard";
	fullWidth?: boolean;
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	errorMessage?: string;
	[key: string]: unknown;
}
