import { useEffect, useState } from 'react';

export type ImageLoadStatus = 'loading' | 'loaded' | 'error';

/**
 * Tracks whether `url` loads successfully. Uses a parallel `Image()` request
 * that the browser dedupes with the same-URL `background-image` request the
 * caller is already issuing, so this adds no additional network calls.
 *
 * Returns `'error'` immediately for empty/undefined URLs.
 */
export function useImageLoadStatus(url: string | undefined | null): ImageLoadStatus {
    const [status, setStatus] = useState<ImageLoadStatus>(() =>
        url ? 'loading' : 'error'
    );

    useEffect(() => {
        if (!url) {
            setStatus('error');
            return;
        }
        setStatus('loading');

        const img = new Image();
        let cancelled = false;

        const handleLoad = () => { if (!cancelled) setStatus('loaded'); };
        const handleError = () => { if (!cancelled) setStatus('error'); };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);
        img.src = url;

        // If the response was already cached, `complete` may be true synchronously.
        if (img.complete) {
            if (img.naturalWidth > 0) {
                setStatus('loaded');
            } else {
                setStatus('error');
            }
        }

        return () => {
            cancelled = true;
            img.removeEventListener('load', handleLoad);
            img.removeEventListener('error', handleError);
        };
    }, [url]);

    return status;
}
