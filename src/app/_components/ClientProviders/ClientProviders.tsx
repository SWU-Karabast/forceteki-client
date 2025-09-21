'use client';

import { PopupProvider } from '@/app/_contexts/Popup.context';
import { ThemeContextProvider } from '@/app/_contexts/Theme.context';
import { UserProvider } from '@/app/_contexts/User.context';
import { DeckPreferencesProvider } from '@/app/_contexts/DeckPreferences.context';
import { SessionProvider } from 'next-auth/react';

interface IClientProvidersProps {
    children: React.ReactNode;
}

const ClientProviders: React.FC<IClientProvidersProps> = ({ children }) => {
    return (
        <SessionProvider>
            <UserProvider>
                <DeckPreferencesProvider>
                    <PopupProvider>
                        <ThemeContextProvider>{children}</ThemeContextProvider>
                    </PopupProvider>
                </DeckPreferencesProvider>
            </UserProvider>
        </SessionProvider>
    );
};

export default ClientProviders;
