/**
 * Why a sign-in was refused, passed to the home page in the `authError` query parameter so it can explain.
 * Shared by the NextAuth callbacks (server side) and the user context (client side).
 */
export const AuthErrorQueryParam = 'authError';
export const AuthErrorProviderQueryParam = 'provider';

/** The sign-in's provider has not verified the email address it gave, or gave none. */
export const EmailNotVerifiedAuthError = 'email-unverified';

/** Where to send a user whose sign-in was refused because the provider has not verified their email. */
export function emailNotVerifiedRedirectUrl(provider: string): string {
    const params = new URLSearchParams({ [AuthErrorQueryParam]: EmailNotVerifiedAuthError, [AuthErrorProviderQueryParam]: provider });
    return `/?${params.toString()}`;
}

/** The game node refused a valid session because its email is not verified (API code `EMAIL_NOT_VERIFIED`). */
export class EmailNotVerifiedError extends Error {
    constructor() {
        super('The email address of this sign-in is not verified');
        this.name = 'EmailNotVerifiedError';
    }
}
