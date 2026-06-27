'use client';

import { CardImageLocaleProvider } from '@/app/_contexts/CardImageLocale.context';
import { CosmeticsProvider } from '@/app/_contexts/CosmeticsContext';
import { PopupProvider } from '@/app/_contexts/Popup.context';
import { ThemeContextProvider } from '@/app/_contexts/Theme.context';
import { TimerVisibilityProvider } from '@/app/_contexts/TimerVisibility.context';
import { UserProvider } from '@/app/_contexts/User.context';
import { SessionProvider } from 'next-auth/react';
import { OngoingEffectHighlightProvider } from '@/app/_contexts/OngoingEffectHighlight.context';

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
                            <OngoingEffectHighlightProvider>
                                <CosmeticsProvider>
                                    <ThemeContextProvider>{children}</ThemeContextProvider>
                                </CosmeticsProvider>
                            </OngoingEffectHighlightProvider>
                        </PopupProvider>
                    </TimerVisibilityProvider>
                </CardImageLocaleProvider>
            </UserProvider>
        </SessionProvider>
    );
};

export default ClientProviders;
