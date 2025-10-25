import { Cosmetics, CosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';
import { getDynamoDbServiceAsync } from '../_services/DynamoDBService';
import fallbackCosmetics from '@/app/_temp/fallback-cosmetics.json';
const fallbackCosmeticsData = (() => {
    const data = fallbackCosmetics as CosmeticOption[] | null | undefined;
    if (data == null) throw new Error('Fallback cosmetics data is invalid');

    return data;
})();

export const fetchCosmeticsDataAsync = async (): Promise<Cosmetics> => {
    try {
        // Try to get DynamoDB service
        const dynamoService = await getDynamoDbServiceAsync();

        if (dynamoService) {
            // First check if we have cosmetics in DB
            let cosmeticsFromDb = await dynamoService.getCosmeticsAsync();

            // If no cosmetics in DB, initialize with fallback data
            if (cosmeticsFromDb.length === 0) {
                await dynamoService.initializeCosmeticsAsync(fallbackCosmeticsData);
                cosmeticsFromDb = fallbackCosmeticsData;
            }

            // Organize by type
            const cosmetics: Cosmetics = {
                cardbacks: cosmeticsFromDb.filter(item => item.type === 'cardback'),
                backgrounds: cosmeticsFromDb.filter(item => item.type === 'background'),
                playmats: cosmeticsFromDb.filter(item => item.type === 'playmat')
            };

            return cosmetics;
        } else {
            return {
                cardbacks: fallbackCosmeticsData.filter(item => item.type === 'cardback'),
                backgrounds: fallbackCosmeticsData.filter(item => item.type === 'background'),
                playmats: fallbackCosmeticsData.filter(item => item.type === 'playmat')
            };
        }
    } catch (error) {
        console.error('Error fetching cosmetics from DynamoDB:', error);

        return {
            cardbacks: fallbackCosmeticsData.filter(item => item.type === 'cardback'),
            backgrounds: fallbackCosmeticsData.filter(item => item.type === 'background'),
            playmats: fallbackCosmeticsData.filter(item => item.type === 'playmat')
        };
    }
}