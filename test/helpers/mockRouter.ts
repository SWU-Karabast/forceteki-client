// Next's App Router (next/navigation), which setup.ts replaces with `navigation` for every test.
// The URL lives here; `push` changes it, and renderMockApp draws the page for whatever it is.
// It must not import app code, since the app imports it back through that mock.
import { createMockStore } from './mockStore';

const url = createMockStore(() => new URL('http://client/'));

export const mockRouter = {
    get path() {
        return url.get().pathname;
    },

    /** Every URL the app navigated to, in order. */
    history: [] as string[],

    /** Opens `href` as if typed into the address bar; not recorded in `history`. */
    goTo(href: string) {
        url.set(new URL(href, 'http://client/'));
    },

    reset() {
        this.history.length = 0;
        url.reset();
    },
};

const appRouter = {
    push: (href: string) => {
        mockRouter.history.push(href);
        mockRouter.goTo(href);
    },
    replace: (href: string) => mockRouter.goTo(href),
    back: () => {},
    forward: () => {},
    refresh: () => {},
    prefetch: () => {},
};

/** next/navigation */
export const navigation = {
    useRouter: () => appRouter,
    usePathname: () => url.useValue().pathname,
    useSearchParams: () => url.useValue().searchParams,
    useParams: () => ({}),
    redirect: (href: string) => appRouter.replace(href),
};
