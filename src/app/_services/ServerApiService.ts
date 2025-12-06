import { IRegisteredCosmeticOption } from '../_components/_sharedcomponents/Preferences/Preferences.types';


/**
 * Static helper class for communicating with the forceteki server API
 */
export class ServerApiService {
    private static baseUrl: string | undefined = process.env.NEXT_PUBLIC_ROOT_URL;

    /**
     * Wrapper for fetch requests with error handling
     */
    private static async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
        try {
            const response = await fetch(url, {
                ...options,
                credentials: 'include', // Include cookies in cross-origin requests
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
    public static async getCosmeticsAsync(): Promise<IRegisteredCosmeticOption[]> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            cosmetics: IRegisteredCosmeticOption[];
            count: number;
        }>(`${this.baseUrl}/api/cosmetics`);

        return response.cosmetics;
    }

    public static async saveCosmeticAsync(cosmetic: IRegisteredCosmeticOption, cookies?: string): Promise<IRegisteredCosmeticOption> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
            cosmetic: IRegisteredCosmeticOption;
        }>(`${this.baseUrl}/api/cosmetics`, {
            method: 'POST',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
            body: JSON.stringify({ cosmetic }),
        });

        return response.cosmetic;
    }

    public static async deleteCosmeticAsync(cosmeticId: string, cookies?: string): Promise<{ success: boolean; message: string }> {
        return await this.fetchWithErrorHandling<{
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
    public static async clearAllCosmeticsAsync(cookies?: string): Promise<{ deletedCount: number }> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            deletedCount: number;
        }>(`${this.baseUrl}/api/cosmetics`, {
            method: 'DELETE',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return { deletedCount: response.deletedCount };
    }

    public static async resetCosmeticsToDefaultAsync(cookies?: string): Promise<{ message: string; deletedCount: number }> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
            deletedCount: number;
        }>(`${this.baseUrl}/api/cosmetics-reset`, {
            method: 'POST',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return { message: response.message, deletedCount: response.deletedCount };
    }

    // Admin user management methods
    public static async userIsAdminAsync(cookies?: string): Promise<boolean> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
        }>(`${this.baseUrl}/api/user-is-admin`, {
            method: 'GET',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return response.success;
    }

    public static async userIsDevAsync(cookies?: string): Promise<boolean> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
        }>(`${this.baseUrl}/api/user-is-developer`, {
            method: 'GET',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return response.success;
    }

    public static async userIsModAsync(cookies?: string): Promise<boolean> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
        }>(`${this.baseUrl}/api/user-is-moderator`, {
            method: 'GET',
            headers: {
                ...(cookies && { Cookie: cookies }),
            },
        });

        return response.success;
    }
}