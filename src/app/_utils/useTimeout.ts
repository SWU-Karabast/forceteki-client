import { useEffect, useRef } from 'react';

export default function useTimeout(callback: () => void, delay: number | null): void {
    const savedCallback = useRef<() => void>();

    useEffect(() => {
        savedCallback.current = callback;
    });

    useEffect(() => {
        function tick() {
            savedCallback.current?.();
        }

        // Don't schedule if no delay is specified.
        // Note: 0 is a valid value for delay.
        if (!delay && delay !== 0) {
            return
        }

        const id = setTimeout(tick, delay);
        return () => clearTimeout(id);
    }, [delay]);
}