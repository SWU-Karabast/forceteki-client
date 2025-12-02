'use client';
import React from 'react';
import {
    IRegisteredCosmeticOption,
    IRegisteredCosmetics,
    RegisteredCosmeticType
} from '../_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '../_services/ServerApiService';
import { s3ImageURL } from '../_utils/s3Utils';
import { IUser } from './UserTypes';

// const DEFAULT_CARDBACK_URI = 'https://karabast-data.s3.amazonaws.com/game/swu-cardback.webp';
const DEFAULT_BACKGROUND: IRegisteredCosmeticOption = {
    id: 'default',
    title: 'Default Background',
    type: RegisteredCosmeticType.Background,
    path: s3ImageURL('ui/board-background-1.webp')
};

interface CosmeticsContextProps {
    cosmetics: IRegisteredCosmetics;
    setCosmetics: React.Dispatch<React.SetStateAction<IRegisteredCosmetics>>;
    getCardbackUri: (connectedPlayer: any | null, isSpectator: boolean) => string | null;
    getBackgroundFromUserPreferences: (user: IUser | null) => IRegisteredCosmeticOption;
    getBackgroundFromGameState: (connectedPlayer: any | null, isSpectator: boolean) => IRegisteredCosmeticOption;
    // getPlaymat: (id?: string) => IRegisteredCosmeticOption;
    fetchCosmetics: () => void;
}

const defaultCosmetics: IRegisteredCosmetics = {
    cardbacks: [],
    backgrounds: [],
    // playmats: []
};

const CosmeticsContext = React.createContext<CosmeticsContextProps>({
    cosmetics: defaultCosmetics,
    setCosmetics: () => {},
    getCardbackUri: () => null,
    getBackgroundFromUserPreferences: () => DEFAULT_BACKGROUND,
    getBackgroundFromGameState: () => DEFAULT_BACKGROUND,
    // getPlaymat: () => ({ id: '', title: '', type: RegisteredCosmeticType.Playmat, path: '' }),
    fetchCosmetics: () => {}
});

export const CosmeticsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [cosmetics, setCosmetics] = React.useState<IRegisteredCosmetics>(defaultCosmetics);
    // const getCosmeticDefaultUri = (type: RegisteredCosmeticType): string => {
    //     switch(type) {
    //         case RegisteredCosmeticType.Cardback:
    //             return DEFAULT_CARDBACK_URI;
    //         case RegisteredCosmeticType.Background:
    //             return DEFAULT_BACKGROUND_URI;

    //         /* case RegisteredCosmeticType.Playmat:
    //             return { id: 'none', title: 'None', type: RegisteredCosmeticType.Playmat, path: '' };*/
    //         default:
    //             throw new Error('Invalid cosmetic type');
    //     }
    // }
    const getCardbackUri = (connectedPlayer: any | null, isSpectator: boolean) => {
        if (isSpectator) {
            return null;
        }

        const cardbackUri = connectedPlayer?.user?.cosmetics?.cardbackUri;
        return cardbackUri == null || cardbackUri === '' ? null : cardbackUri;
    }
    const getBackgroundFromUserPreferences = (user: IUser | null) => {
        return user?.preferences.cosmetics?.background ?? DEFAULT_BACKGROUND;
    }
    const getBackgroundFromGameState = (connectedPlayer: any | null, isSpectator: boolean) => {
        if (isSpectator) {
            return DEFAULT_BACKGROUND;
        }

        return connectedPlayer?.preferences.cosmetics?.background ?? DEFAULT_BACKGROUND;
    }

    /* const getPlaymat = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(RegisteredCosmeticType.Playmat);
        }
        return cosmetics.playmats.find((pm) => pm.id === id) || getCosmeticDefault(RegisteredCosmeticType.Playmat);
    }*/

    const fetchCosmetics = async () => {
        ServerApiService.getCosmeticsAsync().then((data) => {
            setCosmetics(data.reduce((acc: IRegisteredCosmetics, cosmetic) => {
                switch (cosmetic.type) {
                    case RegisteredCosmeticType.Cardback:
                        acc.cardbacks.push(cosmetic);
                        break;
                    case RegisteredCosmeticType.Background:
                        acc.backgrounds.push(cosmetic);
                        break;

                    /* case RegisteredCosmeticType.Playmat:
                        acc.playmats.push(cosmetic);
                        break; */
                }
                return acc;
            }, { cardbacks: [], backgrounds: [] }));
        });
    };

    return (
        <CosmeticsContext.Provider value={{ cosmetics, setCosmetics,
            getCardbackUri: getCardbackUri, getBackgroundFromUserPreferences, getBackgroundFromGameState, fetchCosmetics
        }}>
            {children}
        </CosmeticsContext.Provider>
    );
};

export const useCosmetics = () => {
    const context = React.useContext(CosmeticsContext);
    if (!context) {
        throw new Error('useCosmetics must be used within a CosmeticsProvider');
    }
    return context;
};