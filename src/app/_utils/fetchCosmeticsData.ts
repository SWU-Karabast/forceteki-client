import { s3ImageURL } from '@/app/_utils/s3Utils';
import { Cosmetics, CosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';
import { getDynamoDbServiceAsync } from '../_services/DynamoDBService';
import { randomUUID } from 'crypto';

const getFallbackCosmetics = (): CosmeticOption[] => [
    { id: randomUUID(), type: 'cardback', title: 'Default', path: s3ImageURL('game/swu-cardback.webp') },
    { id: randomUUID(), type: 'background', title: 'Default', path: '/default-background.webp' },
];

export const fetchCosmeticsDataAsync = async (): Promise<Cosmetics> => {
    try {
        // Try to get DynamoDB service
        const dynamoService = await getDynamoDbServiceAsync();

        if (dynamoService) {
            console.log('DynamoDB service available, fetching cosmetics...');

            // First check if we have cosmetics in DB
            let cosmeticsFromDb = await dynamoService.getCosmeticsAsync();

            // If no cosmetics in DB, initialize with fallback data
            if (cosmeticsFromDb.length === 0) {
                console.log('No cosmetics found in DynamoDB, initializing with default data...');
                const fallbackCosmetics = getFallbackCosmetics();

                await dynamoService.initializeCosmeticsAsync(fallbackCosmetics);
                cosmeticsFromDb = fallbackCosmetics;
            }

            // Organize by type
            const cosmetics: Cosmetics = {
                cardbacks: cosmeticsFromDb.filter(item => item.type === 'cardback'),
                backgrounds: cosmeticsFromDb.filter(item => item.type === 'background'),
                playmats: cosmeticsFromDb.filter(item => item.type === 'playmat')
            };

            console.log(`Fetched ${cosmeticsFromDb.length} cosmetics from DynamoDB`);
            return cosmetics;
        } else {
            console.log('DynamoDB service not available, using fallback data');
            const fallbackCosmetics = getFallbackCosmetics();

            return {
                cardbacks: fallbackCosmetics.filter(item => item.type === 'cardback'),
                backgrounds: fallbackCosmetics.filter(item => item.type === 'background'),
                playmats: fallbackCosmetics.filter(item => item.type === 'playmat')
            };
        }
    } catch (error) {
        console.error('Error fetching cosmetics from DynamoDB:', error);

        // Return fallback data on error
        const fallbackCosmetics = getFallbackCosmetics();
        return {
            cardbacks: fallbackCosmetics.filter(item => item.type === 'cardback'),
            backgrounds: fallbackCosmetics.filter(item => item.type === 'background'),
            playmats: fallbackCosmetics.filter(item => item.type === 'playmat')
        };
    }
}