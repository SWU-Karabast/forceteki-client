/* eslint-disable @typescript-eslint/no-explicit-any */
// next-auth's session (next-auth/react), which setup.ts replaces with `nextAuth` for every test.
// Each test starts as a visitor who is not signed in; `mockSession.set` changes that mid-test, and
// whatever reads `useSession` re-renders, as it would when a real session loads or ends.
// It must not import app code, since the app imports it back through that mock.
import { createMockStore } from './mockStore';

export interface IMockSession {
    status: 'loading' | 'authenticated' | 'unauthenticated';

    /** What `useSession().data` returns, such as `{ user, jwtToken }`. */
    data: any;
}

const session = createMockStore<IMockSession>(() => ({ status: 'unauthenticated', data: null }));

export const mockSession = {
    get: session.get,
    set: session.set,
    reset: session.reset,
};

/** next-auth/react */
export const nextAuth = {
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
    useSession: () => ({ ...session.useValue(), update: async () => null }),
    signIn: async () => {},
    signOut: async () => {},
};
