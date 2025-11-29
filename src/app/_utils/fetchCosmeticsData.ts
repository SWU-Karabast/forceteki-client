import { IRegisteredCosmetics } from '../_components/_sharedcomponents/Preferences/Preferences.types';
import { ServerApiService } from '../_services/ServerApiService';

export const fetchCosmeticsDataAsync = async (): Promise<IRegisteredCosmetics> => {
    try {
        // Try to get cosmetics from server API
        const cosmeticsFromServer = await ServerApiService.getCosmeticsAsync();

        // If we got cosmetics from server, organize by type
        if (cosmeticsFromServer && cosmeticsFromServer.length > 0) {
            const cosmetics: IRegisteredCosmetics = {
                cardbacks: cosmeticsFromServer.filter(item => item.type === 'cardback'),
                backgrounds: cosmeticsFromServer.filter(item => item.type === 'background'),
                // playmats: cosmeticsFromServer.filter(item => item.type === 'playmat')
            };

            return cosmetics;
        }

        throw new Error('No cosmetics data received from server');
    } catch (error) {
        console.error('Error fetching cosmetics from server:', error);
        throw error;
    }
}