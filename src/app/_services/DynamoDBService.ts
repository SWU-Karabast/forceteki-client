import { DynamoDBClient, DynamoDBClientConfig } from '@aws-sdk/client-dynamodb';
import {
    DynamoDBDocumentClient,
    PutCommand,
    QueryCommand,
    QueryCommandOutput,
    DeleteCommand
} from '@aws-sdk/lib-dynamodb';
import { CosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';

// Singleton pattern for DynamoDB client
let dynamoDbService: DynamoDBService;

/**
 * Get a properly initialized DynamoDB service for Next.js
 */
export async function getDynamoDbServiceAsync(): Promise<DynamoDBService | null> {
    if (dynamoDbService) {
        return dynamoDbService;
    }

    dynamoDbService = new DynamoDBService();

    return dynamoDbService;
}

export class DynamoDBService {
    private client: DynamoDBDocumentClient | null = null;
    private tableName: string;

    constructor() {
        this.tableName = process.env.DYNAMODB_TABLE_NAME || 'KarabastGlobalTable';

        const dbClientConfig: DynamoDBClientConfig = {
            region: process.env.AWS_REGION || 'us-east-1',
        };

        // Use local DynamoDB if in development and specified
        if (process.env.NODE_ENV === 'development' && process.env.USE_LOCAL_DYNAMODB === 'true') {
            dbClientConfig.endpoint = 'http://localhost:8000';
            dbClientConfig.credentials = {
                accessKeyId: 'dummy',
                secretAccessKey: 'dummy'
            };
        } else {
            // Only initialize if we have the required environment variables
            if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
                console.warn('AWS credentials not found, DynamoDB service unavailable');
                return;
            }

            const credentials: any = {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            };

            // Add session token if available (for temporary credentials)
            if (process.env.AWS_SESSION_TOKEN) {
                credentials.sessionToken = process.env.AWS_SESSION_TOKEN;
            }

            dbClientConfig.credentials = credentials;
        }

        const dbClient = new DynamoDBClient(dbClientConfig);
        this.client = DynamoDBDocumentClient.from(dbClient);
    }

    /**
     * Wrapper for database operations with error handling
     */
    private async executeDbOperationAsync<T>(operation: () => Promise<T>, errorMessage: string): Promise<T> {
        try {
            return await operation();
        } catch (error) {
            console.error(`${errorMessage}:`, error);
            throw error;
        }
    }

    public async putItemAsync(item: Record<string, unknown>) {
        return this.executeDbOperationAsync(() => {
            const command = new PutCommand({
                TableName: this.tableName,
                Item: item
            });
            return this.client?.send(command) ?? Promise.reject('DynamoDB client not initialized');
        }, 'DynamoDB putItem error');
    }

    public async queryItemsAsync(pk: string, options: { beginsWith?: string } = {}): Promise<QueryCommandOutput> {
        return this.executeDbOperationAsync(() => {
            let keyConditionExpression = 'pk = :pk';
            const expressionAttributeValues: Record<string, unknown> = { ':pk': pk };

            if (options.beginsWith) {
                keyConditionExpression += ' AND begins_with(sk, :skPrefix)';
                expressionAttributeValues[':skPrefix'] = options.beginsWith;
            }

            const command = new QueryCommand({
                TableName: this.tableName,
                KeyConditionExpression: keyConditionExpression,
                ExpressionAttributeValues: expressionAttributeValues
            });

            return this.client?.send(command) ?? Promise.reject('DynamoDB client not initialized');
        }, 'DynamoDB queryItems error');
    }

    // Cosmetics-specific methods
    public async getCosmeticsAsync(): Promise<CosmeticOption[]> {
        return this.executeDbOperationAsync(async () => {
            const result = await this.queryItemsAsync('COSMETICS', { beginsWith: 'ITEM#' });
            return (result.Items || []).map((item: Record<string, unknown>) => ({
                id: item.id as string,
                title: item.title as string,
                type: item.type as 'cardback' | 'background' | 'playmat',
                path: item.path as string,
                darkened: item.darkened as boolean | undefined
            }));
        }, 'Error getting cosmetics data');
    }

    public async saveCosmeticAsync(cosmeticData: CosmeticOption) {
        return this.executeDbOperationAsync(() => {
            const item = {
                pk: 'COSMETICS',
                sk: `ITEM#${cosmeticData.id}`,
                ...cosmeticData,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            return this.putItemAsync(item);
        }, 'Error saving cosmetic item');
    }

    public async initializeCosmeticsAsync(cosmetics: CosmeticOption[]) {
        return this.executeDbOperationAsync(async () => {
            const savePromises = cosmetics.map(cosmetic => this.saveCosmeticAsync(cosmetic));
            await Promise.all(savePromises);
        }, 'Error initializing cosmetics data');
    }

    // Development cleanup methods
    public async deleteCosmeticAsync(cosmeticId: string) {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Cosmetic deletion is only allowed in development mode');
        }

        return this.executeDbOperationAsync(() => {
            const command = new DeleteCommand({
                TableName: this.tableName,
                Key: {
                    pk: 'COSMETICS',
                    sk: `ITEM#${cosmeticId}`
                }
            });
            return this.client?.send(command) ?? Promise.reject('DynamoDB client not initialized');
        }, 'Error deleting cosmetic item');
    }

    public async clearAllCosmeticsAsync() {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Cosmetic cleanup is only allowed in development mode');
        }

        return this.executeDbOperationAsync(async () => {
            // Get all cosmetics first
            const cosmetics = await this.getCosmeticsAsync();

            // Delete each cosmetic
            const deletePromises = cosmetics.map(cosmetic =>
                this.deleteCosmeticAsync(cosmetic.id)
            );

            await Promise.all(deletePromises);

            return { deletedCount: cosmetics.length };
        }, 'Error clearing all cosmetics');
    }

    public async resetCosmeticsToDefaultAsync() {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Cosmetic reset is only allowed in development mode');
        }

        return this.executeDbOperationAsync(async () => {
            // First clear all existing cosmetics
            const clearResult = await this.clearAllCosmeticsAsync();

            // Then reinitialize with defaults (this will be handled by fetchCosmeticsDataAsync)
            return {
                message: 'Cosmetics cleared. Defaults will be reinitialized on next fetch.',
                deletedCount: clearResult.deletedCount
            };
        }, 'Error resetting cosmetics to default');
    }
}