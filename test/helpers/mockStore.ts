// A value the app reads through a hook and a test changes from outside React, such as the URL or the
// session. Components subscribe with `useValue()`, so changing it re-renders them as the real hook would.
import { useSyncExternalStore } from 'react';
import { act } from '@testing-library/react';

export const createMockStore = <T>(initial: () => T) => {
    let value = initial();
    const listeners = new Set<() => void>();
    const subscribe = (listener: () => void) => {
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    };

    return {
        get: () => value,
        set: (next: T) => {
            value = next;
            act(() => listeners.forEach((listener) => listener()));
        },
        reset: () => {
            value = initial();
        },
        useValue: () => useSyncExternalStore(subscribe, () => value),
    };
};
