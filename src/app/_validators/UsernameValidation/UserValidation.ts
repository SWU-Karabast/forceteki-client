export const validateDiscordUsername = (username: string): string | null => {
    const trimmedUsername = username;

    if (!trimmedUsername.trim()) {
        return 'Username cannot be empty.';
    }
    if (trimmedUsername.length < 3) {
        return 'Username must be at least 3 characters long.';
    }
    if (trimmedUsername.length > 32) {
        return 'Username cannot be more than 32 characters long.';
    }
    if (!/^[a-zA-Z0-9_.]+$/.test(trimmedUsername)) {
        return 'Username can only contain letters, numbers, underscores (_), and periods (.).';
    }
    if (trimmedUsername.includes('..')) {
        return 'Username cannot have two consecutive periods.';
    }
    if (trimmedUsername.startsWith('.') || trimmedUsername.endsWith('.') || trimmedUsername.startsWith('_') || trimmedUsername.endsWith('_')) {
        return 'Username cannot start or end with a period or underscore.';
    }
    return null;
};