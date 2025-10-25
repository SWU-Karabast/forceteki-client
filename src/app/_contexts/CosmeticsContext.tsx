'use client';
import React from 'react';
import { CosmeticOption, Cosmetics, CosmeticType } from '../_components/_sharedcomponents/Preferences/Preferences.types';

interface CosmeticsContextProps {
    cosmetics: Cosmetics;
    setCosmetics: React.Dispatch<React.SetStateAction<Cosmetics>>;
    getCardback: (id: string) => CosmeticOption;
    getBackground: (id: string) => CosmeticOption;
    getPlaymat: (id: string) => CosmeticOption;
}

const defaultCosmetics: Cosmetics = {
    cardbacks: [],
    backgrounds: [],
    playmats: []
};

const CosmeticsContext = React.createContext<CosmeticsContextProps>({
    cosmetics: defaultCosmetics,
    setCosmetics: () => {},
    getCardback: () => ({ id: '', title: '', type: 'cardback', path: '' }),
    getBackground: () => ({ id: '', title: '', type: 'background', path: '' }),
    getPlaymat: () => ({ id: '', title: '', type: 'playmat', path: '' }),
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
                return cosmetics.playmats.find((pm) => pm.title === 'Default')!;
            default:
                throw new Error('Invalid cosmetic type');
        }
    }
    const getCardback = (id: string) => {
        return cosmetics.cardbacks.find((cb) => cb.id === id) || getCosmeticDefault('cardback');
    }
    const getBackground = (id: string) => {
        return cosmetics.backgrounds.find((bg) => bg.id === id) || getCosmeticDefault('background');
    }
    const getPlaymat = (id: string) => {
        return cosmetics.playmats.find((pm) => pm.id === id) || getCosmeticDefault('playmat');
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