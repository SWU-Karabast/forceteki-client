import { CosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';

/**
 * Service for communicating with the forceteki server API
 */
export class ServerApiService {
    private baseUrl: string;

    constructor() {
        // Use the game server URL from environment variables
        // Default to localhost:3001 which is the typical game server port
        this.baseUrl = process.env.NEXT_PUBLIC_ROOT_URL || 'http://localhost:3001';
    }

    /**
     * Wrapper for fetch requests with error handling
     */
    private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`ServerApiService error for ${url}:`, error);
            throw error;
        }
    }

    // Cosmetics API methods
    public async getCosmeticsAsync(): Promise<CosmeticOption[]> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            cosmetics: CosmeticOption[];
            count: number;
        }>(`${this.baseUrl}/api/cosmetics`);

        return response.cosmetics;
    }

    public async saveCosmeticAsync(cosmetic: CosmeticOption, cookies?: string): Promise<CosmeticOption> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
            cosmetic: CosmeticOption;
        }>(`${this.baseUrl}/api/cosmetics`, {
            method: 'POST',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
            body: JSON.stringify({ cosmetic }),
        });

        return response.cosmetic;
    }

    public async deleteCosmeticAsync(cosmeticId: string, cookies?: string): Promise<void> {
        await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
        }>(`${this.baseUrl}/api/cosmetics/${cosmeticId}`, {
            method: 'DELETE',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });
    }

    // Additional cleanup methods for admin operations
    public async clearAllCosmeticsAsync(cookies?: string): Promise<{ deletedCount: number }> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            deletedCount: number;
        }>(`${this.baseUrl}/api/cosmetics/cleanup/all`, {
            method: 'DELETE',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return { deletedCount: response.deletedCount };
    }

    public async resetCosmeticsToDefaultAsync(cookies?: string): Promise<{ message: string; deletedCount: number }> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
            deletedCount: number;
        }>(`${this.baseUrl}/api/cosmetics/cleanup/reset`, {
            method: 'DELETE',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return { message: response.message, deletedCount: response.deletedCount };
    }
}

// Singleton pattern for server API service
let serverApiService: ServerApiService;

/**
 * Get a properly initialized server API service
 */
export function getServerApiService(): ServerApiService {
    if (!serverApiService) {
        serverApiService = new ServerApiService();
    }
    return serverApiService;
}