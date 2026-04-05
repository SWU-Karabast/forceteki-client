// ClientLayout.tsx
'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { GameProvider } from '@/app/_contexts/Game.context';

const ClientProviders = dynamic(
    () => import('@/app/_components/ClientProviders/ClientProviders'),
    { ssr: false }
);

const Navbar = dynamic(() => import('./Navigation/NavBar'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const path = usePathname();
    const pagesWithWebsocket = ['/GameBoard', '/lobby', '/quickGame'];
    const pagesWithoutNavbar = ['/replay'];
    const isPageWithWebsocket = pagesWithWebsocket.includes(path);
    const hideNavbar = pagesWithoutNavbar.includes(path);

    return (
        <>
            {isPageWithWebsocket ? (
                <ClientProviders>
                    <GameProvider>
                        {children}
                    </GameProvider>
                </ClientProviders>
            ) : (
                <ClientProviders>
                    {!hideNavbar && <Navbar />}
                    {children}
                </ClientProviders>
            )}
        </>
    );
}