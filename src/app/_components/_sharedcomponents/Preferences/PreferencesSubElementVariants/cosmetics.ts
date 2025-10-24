import { s3ImageURL } from '@/app/_utils/s3Utils';

type CosmeticOption = {
    name: string;
    path: string;
    darkened?: boolean;
};

type Cosmetics = {
    cardbacks: CosmeticOption[];
    backgrounds: CosmeticOption[];
    // playmats: CosmeticOption[];
}

export const Cosmetics: Cosmetics = {
    cardbacks: [
        { name: 'Default', path: s3ImageURL('game/swu-cardback.webp') },
        { name: 'Karabast Team', path: '/Karabast%20team.png' },
        { name: 'Mobyus1', path: '/Mobyus1.png' },
    ],
    backgrounds: [
        { name: 'Default', path: '/SWH01_Starfield.png', darkened: true },
        { name: 'Death Star', path: '/bg-deathstar.jpg' },
    ],
}