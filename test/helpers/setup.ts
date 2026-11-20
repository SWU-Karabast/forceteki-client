import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { mockFetch, mockServer } from './mockServer';
import { mockRouter } from './mockRouter';
import { mockSession } from './mockSession';

// What the app reaches outside itself through, for every test: the game node, Next's router and the
// next-auth session. The app runs unchanged against these; see each mock for what a test can do with it.
vi.mock('socket.io-client', async () => (await import('./mockServer')).socketIo);
vi.mock('next/navigation', async () => (await import('./mockRouter')).navigation);
vi.mock('next-auth/react', async () => (await import('./mockSession')).nextAuth);
vi.stubGlobal('fetch', mockFetch);

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
Element.prototype.scrollTo ??= () => {};
// nor can it play audio
HTMLMediaElement.prototype.play = () => Promise.resolve();

afterEach(() => {
    // unmount first, so the app closes its sockets before the mocks forget them
    cleanup();
    mockServer.reset();
    mockRouter.reset();
    mockSession.reset();
    localStorage.clear();
});
