'use client';

import { CardImageLocaleProvider } from '@/app/_contexts/CardImageLocale.context';
import { CosmeticsProvider } from '@/app/_contexts/CosmeticsContext';
import { ErrorRecoveryProvider } from '@/app/_contexts/ErrorRecovery.context';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { ThemeContextProvider } from '@/app/_contexts/Theme.context';
import { TimerVisibilityProvider } from '@/app/_contexts/TimerVisibility.context';
import { UserProvider } from '@/app/_contexts/User.context';
import { SessionProvider } from 'next-auth/react';

interface IClientProvidersProps {
    children: React.ReactNode;
}

const ClientProviders: React.FC<IClientProvidersProps> = ({ children }) => {
    return (
        <SessionProvider>
            <UserProvider>
                <CardImageLocaleProvider>
                    <TimerVisibilityProvider>
                        <PopupProvider>
                            <CosmeticsProvider>
                                <ThemeContextProvider>
                                    <ErrorRecoveryProvider>{children}</ErrorRecoveryProvider>
                                </ThemeContextProvider>
                            </CosmeticsProvider>
                        </PopupProvider>
                    </TimerVisibilityProvider>
                </CardImageLocaleProvider>
            </UserProvider>
        </SessionProvider>
    );
};

export default ClientProviders;
