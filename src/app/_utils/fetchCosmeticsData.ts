import { s3ImageURL } from '@/app/_utils/s3Utils';
import { Cosmetics } from '../_components/_sharedcomponents/Preferences/Preferences.types';

const cardbackPrefix = 'ui/cosmetics/cb';
const backgroundPrefix = 'ui/cosmetics/bg';

export const fetchCosmeticsDataAsync = async (): Promise<Cosmetics> => {
    return {
        cardbacks: [
            { id: 'guid1', type: 'cardback', title: 'Default', path: s3ImageURL('game/swu-cardback.webp') },
        ],
        backgrounds: [
            { id: 'guid2', type: 'background', title: 'Default', path: '/default-background.webp' },
            { id: 'guid3', type: 'background', title: 'Spark of Rebellion Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH01_Starfield.png`), darkened: true },
            { id: 'guid4', type: 'background', title: 'Shadows of the Galaxy Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH02_Starfield.png`), darkened: true },
            { id: 'guid5', type: 'background', title: 'Twilight of the Republic Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH03_Starfield.png`), darkened: true },
            { id: 'guid6', type: 'background', title: 'Jump to Lightspeed Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH04_Starfield.png`), darkened: true },
            { id: 'guid7', type: 'background', title: 'Legends of the Force Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH05_Starfield.png`), darkened: true },
            { id: 'guid8', type: 'background', title: 'Secrets of Power Starfield', path: s3ImageURL(`${backgroundPrefix}/SWH06_Starfield.png`), darkened: true },
        ],
        playmats: [

        ]
    }
}