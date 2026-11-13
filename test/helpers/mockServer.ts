/* eslint-disable @typescript-eslint/no-explicit-any */
// The forceteki game node, as the client sees it: the socket.io server it connects to and the REST API
// it calls. setup.ts points socket.io-client and `fetch` at this module for every test, so the app runs
// unchanged. It must not import app code, since the app imports it back through those mocks.
//
// What the server sends belongs in forceteki's snapshots (see "Tests" in CLAUDE.md), so
// tests deliver recorded states rather than ones written here.
import { act, waitFor } from '@testing-library/react';

type Handler = (...args: any[]) => void;

/** A socket the client opened, as the server sees it. */
export class MockSocket {
    public connected = true;

    /** Everything the client emitted, as `[event, ...args]`. */
    public readonly sent: unknown[][] = [];
    private readonly handlers = new Map<string, Handler[]>();

    /** `url` and `options` are the handshake, exactly as the client passed them to `io()`. */
    public constructor(public readonly url: string, public readonly options: any) {}

    public on(event: string, handler: Handler) {
        this.handlers.set(event, [...(this.handlers.get(event) ?? []), handler]);
        return this;
    }

    public emit(event: string, ...args: unknown[]) {
        this.sent.push([event, ...args]);
        return this;
    }

    /** The client closing the connection. Like socket.io, this tells the client's own `disconnect` handlers. */
    public disconnect() {
        if (this.connected) {
            this.connected = false;
            this.notify('disconnect', 'io client disconnect');
        }
        return this;
    }

    /** Delivers a message from the server, as socket.io would. */
    public receive(event: string, ...args: unknown[]) {
        if (!this.connected) {
            throw new Error(`the client has disconnected this socket, so it cannot receive '${event}'`);
        }
        act(() => this.notify(event, ...args));
    }

    private notify(event: string, ...args: unknown[]) {
        this.handlers.get(event)?.forEach((handler) => handler(...args));
    }
}

interface IMockResponse {
    body: unknown;
    status: number;
}

// what the game pages ask for on load
const defaultRoutes = (): Map<string, IMockResponse> => new Map([
    ['/api/server-settings', { body: { gamesEnabled: true }, status: 200 }],
    ['/api/cosmetics', { body: { success: true, cosmetics: [], count: 0, isContributor: false }, status: 200 }],
]);

let routes = defaultRoutes();

export const mockServer = {
    sockets: [] as MockSocket[],

    /** Every REST request the client made, as `METHOD /path`. */
    requests: [] as string[],

    get liveSockets() {
        return this.sockets.filter((socket) => socket.connected);
    },

    /** The socket the client has open, once it has opened exactly one. */
    async waitForConnection() {
        await waitFor(() => {
            if (this.liveSockets.length !== 1) {
                throw new Error(`expected 1 open socket, found ${this.liveSockets.length}`);
            }
        });
        return this.liveSockets[0];
    },

    /** Answers requests to `path` with `body` for the rest of this test. */
    respond(path: string, body: unknown, status = 200) {
        routes.set(path, { body, status });
    },

    reset() {
        this.sockets.length = 0;
        this.requests.length = 0;
        routes = defaultRoutes();
    },
};

const io = (url: string, options: unknown) => {
    const socket = new MockSocket(url, options);
    mockServer.sockets.push(socket);
    return socket;
};

/** socket.io-client */
export const socketIo = { default: io, io };

/** `fetch`, answering from the routes above. Anything else is a 404 that names the request. */
export const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url, 'http://client/');
    mockServer.requests.push(`${init?.method ?? 'GET'} ${url.pathname}`);
    const response = routes.get(url.pathname) ?? { body: { message: `no mock response for ${url.pathname}` }, status: 404 };
    return new Response(JSON.stringify(response.body), { status: response.status });
};
