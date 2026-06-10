'use client';

import { CosmeticsProvider } from '@/app/_contexts/CosmeticsContext';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { ThemeContextProvider } from '@/app/_contexts/Theme.context';
import { UserProvider } from '@/app/_contexts/User.context';
import { SessionProvider } from 'next-auth/react';
import { ConstantEffectHighlightProvider } from '@/app/_contexts/ConstantEffectHighlight.context';

interface IClientProvidersProps {
    children: React.ReactNode;
}

const ClientProviders: React.FC<IClientProvidersProps> = ({ children }) => {
    return (
        <SessionProvider>
            <UserProvider>
                <PopupProvider>
                    <ConstantEffectHighlightProvider>
                        <CosmeticsProvider>
                            <ThemeContextProvider>{children}</ThemeContextProvider>
                        </CosmeticsProvider>
                    </ConstantEffectHighlightProvider>
                </PopupProvider>
            </UserProvider>
        </SessionProvider>
    );
};

export default ClientProviders;
