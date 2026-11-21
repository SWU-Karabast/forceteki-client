import { useLayoutEffect, useRef, useState } from 'react';

const EDGE_TOLERANCE = 1 // scrollTop/scrollHeight can be fractional at zoom in using this tolerance avoids a falce edge flag

// Tracks whether a scrollable element has content hidden above/below the current
// scroll position. Pass a value that changes with content (e.g. item count);
// resizes are handled internally.
export function useOverflow<T extends HTMLElement>(contentKey: unknown) {
    const ref = useRef<T>(null);
    const [edges, setEdges] = useState({ top: false, bottom: false });

    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) return;

        const check = () => {
            const overflowing = element.scrollHeight > element.clientHeight + EDGE_TOLERANCE;
            const top = overflowing && element.scrollTop > EDGE_TOLERANCE;
            const bottom = overflowing && element.scrollTop < element.scrollHeight - element.clientHeight - EDGE_TOLERANCE;
            setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
        };

        check();
        const ro = new ResizeObserver(check);
        ro.observe(element);
        element.addEventListener('scroll', check, { passive: true });

        return () => {
            ro.disconnect();
            element.removeEventListener('scroll', check);
        };
    }, [contentKey]);

    return { ref, edges };
}