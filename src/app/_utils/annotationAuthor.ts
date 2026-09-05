// "Your name" setting for annotation authorship — the Annotation.by field. Spec
// decision #4: no accounts; a local display name populates `by`. Stored in localStorage
// so it persists across sessions and is independent of auth state.

const AUTHOR_KEY = 'swu-annotation-author';

/** Read the saved annotation author, falling back to the given default (e.g. username). */
export function getAnnotationAuthor(fallback = ''): string {
    if (typeof window === 'undefined') return fallback;
    try {
        return window.localStorage.getItem(AUTHOR_KEY) || fallback;
    } catch {
        return fallback;
    }
}

/** Persist the annotation author name. Empty string clears it. */
export function setAnnotationAuthor(name: string): void {
    if (typeof window === 'undefined') return;
    try {
        if (name) window.localStorage.setItem(AUTHOR_KEY, name);
        else window.localStorage.removeItem(AUTHOR_KEY);
    } catch {
        // localStorage unavailable (private mode quota, etc.) — non-fatal.
    }
}
