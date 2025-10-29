import { IRegisteredCosmetics, IRegisteredCosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';
import { getServerApiService } from '../_services/ServerApiService';
import fallbackCosmetics from '@/app/_temp/fallback-cosmetics.json';

const fallbackCosmeticsData = (() => {
    const data = fallbackCosmetics as IRegisteredCosmeticOption[] | null | undefined;
    if (data == null) throw new Error('Fallback cosmetics data is invalid');

    return data;
})();

export const fetchCosmeticsDataAsync = async (): Promise<IRegisteredCosmetics> => {
    try {
        // Try to get cosmetics from server API
        const serverApiService = getServerApiService();
        const cosmeticsFromServer = await serverApiService.getCosmeticsAsync();

        // If we got cosmetics from server, organize by type
        if (cosmeticsFromServer && cosmeticsFromServer.length > 0) {
            const cosmetics: IRegisteredCosmetics = {
                cardbacks: cosmeticsFromServer.filter(item => item.type === 'cardback'),
                backgrounds: cosmeticsFromServer.filter(item => item.type === 'background'),
                playmats: cosmeticsFromServer.filter(item => item.type === 'playmat')
            };

            return cosmetics;
        } else {
            // Fall back to static data
            return {
                cardbacks: fallbackCosmeticsData.filter(item => item.type === 'cardback'),
                backgrounds: fallbackCosmeticsData.filter(item => item.type === 'background'),
                playmats: fallbackCosmeticsData.filter(item => item.type === 'playmat')
            };
        }
    } catch (error) {
        console.error('Error fetching cosmetics from server:', error);

        // Fall back to static data on error
        return {
            cardbacks: fallbackCosmeticsData.filter(item => item.type === 'cardback'),
            backgrounds: fallbackCosmeticsData.filter(item => item.type === 'background'),
            playmats: fallbackCosmeticsData.filter(item => item.type === 'playmat')
        };
    }
}