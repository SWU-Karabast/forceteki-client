import { useEffect, useState } from 'react';

// Hook to track when a tab is or is not active, using the Page Visibility API
// So that we can handle certain actions when the tab is hidden, or revisited
export function usePageVisibility() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const handleVisibilityChange = () => {
            // document.visibilityState will be 'visible' or 'hidden'
            setIsVisible(document.visibilityState === 'visible');
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Initial check on mount
        handleVisibilityChange();

        // Cleanup function to remove event listener when the component unmounts
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []); // Empty dependency array ensures this runs once on mount and unmount

    return isVisible;
}
