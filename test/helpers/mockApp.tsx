// The whole client as a browser runs it: the real layout, providers and pages, with the outside world
// replaced by the mocks setup.ts installs (mockServer, mockRouter, mockSession). Use it for what crosses
// pages or depends on the connection; when only the board matters, renderGameState is lighter.
import React from 'react';
import { render } from '@testing-library/react';
import ClientLayout from '@/app/ClientLayout';
import GameBoardPage from '@/app/GameBoard/page';
import LobbyPage from '@/app/lobby/page';
import QuickGamePage from '@/app/quickGame/page';
import { mockRouter, navigation } from './mockRouter';

// Add a page here when a test needs to reach it.
const pages: Record<string, React.FC> = {
    '/GameBoard': GameBoardPage,
    '/lobby': LobbyPage,
    '/quickGame': QuickGamePage,
};

/** The page for the current path inside the real layout, as Next's App Router renders it. */
const MockApp = () => {
    const path = navigation.usePathname();
    const Page = pages[path];
    if (!Page) {
        throw new Error(`the mock app has no page for ${path}`);
    }
    return <ClientLayout><Page /></ClientLayout>;
};

interface IMockAppOptions {

    /** Where the visitor opens the app, such as `/quickGame` or `/lobby?lobbyId=…`. */
    url: string;

    /** The anonymous visitor's id, as a previous visit left it in localStorage. */
    anonymousUserId?: string;
}

export const renderMockApp = ({ url, anonymousUserId }: IMockAppOptions) => {
    mockRouter.goTo(url);
    if (anonymousUserId) {
        localStorage.setItem('anonymousUserId', anonymousUserId);
    }
    return render(<MockApp />);
};
