import {
    IFindUserResponse, IModActionResponse,
    ICosmeticEntity, IServerSettings,
    IPlayerReportDetailResponse, IPlayerReportListResponse, IPlayerReportUpdateResponse,
    PlayerReportOutcome, PlayerReportStatus
} from '../_components/_sharedcomponents/Preferences/Preferences.types';


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
                throw new Error(errorData.error || errorData.message || `HTTP ${response.status}: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error(`ServerApiService error for ${url}:`, error);
            throw error;
        }
    }

    // Cosmetics API methods
    public static async getCosmeticsAsync(): Promise<{ cosmetics: ICosmeticEntity[], isContributor: boolean }> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            cosmetics: ICosmeticEntity[];
            count: number;
            isContributor: boolean;
        }>(`${this.baseUrl}/api/cosmetics`);

        return {
            cosmetics: response.cosmetics,
            isContributor: response.isContributor
        };
    }

    public static async saveCosmeticAsync(cosmetic: ICosmeticEntity, cookies?: string): Promise<ICosmeticEntity> {
        const response = await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
            cosmetic: ICosmeticEntity;
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

    public static async findUserAsync(searchQuery: string): Promise<IFindUserResponse> {
        return await this.fetchWithErrorHandling<IFindUserResponse>(
            `${this.baseUrl}/api/mod/find-user`,
            {
                method: 'POST',
                body: JSON.stringify({ searchQuery }),
            }
        );
    }

    public static async submitModActionAsync(
        playerId: string,
        actionType: string,
        note: string,
        durationDays?: number,
        reportId?: string,
    ): Promise<{ success: boolean; message: string; }> {
        return await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
        }>(
            `${this.baseUrl}/api/mod/submit-action`,
            {
                method: 'POST',
                body: JSON.stringify({ playerId, actionType, note, durationDays, reportId }),
            }
        );
    }

    public static async cancelModActionAsync(
        playerId: string,
        modActionId: string,
    ): Promise<{ success: boolean; message: string }> {
        return await this.fetchWithErrorHandling<{
            success: boolean;
            message: string;
        }>(
            `${this.baseUrl}/api/mod/cancel-action`,
            {
                method: 'POST',
                body: JSON.stringify({ playerId, modActionId }),
            }
        );
    }

    public static async getModActionsForPlayerAsync(
        playerId: string,
    ): Promise<IFindUserResponse> {
        return await this.fetchWithErrorHandling<IFindUserResponse>(
            `${this.baseUrl}/api/mod/find-user`,
            {
                method: 'POST',
                body: JSON.stringify({ searchQuery: playerId }),
            }
        );
    }

    // Player report API methods
    public static async listPlayerReportsAsync(status: PlayerReportStatus, beforeMonth?: string): Promise<IPlayerReportListResponse> {
        return await this.fetchWithErrorHandling<IPlayerReportListResponse>(
            `${this.baseUrl}/api/mod/reports/list`,
            {
                method: 'POST',
                body: JSON.stringify({ status, beforeMonth }),
            }
        );
    }

    public static async getOpenPlayerReportCountAsync(): Promise<number> {
        const result = await this.fetchWithErrorHandling<{ success: boolean; openCount: number }>(
            `${this.baseUrl}/api/mod/reports/open-count`
        );
        return result.openCount;
    }

    public static async getPlayerReportAsync(reportId: string): Promise<IPlayerReportDetailResponse> {
        return await this.fetchWithErrorHandling<IPlayerReportDetailResponse>(
            `${this.baseUrl}/api/mod/reports/get`,
            {
                method: 'POST',
                body: JSON.stringify({ reportId }),
            }
        );
    }

    public static async claimPlayerReportAsync(reportId: string): Promise<IPlayerReportUpdateResponse> {
        return await this.fetchWithErrorHandling<IPlayerReportUpdateResponse>(
            `${this.baseUrl}/api/mod/reports/claim`,
            {
                method: 'POST',
                body: JSON.stringify({ reportId }),
            }
        );
    }

    public static async closePlayerReportAsync(reportId: string, outcome: PlayerReportOutcome, closingNote?: string): Promise<IPlayerReportUpdateResponse> {
        return await this.fetchWithErrorHandling<IPlayerReportUpdateResponse>(
            `${this.baseUrl}/api/mod/reports/close`,
            {
                method: 'POST',
                body: JSON.stringify({ reportId, outcome, closingNote }),
            }
        );
    }

    public static async reopenPlayerReportAsync(reportId: string): Promise<IPlayerReportUpdateResponse> {
        return await this.fetchWithErrorHandling<IPlayerReportUpdateResponse>(
            `${this.baseUrl}/api/mod/reports/reopen`,
            {
                method: 'POST',
                body: JSON.stringify({ reportId }),
            }
        );
    }

    // Server settings API methods
    public static async getServerSettingsAsync(): Promise<IServerSettings> {
        return await this.fetchWithErrorHandling<IServerSettings>(
            `${this.baseUrl}/api/server-settings`,
            { method: 'GET' }
        );
    }

    public static async setServerSettingsAsync(
        updates: { gamesEnabled?: boolean; maintenanceMessage?: string },
    ): Promise<{ success: boolean; settings: IServerSettings }> {
        return await this.fetchWithErrorHandling<{
            success: boolean;
            settings: IServerSettings;
        }>(
            `${this.baseUrl}/api/mod/server-settings`,
            {
                method: 'POST',
                body: JSON.stringify(updates),
            }
        );
    }
}