import { NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { withAdminAuth } from '@/app/_utils/AdminAuth';
import { AdminRole } from '@/app/_contexts/UserTypes';

export const dynamic = 'force-dynamic';

// TEMPORARY: checks that the server runtime can load a remote config value. Delete once confirmed.
// The id and key are fixed on purpose and must never come from the request.
const CONFIG_REGION = 'us-east-1';
const CONFIG_ID = 'karabast-secrets';
const CONFIG_KEY = 'KARABAST_CLIENT_CONFIG_CHECK';
const EXPECTED_VALUE = 'config-check-ok';

const client = new SecretsManagerClient({ region: CONFIG_REGION });

export const GET = withAdminAuth(AdminRole.Developer, async () => {
    try {
        const result = await client.send(new GetSecretValueCommand({ SecretId: CONFIG_ID }));
        const values = JSON.parse(result.SecretString ?? '') as Record<string, unknown> | null;
        const value = values?.[CONFIG_KEY];
        const hasKey = value !== undefined;
        const matches = value === EXPECTED_VALUE;
        console.log(`[ConfigCheck] Loaded ${CONFIG_ID}, has key: ${hasKey}, matches expected: ${matches}`);
        return NextResponse.json({ success: true, hasKey, matches });
    } catch (error) {
        // only the name: a JSON parse error's message can quote part of the stored config
        const name = error instanceof Error ? error.name : 'UnknownError';
        console.error(`[ConfigCheck] Failed to load ${CONFIG_ID}: ${name}`);
        return NextResponse.json({ success: false, error: name }, { status: 500 });
    }
});
