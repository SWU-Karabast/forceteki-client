import { NextResponse } from 'next/server';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { withAdminAuth } from '@/app/_utils/AdminAuth';
import { AdminRole } from '@/app/_contexts/UserTypes';

export const dynamic = 'force-dynamic';

// TEMPORARY: checks that the server runtime can load a remote config value. Delete once confirmed.
// The id is fixed on purpose and must never come from the request.
const CONFIG_REGION = 'us-east-1';
const CONFIG_ID = 'KARABAST_CLIENT_CONFIG_CHECK';
const EXPECTED_VALUE = 'config-check-ok';

const client = new SecretsManagerClient({ region: CONFIG_REGION });

export const GET = withAdminAuth(AdminRole.Developer, async () => {
    try {
        const result = await client.send(new GetSecretValueCommand({ SecretId: CONFIG_ID }));
        const matches = result.SecretString === EXPECTED_VALUE;
        console.log(`[ConfigCheck] Loaded ${CONFIG_ID}, matches expected: ${matches}`);
        return NextResponse.json({ success: true, matches });
    } catch (error) {
        const name = error instanceof Error ? error.name : 'UnknownError';
        console.error(`[ConfigCheck] Failed to load ${CONFIG_ID}: ${name}`);
        return NextResponse.json({ success: false, error: name }, { status: 500 });
    }
});
