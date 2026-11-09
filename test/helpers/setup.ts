import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// jsdom has no layout, so media queries never match and nothing is ever resized
globalThis.ResizeObserver ??= class {
    public observe() {}
    public unobserve() {}
    public disconnect() {}
};
window.matchMedia ??= (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
});

afterEach(cleanup);
