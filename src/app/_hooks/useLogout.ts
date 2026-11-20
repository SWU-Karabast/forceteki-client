import { useUser } from '@/app/_contexts/User.context';
import { useErrorScreen } from '@/app/_contexts/ErrorScreen.context';

/**
 * The handler for a log out button. It takes no arguments, so it can be passed straight to onClick, and if the
 * sign-out fails it tells the user that they are still logged in, rather than leaving them to find out on the next page.
 */
export const useLogout = (): (() => void) => {
    const { logoutAsync } = useUser();
    const { showErrorScreen } = useErrorScreen();

    return () => {
        logoutAsync().catch((error: unknown) => {
            console.error('Error logging out:', error);
            showErrorScreen({
                title: 'Couldn\'t log out',
                message: 'We couldn\'t log you out, so you are still logged in - try again in a moment.',
                detail: error instanceof Error ? error.message : undefined,
            });
        });
    };
};
