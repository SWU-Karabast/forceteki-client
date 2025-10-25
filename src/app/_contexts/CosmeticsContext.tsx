'use client';
import React from 'react';
import { CosmeticOption, Cosmetics, CosmeticType } from '../_components/_sharedcomponents/Preferences/Preferences.types';

interface CosmeticsContextProps {
    cosmetics: Cosmetics;
    setCosmetics: React.Dispatch<React.SetStateAction<Cosmetics>>;
    getCardback: (id?: string) => CosmeticOption;
    getBackground: (id?: string) => CosmeticOption;
    getPlaymat: (id?: string) => CosmeticOption;
}

const defaultCosmetics: Cosmetics = {
    cardbacks: [],
    backgrounds: [],
    playmats: []
};

const CosmeticsContext = React.createContext<CosmeticsContextProps>({
    cosmetics: defaultCosmetics,
    setCosmetics: () => {},
    getCardback: () => ({ id: '', title: '', type: CosmeticType.Cardback, path: '' }),
    getBackground: () => ({ id: '', title: '', type: CosmeticType.Background, path: '' }),
    getPlaymat: () => ({ id: '', title: '', type: CosmeticType.Playmat, path: '' }),
});

export const CosmeticsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [cosmetics, setCosmetics] = React.useState<Cosmetics>(defaultCosmetics);
    const getCosmeticDefault = (type: CosmeticType): CosmeticOption => {
        switch(type) {
            case 'cardback':
                return cosmetics.cardbacks.find((cb) => cb.title === 'Default')!;
            case 'background':
                return cosmetics.backgrounds.find((bg) => bg.title === 'Default')!;
            case 'playmat':
                return { id: 'none', title: 'None', type: CosmeticType.Playmat, path: '' };
            default:
                throw new Error('Invalid cosmetic type');
        }
    }
    const getCardback = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(CosmeticType.Cardback);
        }
        return cosmetics.cardbacks.find((cb) => cb.id === id) || getCosmeticDefault(CosmeticType.Cardback);
    }
    const getBackground = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(CosmeticType.Background);
        }
        return cosmetics.backgrounds.find((bg) => bg.id === id) || getCosmeticDefault(CosmeticType.Background);
    }
    const getPlaymat = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(CosmeticType.Playmat);
        }
        return cosmetics.playmats.find((pm) => pm.id === id) || getCosmeticDefault(CosmeticType.Playmat);
    }

    React.useEffect(() => {
        const fetchCosmetics = async () => {
            const baseUrl = process.env.NODE_ENV === 'development'
                ? 'http://localhost:3000'
                : 'https://karabast.net';
            const response = await fetch(`${baseUrl}/api/cosmetics`);
            const data = await response.json();
            setCosmetics(data);
        };
        fetchCosmetics();
    }, []);

    return (
        <CosmeticsContext.Provider value={{ cosmetics, setCosmetics,
            getCardback, getBackground, getPlaymat
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