import { useEffect, useRef, useState } from 'react';

export type ImageLoadStatus = 'loading' | 'loaded' | 'error';

/**
 * Tracks load status of an `<img>` element rendered by the caller. Spread
 * the returned `imgProps` onto the element; the hook listens directly to
 * the element's `onLoad`/`onError` events (no proxy `Image()` request).
 *
 * Returns `'error'` immediately for empty/undefined URLs.
 */
export function useImageLoadStatus(url: string | undefined | null) {
    const ref = useRef<HTMLImageElement | null>(null);
    const [status, setStatus] = useState<ImageLoadStatus>(() =>
        url ? 'loading' : 'error'
    );

    useEffect(() => {
        if (!url) {
            setStatus('error');
            return;
        }
        setStatus('loading');
        // If the response was already cached, `load` may fire before React
        // attaches handlers; inspect `complete` after commit to catch it.
        const img = ref.current;
        if (img && img.complete) {
            setStatus(img.naturalWidth > 0 ? 'loaded' : 'error');
        }
    }, [url]);

    return {
        status,
        imgProps: {
            ref,
            onLoad: () => setStatus('loaded'),
            onError: () => setStatus('error'),
        } as const,
    };
}
