'use client';
import React from 'react';
import { IRegisteredCosmeticOption, IRegisteredCosmetics, RegisteredCosmeticType } from '../_components/_sharedcomponents/Preferences/Preferences.types';

interface CosmeticsContextProps {
    cosmetics: IRegisteredCosmetics;
    setCosmetics: React.Dispatch<React.SetStateAction<IRegisteredCosmetics>>;
    getCardback: (id?: string) => IRegisteredCosmeticOption;
    getBackground: (id?: string) => IRegisteredCosmeticOption;
    getPlaymat: (id?: string) => IRegisteredCosmeticOption;
}

const defaultCosmetics: IRegisteredCosmetics = {
    cardbacks: [],
    backgrounds: [],
    playmats: []
};

const CosmeticsContext = React.createContext<CosmeticsContextProps>({
    cosmetics: defaultCosmetics,
    setCosmetics: () => {},
    getCardback: () => ({ id: '', title: '', type: RegisteredCosmeticType.Cardback, path: '' }),
    getBackground: () => ({ id: '', title: '', type: RegisteredCosmeticType.Background, path: '' }),
    getPlaymat: () => ({ id: '', title: '', type: RegisteredCosmeticType.Playmat, path: '' }),
});

export const CosmeticsProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const [cosmetics, setCosmetics] = React.useState<IRegisteredCosmetics>(defaultCosmetics);
    const getCosmeticDefault = (type: RegisteredCosmeticType): IRegisteredCosmeticOption => {
        switch(type) {
            case 'cardback':
                return cosmetics.cardbacks.find((cb) => cb.title === 'Default')!;
            case 'background':
                return cosmetics.backgrounds.find((bg) => bg.title === 'Default')!;
            case 'playmat':
                return { id: 'none', title: 'None', type: RegisteredCosmeticType.Playmat, path: '' };
            default:
                throw new Error('Invalid cosmetic type');
        }
    }
    const getCardback = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(RegisteredCosmeticType.Cardback);
        }
        return cosmetics.cardbacks.find((cb) => cb.id === id) || getCosmeticDefault(RegisteredCosmeticType.Cardback);
    }
    const getBackground = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(RegisteredCosmeticType.Background);
        }
        return cosmetics.backgrounds.find((bg) => bg.id === id) || getCosmeticDefault(RegisteredCosmeticType.Background);
    }
    const getPlaymat = (id?: string) => {
        if (!id) {
            return getCosmeticDefault(RegisteredCosmeticType.Playmat);
        }
        return cosmetics.playmats.find((pm) => pm.id === id) || getCosmeticDefault(RegisteredCosmeticType.Playmat);
    }

    React.useEffect(() => {
        const fetchCosmetics = async () => {
            const response = await fetch('/api/cosmetics');
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