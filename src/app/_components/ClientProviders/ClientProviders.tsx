'use client';

import { CosmeticsProvider } from '@/app/_contexts/CosmeticsContext';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { ThemeContextProvider } from '@/app/_contexts/Theme.context';
import { UserProvider } from '@/app/_contexts/User.context';
import { SessionProvider } from 'next-auth/react';

interface IClientProvidersProps {
    children: React.ReactNode;
}

const ClientProviders: React.FC<IClientProvidersProps> = ({ children }) => {
    return (
        <SessionProvider>
            <UserProvider>
                <PopupProvider>
                    <CosmeticsProvider>
                        <ThemeContextProvider>{children}</ThemeContextProvider>
                    </CosmeticsProvider>
                </PopupProvider>
            </UserProvider>
        </SessionProvider>
    );
};

export default ClientProviders;
